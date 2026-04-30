import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';
import { 
    generateWithdrawalQueryId
} from './js/bridgeContract.js';

// Cosmos testnet (Palmito): chain_id layertest-5; LCD + Sepolia bridge REST share this host.
const LAYER_TESTNET_CHAIN_ID = 'layertest-5';
const LAYER_TESTNET_LCD = 'https://node-palmito.tellorlayer.com';
const LAYER_TESTNET_RPC = 'https://node-palmito.tellorlayer.com/rpc';

const SEPOLIA_TOKEN_BRIDGE_ADDRESS = '0x55355157703A44f7516FBB831333317E98944e32';
const ETHEREUM_MAINNET_TOKEN_BRIDGE_ADDRESS = '0x6ec401744008f4B018Ed9A36f76e6629799Ee50E';
const SEPOLIA_V2_STARTING_WITHDRAW_ID = 0;

/** Migrate deprecated dev chain id saved in localStorage / wallet. */
function normalizeCosmosChainId(chainId) {
  if (!chainId || typeof chainId !== 'string') {
    return chainId;
  }
  return chainId === 'layer-internal' ? 'layertest-5' : chainId;
}

function isLayerCosmosTestnet(chainId) {
  return normalizeCosmosChainId(chainId) === 'layertest-5';
}

// Create the App object
const App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  bridgeAddress: {},
  tokenAddress: {},
  web3: null,
  ethers: null,  // Add ethers instance
  tokenDecimals: 0,
  depositLimit: null,
  depositId: 0,
  deposits: {},
  isProcessingAccountChange: false,
  keplrProvider: null,
  isKeplrConnected: false,
  connectedWallet: null,
  keplrAddress: null,
  currentBridgeDirection: 'layer', // 'layer' or 'ethereum'
  cachedCosmosWalletType: null, // Cache the selected Cosmos wallet type
  delegatorRewardRows: [],
  selectorAvailableTipsRaw: '0',
  rewardDestinationValidators: [],
  debug: typeof window !== 'undefined' &&
    window.localStorage &&
    window.localStorage.getItem('tellor_debug') === '1',
  ethereumRestrictedReason: '',

  _depositLimit: function() {
    return App.depositLimit;
  },

  debugLog: function(...args) {
    if (App.debug) {
      console.log(...args);
    }
  },

  /** Pull revert hex from Web3 / provider error objects (walks nested cause / innerError). */
  extractRevertData: function (err) {
    if (!err) {
      return null;
    }
    const seen = new Set();
    const walk = (e, depth) => {
      if (!e || depth > 8 || seen.has(e)) {
        return null;
      }
      seen.add(e);
      const candidates = [
        e.data,
        e?.data?.data,
        e?.data?.originalError?.data,
        e?.cause?.data,
        e?.innerError?.data,
        e?.reason
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && c.startsWith('0x') && c.length >= 10) {
          return c;
        }
      }
      return walk(e.cause, depth + 1) || walk(e.innerError, depth + 1);
    };
    return walk(err, 0);
  },

  /** MetaMask sometimes puts revert data only in the message string, not err.data. */
  parseRevertHexFromString: function (s) {
    if (!s || typeof s !== 'string') {
      return null;
    }
    const panic = s.match(/0x4e487b71[0-9a-f]{64}/i);
    if (panic) {
      return panic[0].toLowerCase();
    }
    const any = s.match(/0x[0-9a-f]{74,}/gi);
    if (any) {
      for (const h of any) {
        if (h.toLowerCase().startsWith('0x4e487b71')) {
          return h.slice(0, 74).toLowerCase();
        }
      }
    }
    return null;
  },

  /** Pull Error(string) ABI blob from MetaMask message when err.data is missing. */
  parseErrorStringDataFromMessage: function (s) {
    if (!s || typeof s !== 'string') {
      return null;
    }
    const m = s.match(/0x08c379a0[0-9a-f]{128,}/i);
    return m ? m[0].toLowerCase() : null;
  },

  /**
   * Decode Solidity revert Error(string) (selector 0x08c379a0 + ABI tail).
   * Used when defaultAbiCoder.decode(['string'], …) fails on some wallet/provider payloads.
   */
  decodeSolidityErrorString: function (dataHex) {
    if (!App.ethers || !dataHex || typeof dataHex !== 'string') {
      return null;
    }
    const h = dataHex.trim();
    if (!h.toLowerCase().startsWith('0x08c379a0') || h.length < 10 + 64) {
      return null;
    }
    try {
      const body = ethers.utils.arrayify(h).subarray(4);
      const off = ethers.BigNumber.from(body.subarray(0, 32)).toNumber();
      if (!Number.isFinite(off) || off < 0 || off > body.length - 32) {
        return null;
      }
      const strChunk = body.subarray(off);
      const len = ethers.BigNumber.from(strChunk.subarray(0, 32)).toNumber();
      if (!Number.isFinite(len) || len < 0 || len > 20000 || 32 + len > strChunk.length) {
        return null;
      }
      const out = ethers.utils.toUtf8String(strChunk.subarray(32, 32 + len)).trim();
      return out || null;
    } catch (_) {
      return null;
    }
  },

  /** On-chain bridge amounts (e.g. withdrawDetails.pendingAmount) use TOKEN_DECIMAL_PRECISION_MULTIPLIER. */
  bridgeTrbDecimalsFromMultiplier: function (multRaw) {
    try {
      const s = ethers.BigNumber.from(multRaw).toString();
      const n = Number(s);
      if (Number.isFinite(n) && n > 0) {
        const d = Math.round(Math.log10(n));
        if (d >= 0 && d <= 20) {
          return d;
        }
      }
    } catch (_) {
      /* ignore */
    }
    return 12;
  },

  /** Human TRB from raw uint (Layer API uses 1e6; bridge contract uses multiplier, often 1e12). */
  formatBridgePendingTrb: function (raw, decimals) {
    try {
      const d = Number.isFinite(decimals) && decimals >= 0 ? Math.min(20, decimals) : 12;
      return parseFloat(ethers.utils.formatUnits(String(raw), d));
    } catch (_) {
      const n = Number(raw);
      return Number.isFinite(n) ? n / 1e12 : 0;
    }
  },

  /**
   * On-chain pendingAmount may not match TOKEN_DECIMAL_PRECISION_MULTIPLIER on all builds.
   * Prefer decimals that scale pending close to the main withdrawal TRB (Layer amount uses 1e6).
   */
  choosePendingTrbDecimals: function (rawPending, bridgeDefaultDecimals, mainTrbHint) {
    const s = String(rawPending == null ? '0' : rawPending).trim();
    if (!/^\d+$/.test(s) || s === '0') {
      return bridgeDefaultDecimals;
    }
    const hint = Number.isFinite(mainTrbHint) && mainTrbHint > 0 ? mainTrbHint : null;
    const candidates = [...new Set([bridgeDefaultDecimals, 12, 8, 6, 18])].filter(
      (d) => Number.isFinite(d) && d >= 0 && d <= 20
    );
    let bestD = bridgeDefaultDecimals;
    let bestScore = Infinity;
    for (const d of candidates) {
      try {
        const v = parseFloat(ethers.utils.formatUnits(s, d));
        if (v < 1e-12 || v > 1e12 || !Number.isFinite(v)) {
          continue;
        }
        let score;
        if (hint != null && hint >= 1e-6 && hint < 1e9) {
          if (v > hint * 1e5 || v < hint / 1e5) {
            continue;
          }
          const ratio = Math.max(v, hint) / Math.min(v, hint);
          score = Math.log10(ratio + 1e-12);
        } else {
          score = Math.abs(Math.log10(v + 1e-12));
        }
        if (score < bestScore) {
          bestScore = score;
          bestD = d;
        }
      } catch (_) {
        /* skip */
      }
    }
    return bestD;
  },

  /** Custom errors from Tellor TokenBridge (selectors from Solidity `error Name()`). */
  BRIDGE_CUSTOM_ERROR_MESSAGES: {
    '0xcabeb655':
      'InsufficientVotingPower() — signed validator power is below the Layer checkpoint threshold. Re-request attestation so enough validators sign this snapshot, and ensure the valset/checkpoint_params API calls use the same timestamp as the attestation.'
  },

  /** Decode Panic(uint256), Error(string), or custom error summary. */
  decodeContractError: function (err) {
    let data = App.extractRevertData(err);
    if (!data && err && typeof err.message === 'string') {
      data = App.parseRevertHexFromString(err.message) || App.parseErrorStringDataFromMessage(err.message);
    }
    if (data && data.startsWith('0x4e487b71') && data.length >= 74 && App.ethers) {
      try {
        const code = App.ethers.BigNumber.from('0x' + data.slice(10, 74)).toNumber();
        const panicLabel = {
          0x00: 'generic panic',
          0x01: 'assertion failed',
          0x11: 'arithmetic overflow/underflow',
          0x12: 'division or modulo by zero',
          0x21: 'enum out of range',
          0x22: 'storage byte array encoding error',
          0x31: 'pop on empty array',
          0x32: 'array index out of bounds',
          0x41: 'memory allocation overflow'
        };
        const label = panicLabel[code] || `panic 0x${code.toString(16)}`;
        const limitHint =
          code === 0x11
            ? ' Common when the withdrawal is larger than the current **bridge withdraw limit**: claim the amount that fits with **Process withdrawal**, then use **Claim Extra** for the rest after the limit resets (see your row in the withdrawal table). Also possible: attestation amount vs on-chain withdraw state mismatch — try a fresh attestation after the partial claim.'
            : ' Often inconsistent attestation vs valset/report — request attestation again; if it persists, compare Layer bridge API fields to what the Sepolia contract expects.';
        return `Solidity ${label}. Claim simulation failed before any tx was sent (no Etherscan link).${limitHint}`;
      } catch (_) {
        /* ignore */
      }
    }
    if (data && data.startsWith('0x08c379a0') && data.length > 138 && App.ethers) {
      try {
        const decoded = App.ethers.utils.defaultAbiCoder.decode(['string'], '0x' + data.slice(10));
        const text = decoded[0];
        if (text && typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      } catch (_) {
        /* ignore */
      }
      const manual = App.decodeSolidityErrorString(data);
      if (manual) {
        return manual;
      }
    }
    if (data && data.length >= 10) {
      const sel = data.slice(0, 10);
      const known = App.BRIDGE_CUSTOM_ERROR_MESSAGES[sel];
      if (known) {
        return known;
      }
      if (data.length <= 10) {
        return `Contract reverted (custom error ${sel}). Often valset/checkpoint mismatch with attestation, or bridge rules (e.g. withdraw limit). Compare valset to snapshot attestation on your node.`;
      }
      if (data.startsWith('0x08c379a0')) {
        const manual = App.decodeSolidityErrorString(data);
        if (manual) {
          return manual;
        }
        const approxBytes = Math.max(0, Math.floor((data.length - 2) / 2));
        return (
          `The bridge contract reverted during simulation (Error string could not be decoded, ~${approxBytes} bytes of revert data). ` +
          `Most often this means **step 2 — Request attestation** has not been completed (or signatures are not on the bridge API yet). ` +
          `Use your Cosmos wallet to request attestation, wait if your network requires a delay after the withdrawal request, then try **Claim withdrawal** again.`
        );
      }
      return `Contract reverted (${sel}, ${data.length} bytes).`;
    }
    const fallback = err.message || String(err);
    const fromMsg = App.parseErrorStringDataFromMessage(fallback);
    if (fromMsg && fromMsg.startsWith('0x08c379a0') && fromMsg.length > 138 && App.ethers) {
      try {
        const decoded = App.ethers.utils.defaultAbiCoder.decode(['string'], '0x' + fromMsg.slice(10));
        if (decoded[0] && String(decoded[0]).trim()) {
          return String(decoded[0]).trim();
        }
      } catch (_) {
        /* ignore */
      }
      const manualMsg = App.decodeSolidityErrorString(fromMsg);
      if (manualMsg) {
        return manualMsg;
      }
    }
    return fallback.replace(/\s+0x08c379a0[0-9a-f]{80,}/gi, '').trim() || fallback;
  },

  /**
   * MetaMask caps dapp gas at 16777216. When estimate succeeds above that, cap with buffer.
   * When estimate reverts, do not mask with a high gas limit — surface the revert (same as on-chain failure).
   */
  estimateBridgeClaimGas: async function (method) {
    const MM_DAPP_GAS_CAP = 16777216;
    try {
      const est = await method.estimateGas({ from: App.account });
      const n = Number(est);
      if (!Number.isFinite(n) || n <= 0) {
        return MM_DAPP_GAS_CAP;
      }
      return Math.min(Math.ceil(n * 1.2), MM_DAPP_GAS_CAP);
    } catch (e) {
      const decoded = App.decodeContractError(e);
      throw new Error(decoded || e.message || 'Gas estimation failed');
    }
  },

  init: function () {
    // Prevent duplicate initialization when multiple boot paths call App.init().
    if (App._initPromise) {
      return App._initPromise;
    }

    App._initPromise = new Promise((resolve, reject) => {
      try {
        // Initialize ethers
        App.ethers = ethers;
        
        // Restore persisted network selections before anything else
        const savedCosmosChain = localStorage.getItem('tellor_cosmos_chain_id');
        if (savedCosmosChain && (savedCosmosChain === 'tellor-1' || isLayerCosmosTestnet(savedCosmosChain))) {
          const normalized = normalizeCosmosChainId(savedCosmosChain);
          if (normalized !== savedCosmosChain) {
            localStorage.setItem('tellor_cosmos_chain_id', normalized);
          }
          App.cosmosChainId = normalized;
        }

        // Initialize delegate section immediately (doesn't depend on Web3 or CosmJS)
        App.initDelegateSection();
        
        // Check CosmJS dependency for functions that need it
        if (!window.cosmjsLoaded) {
          console.warn('CosmJS not loaded yet - some Cosmos functions may not work');
        } else if (typeof window.cosmjs === 'undefined' || typeof window.cosmjs.stargate === 'undefined') {
          console.warn('CosmJS not properly loaded - some Cosmos functions may not work');
        }
        
        App.initWeb3()
          .then(() => {
            App.initInputValidation();
            App.initBridgeDirectionUI(); // Initialize bridge direction UI
            App.initWalletManagerDropdown(); // Initialize wallet manager dropdown
        App.initDisputeProposer(); // Initialize dispute proposer
        
        // Add wallet connection listener for dispute refresh
        document.addEventListener('walletConnected', () => {
            if (window.App && window.App.refreshDisputesOnWalletConnect) {
                window.App.refreshDisputesOnWalletConnect();
            }
            if (window.App && window.App.isKeplrConnected && window.App.keplrAddress) {
                window.App.populateValidatorDropdown().catch(() => {});
                window.App.populateReporterDropdown().catch(() => {});
                window.App.refreshCurrentStatus().catch(() => {});
            }
        });
            
            // Initialize network display
            App.updateNetworkDisplay();
            App.updateCosmosNetworkDisplay();
            
            // Initialize withdrawal history table
            App.updateWithdrawalHistory();
            
            // Auto-reconnect wallets from previous session
            App.autoReconnectWallets();
            
            // Remove any existing event listeners
            const walletButton = document.getElementById('walletButton');
            const keplrButton = document.getElementById('keplrButton');

            if (walletButton) {
                const newWalletButton = walletButton.cloneNode(true);
                walletButton.parentNode.replaceChild(newWalletButton, walletButton);
                newWalletButton.addEventListener('click', async () => {
                    try {
                        if (App.isConnected) {
                            await App.disconnectMetaMask();
                        } else {
                            await App.connectMetaMask();
                        }
                    } catch (error) {
                        // console.error(...);
                        App.handleError(error);
                    }
                });
            }

            if (keplrButton) {
                const newKeplrButton = keplrButton.cloneNode(true);
                keplrButton.parentNode.replaceChild(newKeplrButton, keplrButton);
                newKeplrButton.addEventListener('click', async () => {
                    try {
                        if (App.isKeplrConnected) {
                            await App.disconnectKeplr();
                        } else {
                            await App.connectKeplr();
                            // Refresh disputes if on Vote on Dispute tab after connection
                            setTimeout(() => {
                                if (window.App && window.App.refreshDisputesOnWalletConnect) {
                                    window.App.refreshDisputesOnWalletConnect();
                                }
                            }, 1000);
                        }
                    } catch (error) {
                        // console.error(...);
                        App.handleError(error);
                    }
                });
            }



            // Handle network toggle button
            const networkToggleBtn = document.getElementById('network-toggle-btn');
            if (networkToggleBtn) {
                const newNetworkToggleBtn = networkToggleBtn.cloneNode(true);
                networkToggleBtn.parentNode.replaceChild(newNetworkToggleBtn, networkToggleBtn);
                newNetworkToggleBtn.addEventListener('click', async () => {
                    try {
                        await App.switchNetwork();
                    } catch (error) {
                        // console.error(...);
                        App.handleError(error);
                    }
                });
            }

            // Handle Cosmos network toggle button
            const cosmosNetworkToggleBtn = document.getElementById('cosmos-network-toggle-btn');
            if (cosmosNetworkToggleBtn) {
                const newCosmosNetworkToggleBtn = cosmosNetworkToggleBtn.cloneNode(true);
                cosmosNetworkToggleBtn.parentNode.replaceChild(newCosmosNetworkToggleBtn, cosmosNetworkToggleBtn);
                newCosmosNetworkToggleBtn.addEventListener('click', async () => {
                    try {
                        await App.switchCosmosNetwork();
                    } catch (error) {
                        // console.error(...);
                        App.handleError(error);
                    }
                });
            }

            resolve();
          })
          .catch(error => {
            // console.error(...);
            App._initPromise = null;
            reject(error);
          });
      } catch (error) {
        // console.error(...);
        App._initPromise = null;
        reject(error);
      }
    });
    return App._initPromise;
  },

  autoReconnectWallets: async function() {
    // Silently reconnect wallets that were connected before page refresh
    let savedCosmosWalletType = localStorage.getItem('tellor_cosmos_wallet_type');
    if (savedCosmosWalletType === 'leap') {
      localStorage.removeItem('tellor_cosmos_wallet_type');
      savedCosmosWalletType = null;
    }
    const savedCosmosChainId = localStorage.getItem('tellor_cosmos_chain_id');
    const savedEthWalletType = localStorage.getItem('tellor_eth_wallet_type');
    const savedEthConnected = localStorage.getItem('tellor_eth_wallet_connected');

    if (savedCosmosWalletType && window.cosmosWalletAdapter) {
      try {
        if (savedCosmosChainId) {
          const normalized = normalizeCosmosChainId(savedCosmosChainId);
          if (normalized !== savedCosmosChainId) {
            localStorage.setItem('tellor_cosmos_chain_id', normalized);
          }
          App.cosmosChainId = normalized;
        }
        await App.connectCosmosWallet(savedCosmosWalletType);
        // Auto-reconnect succeeded; no-op log by default to reduce console noise.
      } catch (err) {
        console.warn('Auto-reconnect Cosmos wallet failed:', err.message);
        localStorage.removeItem('tellor_cosmos_wallet_type');
        localStorage.removeItem('tellor_cosmos_chain_id');
      }
    }

    if (savedEthConnected === 'true' && savedEthWalletType) {
      try {
        App._isAutoReconnecting = true;
        if (window.ethereumWalletAdapter) {
          await App.connectEthereumWallet(savedEthWalletType);
        } else if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await App.connectMetaMask();
          }
        }
        // Auto-reconnect succeeded; no-op log by default to reduce console noise.
      } catch (err) {
        console.warn('Auto-reconnect Ethereum wallet failed:', err.message);
        localStorage.removeItem('tellor_eth_wallet_type');
        localStorage.removeItem('tellor_eth_wallet_connected');
        localStorage.removeItem('tellor_eth_chain_id');
      } finally {
        delete App._isAutoReconnecting;
      }
    }
  },

  initWeb3: function () {
    return new Promise((resolve, reject) => {
      try {
        // Check for Ethereum wallet adapter
        const hasEthereumAdapter = typeof window.ethereumWalletAdapter !== 'undefined';
        const hasKeplr = typeof window.keplr !== 'undefined';
        
        // Handle Ethereum wallets
        if (hasEthereumAdapter) {
          const availableWallets = window.ethereumWalletAdapter.detectWallets();
          
          if (availableWallets.length > 0) {
            const walletButton = document.getElementById("walletButton");
            if (walletButton) {
              walletButton.disabled = false;
              walletButton.innerHTML = 'Connect Ethereum Wallet';
            }
          }
        } else {
          const hasMetaMask = typeof window.ethereum !== 'undefined';
          
          if (hasMetaMask) {
            App.web3Provider = window.ethereum;
            App.web3 = new Web3(window.ethereum);

            const walletButton = document.getElementById("walletButton");
            if (walletButton) walletButton.disabled = false;
          }
        }

        // Always listen for chain/account changes on window.ethereum
        // (needed regardless of wallet adapter vs legacy path)
        if (typeof window.ethereum !== 'undefined') {
          const handleChainChanged = async (chainIdHex) => {
            const newChainId = typeof chainIdHex === 'string' && chainIdHex.startsWith('0x')
              ? parseInt(chainIdHex, 16)
              : parseInt(chainIdHex);
            
            App.chainId = newChainId;

            if (App.isConnected) {
              localStorage.setItem('tellor_eth_chain_id', String(newChainId));
              await App.refreshEthereumConnectionState();
            }

            if (App.updateNetworkDisplay) {
              App.updateNetworkDisplay();
            }
            if (App.updateWalletManagerToggleText) {
              App.updateWalletManagerToggleText();
            }
            if (App.updateNetworkCompatibilityWarning) {
              App.updateNetworkCompatibilityWarning();
            }
          };

          const handleAccountsChanged = (accounts) => {
            App.handleAccountsChanged(accounts);
          };

          const handleDisconnect = () => {
            App.disconnectMetaMask();
          };

          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);

          window.ethereum.on('chainChanged', handleChainChanged);
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('disconnect', handleDisconnect);
        }
        
        // Handle Cosmos wallets
        const hasCosmosWallet = hasKeplr || 
                               typeof window.cosmostation !== 'undefined' || 
                               typeof window.station !== 'undefined';
        
        if (hasCosmosWallet) {
          // Enable Cosmos wallet buttons
          const keplrButton = document.getElementById("keplrButton");
          if (keplrButton) {
            keplrButton.disabled = false;
            // Update button text to be more generic
            keplrButton.innerHTML = 'Connect Cosmos Wallet';
          }
        }
        
        resolve();
      } catch (error) {
        // console.error(...);
        resolve();
      }
    });
  },

  connectMetaMask: async function() {
    try {
        // Use wallet adapter if available, otherwise fall back to direct MetaMask
        if (window.ethereumWalletAdapter) {
            return await this.connectEthereumWallet();
        } else {
            return await this.connectMetaMaskLegacy();
        }
    } catch (error) {
        // console.error(...);
        App.handleError(error);
        throw error;
    }
  },

  connectEthereumWallet: async function(walletType = null) {
    try {
        if (!window.ethereumWalletAdapter) {
            throw new Error('Ethereum wallet adapter not available');
        }

        // Show wallet selection modal if no specific wallet type provided
        if (!walletType) {
            return new Promise((resolve, reject) => {
                window.ethereumWalletModal.open(async (selectedWalletType) => {
                    try {
                        const result = await this.connectEthereumWallet(selectedWalletType);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }

        // Connect to the selected wallet
        const connectionResult = await window.ethereumWalletAdapter.connectToWallet(walletType);
        
        // Set wallet state
        App.account = connectionResult.account;
        App.chainId = connectionResult.chainId;
        App.web3Provider = connectionResult.provider;
        App.web3 = connectionResult.web3;
        App.ethers = connectionResult.ethers;
        App.isConnected = true;
        
        // Persist connection for auto-reconnect on page refresh
        localStorage.setItem('tellor_eth_wallet_type', walletType);
        localStorage.setItem('tellor_eth_wallet_connected', 'true');
        
        // During auto-reconnect, respect whatever chain MetaMask is already on.
        // Only prompt/force mainnet on fresh user-initiated connects.
        if (!App._isAutoReconnecting && App.chainId !== 1) {
            try {
                await window.ethereumWalletAdapter.switchChain(1);
                App.chainId = 1;
            } catch (switchError) {
                if (App.chainId === 11155111) {
                    const userChoice = confirm('You are connected to Sepolia Testnet. Would you like to switch to Ethereum Mainnet? Click OK to switch to Mainnet, or Cancel to stay on Sepolia.');
                    if (userChoice) {
                        try {
                            await window.ethereumWalletAdapter.switchChain(1);
                            App.chainId = 1;
                        } catch (secondSwitchError) {
                            alert('Failed to switch to Mainnet. Please manually switch to Ethereum mainnet (chain ID: 1) in your wallet.');
                            throw new Error('Failed to switch to Mainnet network');
                        }
                    }
                } else {
                    alert('Please manually switch to Ethereum Mainnet (chain ID: 1) or Sepolia testnet (chain ID: 11155111) in your wallet and try again.');
                    throw new Error('Failed to switch to supported network');
                }
            }
        }
        
        // Validate chain ID
        try {
            validateChainId(App.chainId);
        } catch (error) {
            // console.error(...);
            alert('Please connect to Sepolia (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1).');
            throw error;
        }
        
        // Persist final chain ID for auto-reconnect
        localStorage.setItem('tellor_eth_chain_id', String(App.chainId));
        
        // Initialize contracts
        await App.initBridgeContract();
        await App.initTokenContract();
        
        // Update wallet buttons
        const truncatedAddress = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
        
        const walletButton = document.getElementById('walletButton');
        
        if (walletButton) {
            walletButton.innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();

        App.setPageParams({ skipDataRefresh: true });
        await App.refreshActiveViewData();
        
        // Update network display
        App.updateNetworkDisplay();
        
        return connectionResult;
        
    } catch (error) {
        // console.error(...);
        App.handleError(error);
        throw error;
    }
  },

  // Test function to verify Ethereum wallet connection
  testEthereumConnection: async function() {
    // console.log(...);
    App.debugLog('App state:', {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      web3: !!this.web3,
      web3Provider: !!this.web3Provider
    });
    
    if (this.isConnected && this.web3) {
      try {
        const balance = await this.web3.eth.getBalance(this.account);
        // console.log(...);
        
        // Test token balance if contracts are initialized
        if (this.contracts.Token) {
          const tokenBalance = await this.contracts.Token.methods.balanceOf(this.account).call();
          // console.log(...);
        }
        
        return true;
      } catch (error) {
        // console.error(...);
        return false;
      }
    } else {
      // console.log(...);
      return false;
    }
  },

  connectMetaMaskLegacy: async function() {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        // Request account access first
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
        }
        
        // Initialize Web3
        App.web3Provider = window.ethereum;
        App.web3 = new Web3(window.ethereum);
        
        // Get current chain ID using multiple methods for compatibility
        let chainId;
        try {
            // Try the newer method first
            chainId = await window.ethereum.request({ method: 'eth_chainId' });
            // Convert hex to decimal if needed
            if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                chainId = parseInt(chainId, 16);
            }
        } catch (error) {
            // Fallback to Web3 method
            chainId = await App.web3.eth.getChainId();
        }
        
        App.chainId = chainId;
        
        // During auto-reconnect, respect whatever chain MetaMask is already on.
        // Only prompt/force mainnet on fresh user-initiated connects.
        if (!App._isAutoReconnecting && chainId !== 1) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x1' }],
                });
                chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                    chainId = parseInt(chainId, 16);
                }
                App.chainId = chainId;
            } catch (switchError) {
                if (chainId === 11155111) {
                    const userChoice = confirm('You are connected to Sepolia Testnet. Would you like to switch to Ethereum Mainnet? Click OK to switch to Mainnet, or Cancel to stay on Sepolia.');
                    if (userChoice) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: '0x1' }],
                            });
                            chainId = await window.ethereum.request({ method: 'eth_chainId' });
                            if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                                chainId = parseInt(chainId, 16);
                            }
                            App.chainId = chainId;
                        } catch (secondSwitchError) {
                            alert('Failed to switch to Mainnet. Please manually switch to Ethereum mainnet (chain ID: 1) in your wallet.');
                            throw new Error('Failed to switch to Mainnet network');
                        }
                    }
                } else {
                    alert('Please manually switch to Ethereum Mainnet (chain ID: 1) or Sepolia testnet (chain ID: 11155111) in your wallet and try again.');
                    throw new Error('Failed to switch to supported network');
                }
            }
        }
        
        // Validate chain ID
        try {
            validateChainId(chainId);
        } catch (error) {
            alert('Please connect to Sepolia (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1).');
            throw error;
        }
        
        // Set account and connection state
        App.account = accounts[0];
        App.isConnected = true;
        
        // Persist connection for auto-reconnect on page refresh
        localStorage.setItem('tellor_eth_wallet_type', 'metamask');
        localStorage.setItem('tellor_eth_wallet_connected', 'true');
        localStorage.setItem('tellor_eth_chain_id', String(App.chainId));
        
        // Initialize contracts
        await App.initBridgeContract();
        await App.initTokenContract();
        
        // Update MetaMask button
        const truncatedAddress = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
        const walletButton = document.getElementById('walletButton');
        
        if (walletButton) {
            walletButton.innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();

        App.setPageParams({ skipDataRefresh: true });
        await App.refreshActiveViewData();
        
        // Update network display
        App.updateNetworkDisplay();
    } catch (error) {
        // console.error(...);
        App.handleError(error);
        throw error;
    }
  },

  connectKeplr: async function() {
    try {
        // Use wallet adapter if available, otherwise fall back to direct Keplr
        if (window.cosmosWalletAdapter) {
            return await this.connectCosmosWallet();
        } else {
            return await this.connectKeplrLegacy();
        }
    } catch (error) {
        // console.error(...);
        App.handleError(error);
        throw error;
    }
  },

  connectCosmosWallet: async function(walletType = null) {
    try {
        if (!window.cosmosWalletAdapter) {
            throw new Error('Wallet adapter not available');
        }

        // Show wallet selection modal if no specific wallet type provided
        if (!walletType) {
            return new Promise((resolve, reject) => {
                window.walletModal.open(async (selectedWalletType) => {
                    try {
                        const result = await this.connectCosmosWallet(selectedWalletType);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }

        // Set default chain ID if not already set
        if (!App.cosmosChainId) {
            App.cosmosChainId = 'tellor-1'; // Default to mainnet
        }
        
        // Try to detect the current network from the wallet adapter
        // Only query if not switching networks AND the adapter already has a live connection
        // (otherwise getChainId returns the adapter default and overwrites the restored value)
        if (!App.isNetworkSwitching && window.cosmosWalletAdapter.isConnected()) {
            try {
                const currentChainId = await window.cosmosWalletAdapter.getChainId();
                if (currentChainId === 'tellor-1') {
                    App.cosmosChainId = 'tellor-1';
                } else if (isLayerCosmosTestnet(currentChainId)) {
                    App.cosmosChainId = normalizeCosmosChainId(currentChainId);
                }
            } catch (error) {
                App.debugLog('Could not detect current network from wallet adapter, using default');
            }
        }
        
        // Connect to the selected wallet
        const connectionResult = await window.cosmosWalletAdapter.connectToWallet(walletType);
        
        // Cache the wallet type for future reconnections
        App.cachedCosmosWalletType = walletType;
        
        // Persist connection for auto-reconnect on page refresh
        localStorage.setItem('tellor_cosmos_wallet_type', walletType);
        localStorage.setItem('tellor_cosmos_chain_id', App.cosmosChainId || 'tellor-1');
        
        // Set wallet state
        App.keplrAddress = connectionResult.address;
        App.isKeplrConnected = true;
        App.connectedWallet = connectionResult.walletName;
        
        // Update button text with wallet name and address
        const truncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
        
        const keplrButton = document.getElementById('keplrButton');
        
        if (keplrButton) {
            keplrButton.innerHTML = `Disconnect  <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();
        
        // Update Cosmos network display
        App.updateCosmosNetworkDisplay();
        
        // Enable action buttons based on current section
        if (App.currentBridgeDirection === 'ethereum') {
            const withdrawButton = document.getElementById('withdrawButton');
            if (withdrawButton) {
                withdrawButton.disabled = false;
            }
        } else if (App.currentBridgeDirection === 'delegate') {
            const delegateButton = document.getElementById('delegateButton');
            if (delegateButton) {
                delegateButton.disabled = false;
            }
        }
        
        App.setPageParams({ skipDataRefresh: true });
        
        // Update UI for current direction after wallet connection
        App.updateUIForCurrentDirection();
        await App.refreshActiveViewData();
        
        // Dispatch wallet connected event for dispute refresh
        document.dispatchEvent(new CustomEvent('walletConnected'));
        
        return connectionResult;
    } catch (error) {
        // Clear connection state on error
        App.keplrAddress = null;
        App.isKeplrConnected = false;
        App.connectedWallet = null;
        App.cachedCosmosWalletType = null;
        
        throw error;
    }
  },

  connectKeplrLegacy: async function() {
    try {
        if (!window.keplr) {
            throw new Error('Keplr not installed');
        }
        
        // Set default chain ID if not already set
        if (!App.cosmosChainId) {
            App.cosmosChainId = 'tellor-1'; // Default to mainnet
        }
        
        let rpcUrl, restUrl, chainName;

        // Try to detect the current network from Keplr
        try {
            const currentChainId = await window.keplr.getChainId();
            if (currentChainId === 'tellor-1') {
                App.cosmosChainId = 'tellor-1';
            } else if (isLayerCosmosTestnet(currentChainId)) {
                App.cosmosChainId = normalizeCosmosChainId(currentChainId);
            }
        } catch (error) {
            App.debugLog('Could not detect current network from Keplr, using default');
        }

        rpcUrl = App.getCosmosRpcEndpoint();
        restUrl = App.getCosmosApiEndpoint();
        chainName = App.cosmosChainId === 'tellor-1'
            ? 'Tellor Layer'
            : 'Tellor Layer Testnet';

        // Suggest adding the chain if it's not already added
        await window.keplr.experimentalSuggestChain({
            chainId: App.cosmosChainId,
            chainName: chainName,
            rpc: rpcUrl,
            rest: restUrl,
            bip44: {
                coinType: 118
            },
            bech32Config: {
                bech32PrefixAccAddr: "tellor",
                bech32PrefixAccPub: "tellorpub",
                bech32PrefixValAddr: "tellorvaloper",
                bech32PrefixValPub: "tellorvaloperpub",
                bech32PrefixConsAddr: "tellorvalcons",
                bech32PrefixConsPub: "tellorvalconspub",
            },
            currencies: [
                {
                    coinDenom: "TRB",
                    coinMinimalDenom: "loya",
                    coinDecimals: 6,
                },
            ],
            feeCurrencies: [
                {
                    coinDenom: "TRB",
                    coinMinimalDenom: "loya",
                    coinDecimals: 6,
                    gasPriceStep: {
                        low: 0.01,
                        average: 0.025,
                        high: 0.04,
                    }
                },
            ],
            stakeCurrency: {
                coinDenom: "TRB",
                coinMinimalDenom: "loya",
                coinDecimals: 6,
            },
        });

        // Enable the chain
        await window.keplr.enable(App.cosmosChainId);
        
        // Get the offline signer
        const offlineSigner = window.keplr.getOfflineSigner(App.cosmosChainId);
        const accounts = await offlineSigner.getAccounts();
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found in Keplr');
        }
        
        // Set Keplr state
        App.keplrAddress = accounts[0].address;
        App.isKeplrConnected = true;
        App.connectedWallet = 'Keplr';
        
        // Persist connection for auto-reconnect on page refresh
        localStorage.setItem('tellor_cosmos_wallet_type', 'keplr');
        localStorage.setItem('tellor_cosmos_chain_id', App.cosmosChainId || 'tellor-1');
        
        // Update button text
        const truncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
        const keplrButton = document.getElementById('keplrButton');
        if (keplrButton) {
            keplrButton.innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();
        
        // Update Cosmos network display
        App.updateCosmosNetworkDisplay();
        
        // Enable action buttons based on current section
        if (App.currentBridgeDirection === 'ethereum') {
            const withdrawButton = document.getElementById('withdrawButton');
            if (withdrawButton) {
                withdrawButton.disabled = false;
            }
        } else if (App.currentBridgeDirection === 'delegate') {
            const delegateButton = document.getElementById('delegateButton');
            if (delegateButton) {
                delegateButton.disabled = false;
            }
        }
        
        App.setPageParams({ skipDataRefresh: true });
        
        // Update UI for current direction after wallet connection
        App.updateUIForCurrentDirection();
        await App.refreshActiveViewData();
    } catch (error) {
        // Clear connection state on error
        App.keplrAddress = null;
        App.isKeplrConnected = false;
        App.connectedWallet = null;
        App.cachedCosmosWalletType = null;
        
        throw error;
    }
  },

  disconnectMetaMask: async function() {
    try {
        if (!App.isConnected) {
            return;
        }

        // Clear auto-reconnect persistence
        localStorage.removeItem('tellor_eth_wallet_type');
        localStorage.removeItem('tellor_eth_wallet_connected');
        localStorage.removeItem('tellor_eth_chain_id');

        // Disconnect from wallet adapter if available
        if (window.ethereumWalletAdapter && window.ethereumWalletAdapter.isWalletConnected()) {
            window.ethereumWalletAdapter.disconnect();
        }

        // Clear MetaMask state
        App.account = '0x0';
        App.isConnected = false;
        App.web3 = null;
        App.web3Provider = null;
        
        // Update wallet button
        const walletButton = document.getElementById('walletButton');
        
        if (walletButton) {
            walletButton.innerHTML = 'Connect Ethereum Wallet';
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();

        // Update balances
        const currentBalance = document.getElementById('currentBalance');
        
        if (currentBalance) {
            currentBalance.textContent = 'Balance: 0 TRB';
        }

        // Hide Ethereum network group
        const networkDisplay = document.getElementById('network-display');
        const networkGroup = networkDisplay ? networkDisplay.closest('.network-group') : null;
        if (networkGroup) networkGroup.style.display = 'none';

        // Disable action buttons
        const approveButton = document.getElementById('approveButton');
        const depositButton = document.getElementById('depositButton');
        
        if (approveButton) approveButton.disabled = true;
        if (depositButton) depositButton.disabled = true;

        // Update page parameters
        App.setPageParams();
        
        // Dispatch wallet connected event for dispute refresh
        document.dispatchEvent(new CustomEvent('walletConnected'));
        
        // console.log(...);
    } catch (error) {
        // console.error(...);
        App.handleError(error);
    }
  },

  disconnectKeplr: async function() {
    try {
        // console.log(...);
        if (!App.isKeplrConnected) {
            // console.log(...);
            return;
        }

        // Use wallet adapter if available, otherwise use legacy method
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            await window.cosmosWalletAdapter.disconnect();
        } else {
                    // Legacy Keplr disconnect
        try {
            if (window.keplr && typeof window.keplr.disable === 'function') {
                await window.keplr.disable(App.cosmosChainId);
            }
        } catch (error) {
            // console.warn(...);
        }
        }

        // Clear auto-reconnect persistence
        localStorage.removeItem('tellor_cosmos_wallet_type');
        localStorage.removeItem('tellor_cosmos_chain_id');

        // Clear wallet state
        App.keplrAddress = null;
        App.isKeplrConnected = false;
        App.connectedWallet = null;
        App.cachedCosmosWalletType = null;

        // Update wallet button with generic text
        const keplrButton = document.getElementById('keplrButton');
        if (keplrButton) {
            keplrButton.innerHTML = 'Connect Cosmos Wallet';
            // console.log(...);
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();

        // Update balances
        const ethKeplrBalance = document.getElementById('ethKeplrBalance');
        if (ethKeplrBalance) {
            ethKeplrBalance.textContent = 'Balance: 0 TRB';
        }

        // Hide Cosmos network group
        const cosmosNetworkDisplay = document.getElementById('cosmos-network-display');
        const cosmosNetworkGroup = cosmosNetworkDisplay ? cosmosNetworkDisplay.closest('.network-group') : null;
        if (cosmosNetworkGroup) cosmosNetworkGroup.style.display = 'none';

        // Keep action buttons enabled but update their state
        const withdrawButton = document.getElementById('withdrawButton');
        const delegateButton = document.getElementById('delegateButton');
        if (withdrawButton) {
            withdrawButton.disabled = false;
            withdrawButton.title = 'Connect your Cosmos wallet to withdraw';
        }
        if (delegateButton) {
            delegateButton.disabled = false;
            delegateButton.title = 'Connect your Cosmos wallet to delegate';
        }
        
        // Reset validator dropdown when disconnecting
        const validatorDropdown = document.getElementById('delegateValidatorDropdown');
        if (validatorDropdown) {
            validatorDropdown.innerHTML = '<option value="">Connect Cosmos wallet to view validators</option>';
            validatorDropdown.disabled = true;
        }

        // Reset reporter dropdown when disconnecting
        const reporterDropdown = document.getElementById('reporterDropdown');
        if (reporterDropdown) {
            reporterDropdown.innerHTML = '<option value="">Connect Cosmos wallet to view reporters</option>';
            reporterDropdown.disabled = true;
        }

        App._hasCurrentReporterSelection = false;
        App.updateReporterActionButton();

        // Update withdrawal history to reflect wallet disconnection
        await this.updateWithdrawalHistory();

        // Update Cosmos network display
        App.updateCosmosNetworkDisplay();
        
        // Update network compatibility warning
        App.updateNetworkCompatibilityWarning();
        
        // Update page parameters
        App.setPageParams();
        // console.log(...);
    } catch (error) {
        // console.error(...);
        App.handleError(error);
    }
  },

  handleAccountsChanged: async function(accounts) {
    if(App.isProcessingAccountChange) return;
    App.isProcessingAccountChange = true;
    
    try {
        if (!accounts || !accounts.length) {
            // Expected when user disconnects account access in wallet UI.
            await App.disconnectMetaMask();
            return;
        }

        App.account = accounts[0];
        const truncatedAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`;
        
        // Get chain ID from wallet adapter if available, otherwise from Web3
        let chainId;
        if (window.ethereumWalletAdapter && window.ethereumWalletAdapter.isWalletConnected()) {
            const status = window.ethereumWalletAdapter.getConnectionStatus();
            chainId = status.chainId;
        } else {
            chainId = await App.web3.eth.getChainId();
        }
        App.chainId = chainId;
        App.isConnected = true;
        await App.refreshEthereumConnectionState();
        
        // Update the wallet button
        const walletButton = document.getElementById('walletButton');
        if (walletButton) {
            walletButton.innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();
        
        App.setPageParams();
        this.updateUIForCurrentDirection();
        
        // Update network compatibility warning
        App.updateNetworkCompatibilityWarning();
    } catch (error) {
        // Account-change events can race with connect/disconnect; keep this quiet for UX.
        console.warn('Ethereum accountsChanged handling warning:', error?.message || error);
        await App.disconnectMetaMask();
    } finally {
        App.isProcessingAccountChange = false;
    }
  },

  disconnectWallet: async function() {
    if(!App.isConnected) return; // Prevent unnecessary state updates
    
    try {
        // Atomic state update
        const updates = {
            account: '0x0',
            keplrAddress: null,
            isConnected: false,
            isKeplrConnected: false,
            balance: '0',
            chainId: null
        };
        
        // Update all states at once
        Object.assign(App, updates);
        
        // Update UI elements
        document.getElementById('walletButton').textContent = 'Connect Wallet';
        document.getElementById("currentBalance").innerHTML = 
            `<span class="connected-address-style">0 TRB</span>`;
        App.updateConnectedAddress();
        
        // Update network compatibility warning
        App.updateNetworkCompatibilityWarning();
        
        // Clear any pending transactions or subscriptions
        if(App.web3 && App.web3.eth) {
            await App.web3.eth.clearSubscriptions();
        }
    } catch (error) {
        // console.error(...);
        App.handleError(error);
    }
  },

  updateConnectedAddress: function() {
    const connectedAddressElement = document.getElementById("connectedAddress");
    if (connectedAddressElement) {
      connectedAddressElement.textContent = App.account;
    }
  },

  showNetworkAlert: function() {
    alert("Please connect to Sepolia (chain ID: 11155111). Mainnet support coming soon.");
  },

  handleError: function(error) {
    // console.error(...);
    alert("An error occurred. Please check the console for more details.");
  },

  isSupportedEthereumNetwork: function(chainId = App.chainId) {
    return Boolean(chainId && SUPPORTED_CHAIN_IDS[chainId]);
  },

  setEthereumActionButtonsEnabled: function(enabled) {
    const approveButton = document.getElementById('approveButton');
    const depositButton = document.getElementById('depositButton');

    if (approveButton) {
      approveButton.disabled = !enabled;
    }
    if (depositButton) {
      depositButton.disabled = !enabled;
    }

    // For safety, force-disable dynamic claim buttons on unsupported networks.
    if (!enabled) {
      const claimButtons = document.querySelectorAll('.claim-button');
      claimButtons.forEach((button) => {
        button.disabled = true;
      });
    }
  },

  setEthereumRestrictedMode: function(restricted, reason = '') {
    App.ethereumRestrictedReason = restricted ? reason : '';
    if (restricted) {
      App.setEthereumActionButtonsEnabled(false);
    }
  },

  ensureSupportedEthereumNetwork: function(actionName = 'This action') {
    if (!App.isSupportedEthereumNetwork()) {
      const message = `${actionName} requires Ethereum Mainnet (1) or Sepolia (11155111). Please switch networks in your wallet.`;
      App.setEthereumRestrictedMode(true, message);
      if (typeof App.showValidationErrorPopup === 'function') {
        App.showValidationErrorPopup(message);
      } else {
        alert(message);
      }
      return false;
    }
    return true;
  },

  refreshEthereumConnectionState: async function() {
    if (!App.isConnected) {
      App.setEthereumRestrictedMode(false);
      return;
    }

    if (!App.isSupportedEthereumNetwork()) {
      const chainLabel = App.chainId != null ? String(App.chainId) : 'unknown';
      App.setEthereumRestrictedMode(
        true,
        `Unsupported Ethereum network (${chainLabel}). Switch to Mainnet or Sepolia.`
      );
      if (App.updateNetworkDisplay) {
        App.updateNetworkDisplay();
      }
      if (App.updateWalletManagerToggleText) {
        App.updateWalletManagerToggleText();
      }
      if (App.updateNetworkCompatibilityWarning) {
        App.updateNetworkCompatibilityWarning();
      }
      return;
    }

    try {
      await App.initBridgeContract();
      await App.initTokenContract();
      if (App.contracts.Bridge && App.contracts.Token) {
        await Promise.all([
          App.fetchDepositLimit(),
          App.fetchWithdrawLimit(),
          App.updateBalance()
        ]);
      }
      App.setEthereumRestrictedMode(false);
      App.setEthereumActionButtonsEnabled(true);
    } catch (error) {
      App.setEthereumRestrictedMode(true, 'Failed to refresh contracts after network/account change.');
      console.error('Failed to refresh Ethereum connection state:', error);
    }

    if (App.updateNetworkDisplay) {
      App.updateNetworkDisplay();
    }
    if (App.updateWalletManagerToggleText) {
      App.updateWalletManagerToggleText();
    }
    if (App.updateNetworkCompatibilityWarning) {
      App.updateNetworkCompatibilityWarning();
    }
  },

  initBridgeContract: async function () {
    try {
        // Only initialize bridge contract if we have Web3 and we're not in a Keplr-only state
        if (!App.web3 || !App.web3Provider) {
            if (App.isKeplrConnected && !App.isConnected) {
                // If we're only using Keplr, we don't need the bridge contract
                return true;
            }
            throw new Error('Web3 not properly initialized');
        }

        const abiPath = './abis/TokenBridgeV2.json';
        const response = await fetch(abiPath);
        if (!response.ok) {
            throw new Error(`Failed to load ABI: ${response.statusText}`);
        }
        
        const data = await response.json();
        const abi = data.abi || data;
        
        if (!Array.isArray(abi)) {
            throw new Error("Invalid ABI format");
        }

        App.contracts.Bridge = new App.web3.eth.Contract(abi);
        
        // V2 contracts were initialized with a starting withdrawId via init().
        // Withdrawals below this ID belong to V1 and can't be claimed on V2.
        const v2StartingWithdrawId = {
            11155111: SEPOLIA_V2_STARTING_WITHDRAW_ID,
            1: 0,
        };
        App.v2StartingWithdrawId = v2StartingWithdrawId[App.chainId] || 0;

        const contractAddresses = {
            11155111: SEPOLIA_TOKEN_BRIDGE_ADDRESS,
            1: ETHEREUM_MAINNET_TOKEN_BRIDGE_ADDRESS,
            421613: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444",   // Arbitrum Goerli
            137: "0x62733e63499a25E35844c91275d4c3bdb159D29d",      // Polygon
            80001: "0x62733e63499a25E35844c91275d4c3bdb159D29d",    // Mumbai
            100: "0x62733e63499a25E35844c91275d4c3bdb159D29d",      // Gnosis
            10200: "0x62733e63499a25E35844c91275d4c3bdb159D29d",    // Chiado
            10: "0x62733e63499a25E35844c91275d4c3bdb159D29d",       // Optimism
            420: "0x62733e63499a25E35844c91275d4c3bdb159D29d",      // Optimism Goerli
            42161: "0x62733e63499a25E35844c91275d4c3bdb159D29d",    // Arbitrum
            3141: "0x62733e63499a25E35844c91275d4c3bdb159D29d"      // Filecoin
        };

        const address = contractAddresses[App.chainId];
        if (!address) {
            throw new Error(`No contract address for chainId: ${App.chainId}`);
        }

        App.contracts.Bridge.options.address = address;
        return true;
    } catch (error) {
        // console.error(...);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
  },

  initTokenContract: function () {
    var pathToAbi = "./abis/ERC20.json";
    return new Promise(function(resolve, reject) {
      $.getJSON(pathToAbi, function (data) {
        try {
          // Make sure we're using the ABI array
          const abi = Array.isArray(data) ? data : data.abi;
          App.contracts.Token = new App.web3.eth.Contract(abi);
          
          const tokenAddresses = {
            11155111: "0x80fc34a2f9FfE86F41580F47368289C402DEc660", // Sepolia
            421613: "0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C",   // Arbitrum Goerli
            1: "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0",        // Mainnet
            137: "0xE3322702BEdaaEd36CdDAb233360B939775ae5f1",      // Polygon
            80001: "0xce4e32fe9d894f8185271aa990d2db425df3e6be",    // Mumbai
            100: "0xAAd66432d27737ecf6ED183160Adc5eF36aB99f2",      // Gnosis
            10200: "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d",    // Chiado
            10: "0xaf8cA653Fa2772d58f4368B0a71980e9E3cEB888",       // Optimism
            420: "0x3251838bd813fdf6a97D32781e011cce8D225d59",      // Optimism Goerli
            42161: "0xd58D345Fd9c82262E087d2D0607624B410D88242",    // Arbitrum
            421613: "0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C",   // Arbitrum Goerli
            3141: "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d"      // Filecoin
          };

          const address = tokenAddresses[App.chainId];
          if (!address) {
            throw new Error(`No token address for chainId: ${App.chainId}`);
          }

          App.contracts.Token.options.address = address;
          resolve();
        } catch (error) {
          // console.error(...);
          reject(error);
        }
      }).fail(function(error) {
        // console.error(...);
        reject(error);
      });
    });
  },

  // Get the appropriate API endpoint based on current network
  getApiEndpoint: function() {
    if (App.chainId === 1) {
      return 'https://mainnet.tellorlayer.com';
    }
    if (App.chainId === 11155111) {
      return LAYER_TESTNET_LCD;
    }
    return 'https://node-palmito.tellorlayer.com';
  },

  // Get the appropriate Cosmos API endpoint based on current Cosmos network
  getCosmosApiEndpoint: function() {
    if (App.cosmosChainId === 'tellor-1') {
      return 'https://mainnet.tellorlayer.com';
    }
    return LAYER_TESTNET_LCD;
  },

  // Get the appropriate Cosmos RPC endpoint based on current Cosmos network
  getCosmosRpcEndpoint: function() {
    if (App.cosmosChainId === 'tellor-1') {
      return 'https://mainnet.tellorlayer.com/rpc';
    }
    return LAYER_TESTNET_RPC;
  },

  // Update network display in UI
  updateNetworkDisplay: function() {
    const networkDisplay = document.getElementById('network-display');
    const toggleButton = document.getElementById('network-toggle-btn');
    const toggleText = document.getElementById('toggle-text');
    const networkGroup = networkDisplay ? networkDisplay.closest('.network-group') : null;
    
    if (networkDisplay) {
      if (App.chainId === 1) {
        networkDisplay.textContent = '*Ethereum Mainnet';
        networkDisplay.style.color = '#10b981'; // Green for mainnet
        // Show network toggle for mainnet
        if (toggleButton) {
          toggleButton.style.display = 'inline-flex';
          toggleButton.setAttribute('data-network', 'mainnet');
          toggleButton.className = 'toggle-button mainnet';
          toggleButton.disabled = false;
        }
        if (toggleText) toggleText.textContent = 'Switch to Testnet';
        if (networkGroup) networkGroup.style.display = 'flex';
      } else if (App.chainId === 11155111) {
        networkDisplay.textContent = '*Sepolia Test Network';
        networkDisplay.style.color = '#f59e0b'; // Orange for testnet
        // Show network toggle for sepolia
        if (toggleButton) {
          toggleButton.style.display = 'inline-flex';
          toggleButton.setAttribute('data-network', 'sepolia');
          toggleButton.className = 'toggle-button sepolia';
          toggleButton.disabled = false;
        }
        if (toggleText) toggleText.textContent = 'Switch to Mainnet';
        if (networkGroup) networkGroup.style.display = 'flex';
      } else if (App.chainId === undefined || App.chainId === null) {
        // Hide entire network group when not connected
        if (networkGroup) networkGroup.style.display = 'none';
      } else {
        networkDisplay.textContent = '*Unsupported Network*';
        networkDisplay.style.color = '#ef4444'; // Red for unsupported
        // Hide network toggle for unsupported networks
        if (toggleButton) toggleButton.style.display = 'none';
        if (networkGroup) networkGroup.style.display = 'none';
      }
    }
  },

  // Update Cosmos network display in UI
  updateCosmosNetworkDisplay: function() {
    const cosmosNetworkDisplay = document.getElementById('cosmos-network-display');
    const cosmosToggleButton = document.getElementById('cosmos-network-toggle-btn');
    const cosmosToggleText = document.getElementById('cosmos-toggle-text');
    const cosmosNetworkGroup = cosmosNetworkDisplay ? cosmosNetworkDisplay.closest('.network-group') : null;

    if (cosmosNetworkDisplay) {
      if (App.cosmosChainId === 'tellor-1') {
        cosmosNetworkDisplay.textContent = '*Tellor Mainnet';
        cosmosNetworkDisplay.style.color = '#10b981'; // Green for mainnet
        // Show network toggle for mainnet
        if (cosmosToggleButton) {
          cosmosToggleButton.style.display = 'inline-flex';
          cosmosToggleButton.setAttribute('data-network', 'mainnet');
          cosmosToggleButton.className = 'toggle-button mainnet';
          cosmosToggleButton.disabled = false;
        }
        if (cosmosToggleText) cosmosToggleText.textContent = 'Switch to Testnet';
        if (cosmosNetworkGroup) cosmosNetworkGroup.style.display = 'flex';
      } else if (isLayerCosmosTestnet(App.cosmosChainId)) {
        cosmosNetworkDisplay.textContent = '*Palmito Testnet';
        cosmosNetworkDisplay.style.color = '#f59e0b'; // Orange for testnet
        // Show network toggle for testnet
        if (cosmosToggleButton) {
          cosmosToggleButton.style.display = 'inline-flex';
          cosmosToggleButton.setAttribute('data-network', 'testnet');
          cosmosToggleButton.className = 'toggle-button sepolia';
          cosmosToggleButton.disabled = false;
        }
        if (cosmosToggleText) cosmosToggleText.textContent = 'Switch to Mainnet';
        if (cosmosNetworkGroup) cosmosNetworkGroup.style.display = 'flex';
      } else if (App.cosmosChainId === undefined || App.cosmosChainId === null) {
        // Hide entire network group when not connected
        if (cosmosNetworkGroup) cosmosNetworkGroup.style.display = 'none';
      } else {
        cosmosNetworkDisplay.textContent = '*Unsupported Cosmos Network*';
        cosmosNetworkDisplay.style.color = '#ef4444'; // Red for unsupported
        // Hide network toggle for unsupported networks
        if (cosmosToggleButton) cosmosToggleButton.style.display = 'none';
        if (cosmosNetworkGroup) cosmosNetworkGroup.style.display = 'none';
      }
    }
  },

  // Show confirmation modal
  showConfirmationModal: function(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.id = 'confirmationModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#d4d8e3';
    modalContent.style.color = '#083b44';
    modalContent.style.borderRadius = '10px';
    modalContent.style.border = '3px solid black';
    modalContent.style.padding = '30px';
    modalContent.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    modalContent.style.fontSize = "15px";
    modalContent.style.width = '400px';
    modalContent.style.textAlign = 'center';
    modalContent.style.maxWidth = '90vw';

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.marginBottom = '25px';
    messageDiv.style.lineHeight = '1.4';
    modalContent.appendChild(messageDiv);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.justifyContent = 'center';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Continue';
    confirmButton.style.padding = '10px 20px';
    confirmButton.style.backgroundColor = '#10b981';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '5px';
    confirmButton.style.fontFamily = "'PPNeueMontreal-Bold', Arial, sans-serif";
    confirmButton.style.fontSize = '14px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.transition = 'background-color 0.2s';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.backgroundColor = '#6b7280';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.fontFamily = "'PPNeueMontreal-Bold', Arial, sans-serif";
    cancelButton.style.fontSize = '14px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.transition = 'background-color 0.2s';

    // Hover effects
    confirmButton.onmouseenter = () => {
      confirmButton.style.backgroundColor = '#059669';
    };
    confirmButton.onmouseleave = () => {
      confirmButton.style.backgroundColor = '#10b981';
    };

    cancelButton.onmouseenter = () => {
      cancelButton.style.backgroundColor = '#4b5563';
    };
    cancelButton.onmouseleave = () => {
      cancelButton.style.backgroundColor = '#6b7280';
    };

    // Event handlers
    confirmButton.onclick = () => {
      document.body.removeChild(modal);
      if (onConfirm) onConfirm();
    };

    cancelButton.onclick = () => {
      document.body.removeChild(modal);
      if (onCancel) onCancel();
    };

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        if (onCancel) onCancel();
      }
    };

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
        if (onCancel) onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  },

  /** Updates Select / Switch Reporter button label from App._hasCurrentReporterSelection */
  updateReporterActionButton: function() {
    const btn = document.getElementById('selectReporterButton');
    if (!btn) return;
    if (!App.isKeplrConnected) {
      btn.innerHTML = 'Select Reporter';
      return;
    }
    btn.innerHTML = App._hasCurrentReporterSelection ? 'Switch Reporter' : 'Select Reporter';
  },

  /**
   * Modal before switching reporters: power lock / ADR 1009.
   * @returns {Promise<boolean>} true if user continued, false if cancelled
   */
  showReporterSwitchDisclaimerModal: function() {
    const ADR_URL =
      'https://github.com/tellor-io/layer/blob/main/adr/adr1009%20-%20handling%20of%20reporter%20delegations.md';
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'reporterSwitchDisclaimerModal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.zIndex = '1000';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';

      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#d4d8e3';
      modalContent.style.color = '#083b44';
      modalContent.style.borderRadius = '10px';
      modalContent.style.border = '3px solid black';
      modalContent.style.padding = '28px';
      modalContent.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
      modalContent.style.fontSize = '15px';
      modalContent.style.width = '440px';
      modalContent.style.maxWidth = '92vw';
      modalContent.style.textAlign = 'left';
      modalContent.style.lineHeight = '1.45';

      const title = document.createElement('div');
      title.textContent = 'Switch reporter';
      title.style.fontFamily = "'PPNeueMontreal-Bold', Arial, sans-serif";
      title.style.fontSize = '17px';
      title.style.marginBottom = '14px';
      title.style.textAlign = 'center';
      modalContent.appendChild(title);

      const p1 = document.createElement('p');
      p1.textContent =
        'Switching can succeed immediately. If your stake was already counted for the prior reporter, it may not count toward the new reporter\'s on-chain power until the 21 day unbonding window ends.';
      p1.style.marginBottom = '12px';
      modalContent.appendChild(p1);

      const p1b = document.createElement('p');
      p1b.textContent =
        'This is a reporting-power timing rule, not a direct staking lock.';
      p1b.style.marginBottom = '12px';
      modalContent.appendChild(p1b);

      const p2 = document.createElement('p');
      p2.style.marginBottom = '14px';
      const link = document.createElement('a');
      link.href = ADR_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'ADR 1009: reporter selections and selectors';
      link.style.color = '#0f766e';
      link.style.textDecoration = 'underline';
      p2.appendChild(link);
      modalContent.appendChild(p2);

      const buttonRow = document.createElement('div');
      buttonRow.style.display = 'flex';
      buttonRow.style.gap = '15px';
      buttonRow.style.justifyContent = 'center';
      buttonRow.style.marginTop = '8px';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '10px 20px';
      cancelButton.style.backgroundColor = '#6b7280';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '5px';
      cancelButton.style.fontFamily = "'PPNeueMontreal-Bold', Arial, sans-serif";
      cancelButton.style.fontSize = '14px';
      cancelButton.style.cursor = 'pointer';

      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'Continue';
      confirmButton.style.padding = '10px 20px';
      confirmButton.style.backgroundColor = '#10b981';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '5px';
      confirmButton.style.fontFamily = "'PPNeueMontreal-Bold', Arial, sans-serif";
      confirmButton.style.fontSize = '14px';
      confirmButton.style.cursor = 'pointer';

      const finish = (continued) => {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', onEscape);
        resolve(continued);
      };

      const onEscape = (e) => {
        if (e.key === 'Escape') {
          finish(false);
        }
      };

      cancelButton.onclick = () => finish(false);
      confirmButton.onclick = () => finish(true);
      modal.onclick = (e) => {
        if (e.target === modal) {
          finish(false);
        }
      };
      document.addEventListener('keydown', onEscape);

      buttonRow.appendChild(cancelButton);
      buttonRow.appendChild(confirmButton);
      modalContent.appendChild(buttonRow);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    });
  },

  // Switch Cosmos network function
  switchCosmosNetwork: async function() {
    if (!App.isKeplrConnected) {
      alert('Please connect your Cosmos wallet first');
      return;
    }

    // Set flag to prevent input validation during network switch
    App.isNetworkSwitching = true;

    // Show confirmation dialog
    const targetNetwork = App.cosmosChainId === 'tellor-1' ? 'testnet' : 'mainnet';
    const currentNetwork = App.cosmosChainId === 'tellor-1' ? 'mainnet' : 'testnet';
    
    const message = `Switch from ${currentNetwork} to ${targetNetwork}?`;
    
         App.showConfirmationModal(message, async () => {
       const cosmosToggleButton = document.getElementById('cosmos-network-toggle-btn');
       if (cosmosToggleButton) {
         cosmosToggleButton.disabled = true;
         cosmosToggleButton.textContent = 'Switching...';
       }

    try {
      let targetChainId;
      if (App.cosmosChainId === 'tellor-1') {
        targetChainId = LAYER_TESTNET_CHAIN_ID;
      } else if (isLayerCosmosTestnet(App.cosmosChainId)) {
        targetChainId = 'tellor-1';
      } else {
        App.showValidationErrorPopup('Cannot switch from unsupported Cosmos network');
        return;
      }

      // Update App state to the target chain
      App.cosmosChainId = targetChainId;

      // In-place chain switch via the wallet adapter (no disconnect needed)
      if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
        await window.cosmosWalletAdapter.switchToChain();

        // Re-fetch accounts from the new chain's offline signer
        const offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        const accounts = await offlineSigner.getAccounts();
        if (accounts && accounts.length > 0) {
          App.keplrAddress = accounts[0].address;
        }

        // Update persisted chain ID for auto-reconnect
        localStorage.setItem('tellor_cosmos_chain_id', targetChainId);
      } else if (window.keplr) {
        // Legacy path: must disconnect and reconnect
        await App.disconnectKeplr();
        await App.connectKeplr();
      }
      
      // Update UI
      App.updateCosmosNetworkDisplay();

      const truncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
      const keplrButton = document.getElementById('keplrButton');
      if (keplrButton) {
        keplrButton.innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
      }

      // Refresh delegate data only when Delegate section is active.
      if (App.currentBridgeDirection === 'delegate') {
        try {
          await App.populateValidatorDropdown(true);
          await App.populateReporterDropdown(true);
          await App.refreshCurrentStatus();
        } catch (error) {
          console.error('Failed to refresh dropdowns after network switch:', error);
        }
      }
      
      App.updateUIForCurrentDirection();
      App.updateWalletManagerToggleText();
      App.isNetworkSwitching = false;
      
      // Update balance after a short delay to let the wallet settle
      setTimeout(async () => {
        try {
          await App.updateKeplrBalance();
        } catch (error) {
          console.error('Error updating balance after network switch:', error);
        }
      }, 500);
      
      if (cosmosToggleButton) {
        cosmosToggleButton.disabled = false;
        cosmosToggleButton.textContent = App.cosmosChainId === 'tellor-1' ? 'Switch to Testnet' : 'Switch to Mainnet';
      }
      
    } catch (error) {
      App.handleError(error);
    } finally {
      App.isNetworkSwitching = false;
      
      if (cosmosToggleButton) {
        cosmosToggleButton.disabled = false;
        cosmosToggleButton.textContent = App.cosmosChainId === 'tellor-1' ? 'Switch to Testnet' : 'Switch to Mainnet';
      }
    }
  });
  },

  // Switch network function
  switchNetwork: async function() {
    if (!App.isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const toggleButton = document.getElementById('network-toggle-btn');
    if (toggleButton) {
      toggleButton.disabled = true;
    }

    try {
      let targetChainId;
      if (App.chainId === 1) {
        // Currently on mainnet, switch to Sepolia
        targetChainId = 11155111;
      } else if (App.chainId === 11155111) {
        // Currently on Sepolia, switch to mainnet
        targetChainId = 1;
      } else {
        App.showValidationErrorPopup('Cannot switch from unsupported network');
        return;
      }

      // Use wallet adapter if available, otherwise use direct ethereum
      if (window.ethereumWalletAdapter && window.ethereumWalletAdapter.isWalletConnected()) {
        await window.ethereumWalletAdapter.switchChain(targetChainId);
      } else if (window.ethereum) {
        const chainIdHex = '0x' + targetChainId.toString(16);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        });
      } else {
        alert('No wallet adapter available for network switching');
        return;
      }

      // Update App state
      App.chainId = targetChainId;
      
      // Reinitialize contracts with new network
      await App.initBridgeContract();
      await App.initTokenContract();
      
      // Update balances and limits
      await Promise.all([
        App.updateBalance(),
        App.fetchDepositLimit(),
        App.fetchWithdrawLimit()
      ]);
      
      // Update UI
      App.updateNetworkDisplay();
      App.setPageParams();
      
      App.debugLog(`Successfully switched to ${targetChainId === 1 ? 'Mainnet' : 'Sepolia'}`);
      
    } catch (error) {
      console.error('Error switching network:', error);
      alert(`Failed to switch network: ${error.message}`);
    } finally {
      if (toggleButton) {
        toggleButton.disabled = false;
      }
    }
  },

  fetchDepositLimit: async function() {
    try {
        if (!App.contracts.Bridge || !App.contracts.Bridge.methods) {
            throw new Error("Bridge contract not properly initialized");
        }

        if (!App.contracts.Bridge.methods.depositLimit) {
            throw new Error("depositLimit method not found");
        }

        let result;
        
        // Temporary fix for Mainnet: Calculate dynamic deposit limit
        if (App.chainId === 1) { // Mainnet
            try {
                const depositLimitRecord = await App.contracts.Bridge.methods.depositLimitRecord().call();
                const depositLimitUpdateTime = await App.contracts.Bridge.methods.depositLimitUpdateTime().call();
                
                const currentTime = Math.floor(Date.now() / 1000);
                const timeSinceUpdate = currentTime - depositLimitUpdateTime;
                const hoursSinceUpdate = timeSinceUpdate / 3600;
                
                if (hoursSinceUpdate < 12) {
                    // If < 12 hours since update, use depositLimitRecord
                    result = depositLimitRecord;
                } else {
                    // If ≥ 12 hours since update, use bridgeBalance/5
                    const bridgeBalance = await App.contracts.Token.methods.balanceOf(App.contracts.Bridge.options.address).call();
                    const balanceBN = new App.web3.utils.BN(bridgeBalance);
                    result = balanceBN.div(new App.web3.utils.BN(5)).toString();
                }
            } catch (dynamicError) {
                console.warn('Dynamic deposit limit calculation failed, falling back to original:', dynamicError);
                // Fallback to original method
                result = await App.contracts.Bridge.methods.depositLimit().call();
            }
        } else {
            // For all other networks, use the original method
            result = await App.contracts.Bridge.methods.depositLimit().call();
        }
        //replace lines 1525-1551 with *const result = await App.contracts.Bridge.methods.depositLimit().call();* once minting begins
        App.depositLimit = result;
        
        const readableLimit = App.web3.utils.fromWei(App.depositLimit, 'ether');
        const depositLimitElement = document.getElementById("depositLimit");
        
        if (depositLimitElement) {
            depositLimitElement.textContent = readableLimit + ' TRB';
        } else {
            // console.warn(...);
        }

        return readableLimit;
    } catch (error) {
        // console.error(...);
        throw error;
    }
  },

  fetchWithdrawLimit: async function() {
    const el = document.getElementById('withdrawLimitDisplay');
    const setText = (text) => {
      if (el) el.textContent = text;
    };
    try {
      if (!App.contracts.Bridge || !App.contracts.Bridge.methods) {
        setText('—');
        return null;
      }
      if (!App.contracts.Bridge.methods.withdrawLimit) {
        setText('—');
        return null;
      }
      const result = await App.contracts.Bridge.methods.withdrawLimit().call();
      const readable = App.web3.utils.fromWei(result, 'ether');
      setText(`Limit: ${readable} TRB`);
      return readable;
    } catch (error) {
      console.warn('fetchWithdrawLimit failed:', error);
      setText('—');
      return null;
    }
  },

  refreshActiveViewData: async function() {
    const tasks = [];

    if (App.isConnected) {
      tasks.push(App.updateBalance().catch(() => {}));
    }

    if (
      App.contracts.Bridge &&
      App.contracts.Token &&
      App.currentBridgeDirection === 'layer'
    ) {
      tasks.push(App.fetchDepositLimit().catch(() => {}));
    }

    if (
      App.contracts.Bridge &&
      App.contracts.Bridge.methods &&
      (App.currentBridgeDirection === 'layer' || App.currentBridgeDirection === 'ethereum')
    ) {
      tasks.push(App.fetchWithdrawLimit().catch(() => {}));
    }

    if (
      App.isKeplrConnected &&
      (App.currentBridgeDirection === 'ethereum' || App.currentBridgeDirection === 'delegate')
    ) {
      tasks.push(App.updateKeplrBalance().catch(() => {}));
    }

    await Promise.all(tasks);

    if (App.currentBridgeDirection === 'delegate' && App.isKeplrConnected) {
      await Promise.all([
        App.populateValidatorDropdown(),
        App.populateReporterDropdown()
      ]);
      await App.refreshCurrentStatus();
    }
  },

  setPageParams: function(options = {}) {
    const skipDataRefresh = Boolean(options.skipDataRefresh);
    // Update connected address in UI
    const connectedAddressElement = document.getElementById("connectedAddress");
    if (connectedAddressElement) {
      connectedAddressElement.textContent = App.account;
    }

    // Update balances and limits based on current direction and wallet type
    if (!skipDataRefresh && App.currentBridgeDirection === 'layer') {
      // For Layer section
      if (App.contracts.Bridge && App.contracts.Token) {
        document.getElementById('approveButton').disabled = false;
        document.getElementById('depositButton').disabled = false;
        // Always fetch deposit limit in Layer section
        App.fetchDepositLimit().catch(error => {
          // console.error(...);
        });
        App.fetchWithdrawLimit().catch(() => {});
      }
      // Update MetaMask balance if connected
      if (App.isConnected) {
        App.updateBalance().catch(error => {
          // console.error(...);
        });
      }
    } else if (!skipDataRefresh) {
      // For Ethereum section
      if (App.isConnected) {
        // Update MetaMask balance
        App.updateBalance().catch(error => {
          // console.error(...);
        });
      }
      if (App.contracts.Bridge && App.contracts.Bridge.methods) {
        App.fetchWithdrawLimit().catch(() => {});
      }
      if (App.isKeplrConnected) {
        // Update Keplr balance
        App.updateKeplrBalance().catch(error => {
          // console.error(...);
        });
        document.getElementById('withdrawButton').disabled = false;
      }
    }

    // Add withdrawal history if either wallet is connected
    if (App.isConnected || App.isKeplrConnected) {
      App.addWithdrawalHistory();
    }
  },

  updateKeplrBalance: async function() {
    try {
        if (!App.isKeplrConnected || !App.keplrAddress) {
            return;
        }

        // Use wallet adapter if available, otherwise fall back to direct Keplr
        let offlineSigner;
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        } else {
            // Legacy Keplr method
            offlineSigner = window.keplr.getOfflineSigner(App.cosmosChainId);
        }

        const rpcEndpoint = App.getCosmosRpcEndpoint();

        // Force a fresh connection by using a new client each time
        const signingClient = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            rpcEndpoint,
            offlineSigner,
            {
                gasPrice: "0.025loya"
            }
        );

        // Use REST (LCD); do not derive from RPC (devnet uses :1317 + :26657)
        let balanceAmount = 0;
        try {
            const restUrl = App.getCosmosApiEndpoint();
            const restResponse = await fetch(`${restUrl}/cosmos/bank/v1beta1/balances/${App.keplrAddress}`);
            const restData = await restResponse.json();
            // Find the loya balance in the response
            if (restData.balances && Array.isArray(restData.balances)) {
                const loyaBalance = restData.balances.find(b => b.denom === 'loya');
                if (loyaBalance) {
                    balanceAmount = parseInt(loyaBalance.amount);
                }
            }
        } catch (error) {
            console.error('Error fetching balance from REST API:', error);
        }
        
        // Format balance to 6 decimal places consistently
        const readableBalance = (balanceAmount / 1000000).toFixed(6);

        // Update Cosmos wallet balance display
        const ethKeplrBalanceElement = document.getElementById("ethKeplrBalance");
        
        if (ethKeplrBalanceElement) {
            ethKeplrBalanceElement.textContent = `Balance: ${readableBalance} TRB`;
        }
    } catch (error) {
        console.error('Error updating Keplr balance:', error);
        // Set Cosmos wallet balance to 0 on error
        const ethKeplrBalanceElement = document.getElementById("ethKeplrBalance");
        
        if (ethKeplrBalanceElement) ethKeplrBalanceElement.textContent = "Balance: 0.000000 TRB";
    }
  },

  uintTob32: function (n) {
    let vars = App.web3.utils.toBN(n).toString('hex');
    vars = vars.padStart(64, '0');
    return vars;
  },
  
  reportValue: function () {
    queryId = document.getElementById("_queryId").value;
    value = document.getElementById("_value").value;
    nonce = document.getElementById("_nonce").value;
    queryData = document.getElementById("_queryData").value;
    
    App.contracts.Bridge.methods
      .submitValue(queryId, value, nonce, queryData)
      .send({ from: App.account })
      .then(function (result) {
        // Handle result silently
      });
  },

  approveDeposit: function() {
    if (!checkWalletConnection()) {
        return;
    }
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = App.web3.utils.toWei(amount, 'ether');

    // Disable both buttons during approval
    const approveButton = document.getElementById('approveButton');
    const depositButton = document.getElementById('depositButton');
    approveButton.disabled = true;
    depositButton.disabled = true;

    App.showPendingPopup("Approval transaction pending...");
    App.contracts.Token.methods.approve(App.contracts.Bridge.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        App.hidePendingPopup();
        App.showSuccessPopup("Approval successful! You can now bridge your tokens.", approvalResult.transactionHash, 'ethereum');
        
        // Update button states after successful approval
        approveButton.disabled = true; // Keep approve disabled since we have sufficient allowance
        depositButton.disabled = false; // Enable deposit button
        
        // Update allowance display
        if (window.checkAllowance) {
          setTimeout(() => checkAllowance(), 1000);
        }
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error('Approval error:', error);
        
        // Re-enable approve button on error, keep deposit disabled
        approveButton.disabled = false;
        depositButton.disabled = true;
        
        // Show user-friendly error message
        let errorMessage = "Error in approval. Please try again.";
        if (error.message && error.message.includes('insufficient funds')) {
          errorMessage = "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
        } else if (error.message && error.message.includes('user rejected')) {
          errorMessage = "Transaction was cancelled. Please try again.";
        }
        alert(errorMessage);
      });
  },

  showSuccessPopup: function(message, txHash = null, chainType = 'ethereum') {
    const popup = document.createElement('div');
    popup.id = 'successPopup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '50px';
    popup.style.backgroundColor = '#d4d8e3';
    popup.style.color = '#083b44';
    popup.style.borderRadius = '10px';
    popup.style.zIndex = '1000';
    popup.style.border = '3px solid black';
    popup.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    popup.style.fontSize = "15px";
    popup.style.width = '300px'; // Increased width to accommodate link
    popup.style.textAlign = 'center'; // Center the text
  
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    popup.appendChild(messageSpan);
  
    // Add block explorer link if transaction hash is provided
    if (txHash) {
      const linkContainer = document.createElement('div');
      linkContainer.style.marginTop = '15px';
      
      let explorerUrl;
      if (chainType === 'ethereum') {
        // Use correct Etherscan URL based on current Ethereum network
        if (App.chainId === 1) {
          explorerUrl = `https://etherscan.io/tx/${txHash}`;
        } else {
          explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
        }
      } else if (chainType === 'cosmos') {
        explorerUrl = `https://explorer.tellor.io/txs/${txHash}`;
      }
      
      if (explorerUrl) {
        const link = document.createElement('a');
        link.href = explorerUrl;
        link.target = '_blank';
        link.textContent = 'View on Block Explorer';
        link.style.color = '#083b44';
        link.style.textDecoration = 'underline';
        link.style.fontSize = '13px';
        link.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
        
        linkContainer.appendChild(link);
        popup.appendChild(linkContainer);
      }
    }
  
    document.body.appendChild(popup);
  
    // Remove the popup after 5 seconds
    setTimeout(() => {
      const popup = document.getElementById('successPopup');
      if (popup) {
        popup.remove();
      }
    }, 5000);
  },

  depositToLayer: async function() {
    try {
        if (!checkWalletConnection()) {
            return;
        }

        const recipient = document.getElementById('_queryId').value;
        const amount = document.getElementById('stakeAmount').value;
        const tip = "0"; // Set tip to 0 by default
        
        // Validate recipient address is not empty and starts with 'tellor1...'
        if (!recipient || recipient.trim() === '') {
            App.showValidationErrorPopup('Recipient address cannot be empty');
            return;
        }
        
        if (!recipient.startsWith('tellor1')) {
            App.showValidationErrorPopup('Recipient address must start with "tellor1..."');
            return;
        }

        if (recipient.length !== 45) {
            App.showValidationErrorPopup('Recipient address must be exactly 45 characters long');
            return;
        }

        const bridgeMismatch = App.getEthCosmosBridgeNetworkMismatchMessage();
        if (bridgeMismatch) {
            App.showValidationErrorPopup(bridgeMismatch);
            return;
        }

        const amountToSend = App.web3.utils.toWei(amount, 'ether');
        
        // Validate minimum deposit amount (greater than 0.1 TRB)
        const minimumAmount = 0.1;
        if (parseFloat(amount) <= minimumAmount) {
            App.showValidationErrorPopup(`Minimum deposit amount must be greater than ${minimumAmount} TRB. You entered ${amount} TRB.`);
            return;
        }
        
        // Check balance first
        const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
        const balanceBN = new App.web3.utils.BN(balance);
        const amountBN = new App.web3.utils.BN(amountToSend);

        if (balanceBN.lt(amountBN)) {
            const errorMsg = `Insufficient token balance. You have ${App.web3.utils.fromWei(balance, 'ether')} TRB but trying to deposit ${amount} TRB`;
            App.showBalanceErrorPopup(errorMsg);
            return;
        }
        
        // Check deposit limit using the currently displayed limit
        if (App.depositLimit) {
            const depositLimitBN = new App.web3.utils.BN(App.depositLimit);
            
            if (amountBN.gt(depositLimitBN)) {
                const readableLimit = App.web3.utils.fromWei(App.depositLimit, 'ether');
                const errorMsg = `Deposit amount exceeds deposit limit. You can deposit up to ${readableLimit} TRB, but you're trying to deposit ${amount} TRB.`;
                App.showValidationErrorPopup(errorMsg);
                return;
            }
        }

        // Only reach here if balance is sufficient
        App.showPendingPopup("Deposit transaction pending...");
        const tipToSend = App.web3.utils.toWei(tip, 'ether');
        
        // Use fixed gas limit instead of estimation to avoid simulation failures
        const gasLimit = 500000; // 500k gas should be sufficient for bridge deposits
        
        // Disable both buttons during deposit
        const approveButton = document.getElementById('approveButton');
        const depositButton = document.getElementById('depositButton');
        approveButton.disabled = true;
        depositButton.disabled = true;

        const tx = await App.contracts.Bridge.methods.depositToLayer(amountToSend, tipToSend, recipient)
            .send({ 
                from: App.account,
                gas: gasLimit
            });
        
        App.hidePendingPopup();
        await App.updateBalance();
        const txHash = tx.transactionHash;
        App.showSuccessPopup("Deposit to layer successful! You will need to wait 12 hours before you can claim your tokens on Tellor Layer.", txHash, 'ethereum');
        
        // Reset button states after successful deposit
        if (window.checkAllowance) {
          setTimeout(() => checkAllowance(), 1000);
        }
    } catch (error) {
        App.hidePendingPopup();
        console.error('Deposit error:', error);
        
        // Re-enable buttons on error
        const approveButton = document.getElementById('approveButton');
        const depositButton = document.getElementById('depositButton');
        
        // Show user-friendly error message
        let errorMessage = "Error in depositing to layer. Please try again.";
        if (error.message && error.message.includes('insufficient allowance')) {
          errorMessage = "Insufficient token allowance. Please approve more TRB tokens first.";
          // Re-enable approve button, keep deposit disabled
          approveButton.disabled = false;
          depositButton.disabled = true;
        } else if (error.message && error.message.includes('insufficient funds')) {
          errorMessage = "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
          // Re-enable both buttons
          if (window.checkAllowance) {
            setTimeout(() => checkAllowance(), 1000);
          }
        } else if (error.message && error.message.includes('user rejected')) {
          errorMessage = "Transaction was cancelled. Please try again.";
          // Re-enable both buttons
          if (window.checkAllowance) {
            setTimeout(() => checkAllowance(), 1000);
          }
        } else {
          // For other errors, re-enable both buttons
          if (window.checkAllowance) {
            setTimeout(() => checkAllowance(), 1000);
          }
        }
        
        alert(errorMessage);
    }
  },

  initInputValidation: function() {
    const depositButton = document.getElementById('depositButton');
    const stakeAmountInput = document.getElementById('stakeAmount');
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'trb-price-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    // Get all TRB input fields
    const delegateStakeAmountInput = document.getElementById('delegateStakeAmount');
    
    // Position tooltip relative to the active input field
    function positionTooltip() {
        // Find which input is currently focused or has a value
        let activeInput = null;
        
        if (document.activeElement && document.activeElement.classList.contains('trb-input-field')) {
            activeInput = document.activeElement;
        } else if (stakeAmountInput && stakeAmountInput.value) {
            activeInput = stakeAmountInput;
        } else if (ethStakeAmountInput && ethStakeAmountInput.value) {
            activeInput = ethStakeAmountInput;
        } else if (delegateStakeAmountInput && delegateStakeAmountInput.value) {
            activeInput = delegateStakeAmountInput;
        }
        
        if (!activeInput) return;

        const inputRect = activeInput.getBoundingClientRect();
        
        // Special positioning for Bridge to Ethereum section
        if (activeInput.id === 'ethStakeAmount') {
            // Position above the input field
            tooltip.style.left = (inputRect.left + (inputRect.width / 2)) + 'px';
            tooltip.style.top = (inputRect.top - 10) + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
        } else {
            // Standard positioning to the right of the input
            tooltip.style.left = (inputRect.right + 10) + 'px';
            tooltip.style.top = (inputRect.top + (inputRect.height / 2)) + 'px';
            tooltip.style.transform = 'translateY(-50%)';
        }
    }

    let trbPrice = null;
    let trbPriceLastFetchMs = 0;
    const TRB_PRICE_TTL_MS = 300000; // 5 minutes

    // Fetch TRB price on demand (lazy), then cache with TTL.
    async function updateTrbPrice(force = false) {
      const now = Date.now();
      if (!force && trbPrice !== null && (now - trbPriceLastFetchMs) < TRB_PRICE_TTL_MS) {
        return trbPrice;
      }

      try {
        const response = await fetch(App.getApiEndpoint() + '/tellor-io/layer/oracle/get_current_aggregate_report/5c13cd9c97dbb98f2429c101a2a8150e6c7a0ddaff6124ee176a3a411067ded0', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // The aggregate_value is in hex format, convert it to decimal
        const hexValue = data.aggregate.aggregate_value;
        const decimalValue = BigInt('0x' + hexValue);
        
        // Convert to USD (divide by 1e18 since the value is in wei)
        trbPrice = Number(decimalValue) / 1e18;
        trbPriceLastFetchMs = now;
        return trbPrice;
      } catch (error) {
        // console.warn(...);
        if (trbPrice === null) {
          trbPrice = 0.5; // Default value in USD
          trbPriceLastFetchMs = now;
        }
        return trbPrice;
      }
    }

    // Update tooltip with USD value
    async function updateTooltip(event) {
        // Get the input that triggered this event
        const triggeredInput = event ? event.target : null;
        
        // Find which input to use for the tooltip
        let activeInput = null;
        if (triggeredInput && triggeredInput.classList.contains('trb-input-field')) {
            activeInput = triggeredInput;
        } else if (stakeAmountInput && stakeAmountInput.value) {
            activeInput = stakeAmountInput;
        } else if (ethStakeAmountInput && ethStakeAmountInput.value) {
            activeInput = ethStakeAmountInput;
        } else if (delegateStakeAmountInput && delegateStakeAmountInput.value) {
            activeInput = delegateStakeAmountInput;
        }
        
        if (!activeInput) return;

        const amount = parseFloat(activeInput.value) || 0;
        if (amount > 0 && shouldTooltipBeVisible()) {
            if (trbPrice === null || (Date.now() - trbPriceLastFetchMs) >= TRB_PRICE_TTL_MS) {
                await updateTrbPrice();
                startPricePollingIfNeeded();
            }
            if (trbPrice > 0) {
                const usdValue = (amount * trbPrice).toFixed(2);
                tooltip.textContent = `≈ $${usdValue} USD`;
            } else {
                tooltip.textContent = 'Price data unavailable';
            }
            showTooltip();
            requestAnimationFrame(positionTooltip);
        } else {
            enhancedHideTooltip();
        }
    }

    // Start polling only after first on-demand price fetch.
    let priceUpdateInterval;
    function startPricePollingIfNeeded() {
      if (priceUpdateInterval || trbPriceLastFetchMs === 0) {
        return;
      }
      priceUpdateInterval = setInterval(() => {
        updateTrbPrice(true).catch(() => {});
      }, TRB_PRICE_TTL_MS);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
      } else {
        startPricePollingIfNeeded();
      }
    });
    
    // Periodically check if tooltip should be visible
    setInterval(() => {
        if (tooltip.style.display === 'block' && !shouldTooltipBeVisible()) {
            enhancedHideTooltip();
        }
    }, 1000); // Check every second
    
    // Also check more frequently for immediate hiding
    setInterval(() => {
        if (tooltip && tooltip.style.display === 'block') {
            const activeSection = document.querySelector('.function-section.active');
            if (activeSection && activeSection.id === 'disputeSection') {
                enhancedHideTooltip();
            }
        }
    }, 500); // Check every 500ms for immediate hiding
    
    // Watch for section changes and hide tooltip immediately
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Check if any section became active
                const activeSection = document.querySelector('.function-section.active');
                if (activeSection) {
                    // Hide tooltip immediately when sections change
                    hideTrbPriceTooltip();
                }
            }
        });
    });
    
    // Start observing section changes
    document.addEventListener('DOMContentLoaded', function() {
        const sections = document.querySelectorAll('.function-section');
        sections.forEach(section => {
            observer.observe(section, { attributes: true });
        });
        
        // Add global event listeners to hide tooltip
        document.addEventListener('click', function(e) {
            // Hide tooltip when clicking anywhere except TRB inputs
            if (!e.target.classList.contains('trb-input-field')) {
                enhancedHideTooltip();
            }
        });
    });

    // Add CSS class to all TRB input fields for identification
    stakeAmountInput.classList.add('trb-input-field');
    if (ethStakeAmountInput) {
        ethStakeAmountInput.classList.add('trb-input-field');
    }
    if (delegateStakeAmountInput) {
        delegateStakeAmountInput.classList.add('trb-input-field');
    }
    
    // Add event listeners to all TRB input fields
    stakeAmountInput.addEventListener('input', updateTooltip);
    stakeAmountInput.addEventListener('focus', updateTooltip);
    if (ethStakeAmountInput) {
        ethStakeAmountInput.addEventListener('input', updateTooltip);
        ethStakeAmountInput.addEventListener('focus', updateTooltip);
    }
    if (delegateStakeAmountInput) {
        delegateStakeAmountInput.addEventListener('input', updateTooltip);
        delegateStakeAmountInput.addEventListener('focus', updateTooltip);
    }
    window.addEventListener('resize', positionTooltip);
    


    // Add event listener for bridge direction changes
    const bridgeToLayerBtn = document.getElementById('bridgeToLayerBtn');
    const bridgeToEthBtn = document.getElementById('bridgeToEthBtn');
    if (bridgeToLayerBtn && bridgeToEthBtn) {
        const handleDirectionChange = () => {
            // Hide tooltip when switching directions
            tooltip.style.display = 'none';
            // Update tooltip for the new active input
            const activeInput = App.currentBridgeDirection === 'layer' ? stakeAmountInput : ethStakeAmountInput;
            if (activeInput && activeInput.value) {
                updateTooltip();
            }
        };
        bridgeToLayerBtn.addEventListener('click', handleDirectionChange);
        bridgeToEthBtn.addEventListener('click', handleDirectionChange);
    }

    // Function to reset TRB price tooltip (hide and clear content)
    function resetTrbPriceTooltip() {
        tooltip.style.display = 'none';
        tooltip.textContent = '';
        tooltip.style.visibility = 'hidden';
    }

    // Function to hide TRB price tooltip completely
    function hideTrbPriceTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'scale(0.95)';
            tooltip.textContent = '';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
            tooltip.style.zIndex = '-1';
        }
        
        // Also try to hide any other tooltips that might exist
        const allTooltips = document.querySelectorAll('.trb-price-tooltip');
        allTooltips.forEach(t => {
            t.style.display = 'none';
            t.style.visibility = 'hidden';
            t.style.opacity = '0';
            t.style.transform = 'scale(0.95)';
            t.style.left = '-9999px';
            t.style.top = '-9999px';
            t.style.zIndex = '-1';
        });
    }
    
    // Enhanced tooltip hiding function
    function enhancedHideTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'scale(0.95)';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
            tooltip.style.zIndex = '-1';
        }
    }
    
    // Function to show tooltip properly
    function showTooltip() {
        if (tooltip) {
            tooltip.style.display = 'block';
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1)';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '1000';
        }
    }

    // Add event listeners for section changes
    document.addEventListener('DOMContentLoaded', function() {
        // Listen for clicks on nav options and orbiting pods
        const navOptions = document.querySelectorAll('.nav-option, .orbiting-pod');
        navOptions.forEach(option => {
            option.addEventListener('click', function() {
                const functionType = this.getAttribute('data-function');
                // Hide tooltip immediately when switching sections
                enhancedHideTooltip();
                
                // Check scroll indicator for dispute section
                if (functionType === 'dispute') {
                    setTimeout(() => {
                        if (window.checkScrollIndicatorVisibility) {
                            window.checkScrollIndicatorVisibility();
                        }
                    }, 200);
                }
                
                // Also hide tooltip when any section becomes active
                setTimeout(() => {
                    enhancedHideTooltip();
                }, 50);
                
                // For sections with TRB inputs, check if there's a value and show tooltip if appropriate
                if (functionType !== 'dispute') {
                    setTimeout(() => {
                        const activeInput = App.currentBridgeDirection === 'layer' ? stakeAmountInput : ethStakeAmountInput;
                        if (activeInput && activeInput.value && parseFloat(activeInput.value) > 0) {
                            updateTooltip();
                        }
                    }, 200);
                }
            });
        });

        // Listen for back to hub button - hide tooltip completely
        const backToHubBtn = document.getElementById('backToHubBtn');
        if (backToHubBtn) {
            backToHubBtn.addEventListener('click', hideTrbPriceTooltip);
        }
    });

    // Function to check if tooltip should be visible based on current section
    function shouldTooltipBeVisible() {
        const bridgeSection = document.getElementById('bridgeSection');
        const delegateSection = document.getElementById('delegateSection');
        
        const result = (bridgeSection && bridgeSection.classList.contains('active')) ||
               (delegateSection && delegateSection.classList.contains('active'));
        

        
        return result;
    }
    
    // Clean up tooltip when page is unloaded
    window.addEventListener('beforeunload', function() {
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    });
  },

  showPendingPopup: function(message) {
    const popup = document.createElement('div');
    popup.id = 'pendingPopup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '50px';
    popup.style.backgroundColor = '#d4d8e3';
    popup.style.color = '#083b44';
    popup.style.borderRadius = '10px';
    popup.style.zIndex = '1000';
    popup.style.border = '3px solid black';
    popup.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    popup.style.fontSize = "15px";
    popup.style.width = '250px'; // Set a fixed width
    popup.style.textAlign = 'center'; // Center the text
  
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    popup.appendChild(messageSpan);
  
    const ellipsis = document.createElement('span');
    ellipsis.id = 'ellipsis';
    ellipsis.textContent = '';
    ellipsis.style.display = 'inline-block';
    ellipsis.style.width = '10px'; // Set a fixed width for the ellipsis
    ellipsis.style.textAlign = 'left'; // Align dots to the left within their fixed width
    popup.appendChild(ellipsis);
  
    document.body.appendChild(popup);
  
    let dots = 0;
    const animateEllipsis = setInterval(() => {
      dots = (dots + 1) % 4;
      ellipsis.textContent = '.'.repeat(dots);
    }, 500);
  
    // Store the interval ID on the popup element
    popup.animationInterval = animateEllipsis;
  },
  
  hidePendingPopup: function() {
    const popup = document.getElementById('pendingPopup');
    if (popup) {
      // Clear the animation interval
      clearInterval(popup.animationInterval);
      popup.remove();
    }
  },

  getAllowance: async function() {
    // Skip allowance check for Keplr
    if (App.isKeplrConnected) {
      return '0';
    }

    if (!App.account || !App.contracts.Token || !App.contracts.Bridge) {
      // console.error(...);
      return '0';
    }

    try {
      const allowance = await App.contracts.Token.methods.allowance(
        App.account,
        App.contracts.Bridge.options.address
      ).call();
      return allowance;
    } catch (error) {
      // console.error(...);
      return '0';
    }
  },

  updateBalance: async function() {
    if (!App.contracts.Token || !App.account) return;
    
    try {
        const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
        const readableBalance = App.web3.utils.fromWei(balance, 'ether');
        const formattedBalance = parseFloat(readableBalance).toFixed(6);
        
        // Update balance display
        const layerBalanceElement = document.getElementById("currentBalance");
        
        if (layerBalanceElement) {
            layerBalanceElement.textContent = `Balance: ${formattedBalance} TRB`;
        }
    } catch (error) {
        // console.error(...);
        // Set balance to 0 on error
        const layerBalanceElement = document.getElementById("currentBalance");
        
        if (layerBalanceElement) layerBalanceElement.textContent = "Balance: 0.000000 TRB";
    }
  },

  withdrawFromLayer: async function() {
    try {
        if (!App.isKeplrConnected) {
            alert('Please connect your Keplr wallet first');
            return;
        }

        // Check if we have a valid cosmosChainId
        if (!App.cosmosChainId) {
            App.showValidationErrorPopup('Network not detected. Please reconnect your wallet.');
            return;
        }

        const bridgeMismatch = App.getEthCosmosBridgeNetworkMismatchMessage();
        if (bridgeMismatch) {
            App.showValidationErrorPopup(bridgeMismatch);
            return;
        }

        const amount = document.getElementById('ethStakeAmount').value;
        const ethereumAddress = (document.getElementById('ethQueryId').value || '').trim();

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            App.showValidationErrorPopup('Please enter a valid amount');
            return;
        }

        if (!ethereumAddress || !ethereumAddress.startsWith('0x')) {
            App.showValidationErrorPopup('Please enter a valid Ethereum address');
            return;
        }

        const recipientHex = ethereumAddress.toLowerCase().replace(/^0x/, '').replace(/\s+/g, '');
        if (!/^[0-9a-f]{40}$/.test(recipientHex)) {
            App.showValidationErrorPopup('Ethereum recipient must be 40 hex characters (check for spaces or typos).');
            return;
        }

        // Convert amount to micro units (1 TRB = 1,000,000 micro units)
        const amountInMicroUnits = Math.floor(parseFloat(amount) * 1000000).toString();
        
        // Validate amount is positive and reasonable
        if (parseInt(amountInMicroUnits) <= 0) {
            App.showValidationErrorPopup('Please enter a valid amount greater than 0');
            return;
        }

        // Get offline signer from wallet adapter or Keplr
        let offlineSigner;
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        } else {
            offlineSigner = window.keplr.getOfflineSigner(App.cosmosChainId);
        }

        const rpcEndpoint = App.getCosmosRpcEndpoint();

        // Create the client using the stargate implementation
        const client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            rpcEndpoint,
            offlineSigner
        );

        // console.log(...);

        // Create the message - using the same format as the successful transaction
        const msg = {
            typeUrl: '/layer.bridge.MsgWithdrawTokens',
            value: {
                creator: App.keplrAddress,
                recipient: recipientHex,
                amount: {
                    denom: 'loya',
                    amount: amountInMicroUnits
                }
            }
        };

        App.showPendingPopup("Withdrawal transaction pending...");

        // Sign and broadcast using direct signing
        // console.log(...);
        App.debugLog('Message details:', {
            creator: msg.value.creator,
            recipient: msg.value.recipient,
            amount: msg.value.amount,
            amountInMicroUnits: amountInMicroUnits,
            originalAmount: amount,
            ethereumAddress: ethereumAddress
        });
        
        // Compare with successful transaction format
        App.debugLog('Expected format (from successful tx):', {
            creator: 'tellor1072q49v0sacgmlq4hkwzhryz5zefgl73jg5493',
            recipient: 'b2d6aaf0bca136c252ec94f0f06c2489f734675f',
            amount: { denom: 'loya', amount: '100000' }
        });
        const result = await client.signAndBroadcastDirect(
            App.keplrAddress,
            [msg],
            {
                amount: [{ denom: 'loya', amount: '5000' }],
                gas: '200000'
            },
            'Withdraw TRB to Ethereum'
        );

        // console.log(...);
        // console.log(...);
        // console.log(...);

        // console.log(...);
        App.hidePendingPopup();
        
        if (result && result.code === 0) {
            // Get transaction hash from the result - try multiple possible locations
            const txHash = result.txhash || 
                          result.tx_response?.txhash || 
                          result.transactionHash ||
                          result.hash ||
                          (result.tx_response && result.tx_response.txhash);
            
            App.debugLog('Attempting to extract transaction hash from:', {
                result_txhash: result.txhash,
                result_tx_response_txhash: result.tx_response?.txhash,
                result_transactionHash: result.transactionHash,
                result_hash: result.hash,
                full_result: result
            });
            
            if (!txHash) {
                // console.error(...);
                App.showErrorPopup("Transaction successful but no hash found. Please check your wallet.");
                return result;
            }
            
            // console.log(...);
            // console.log(...);
            
            // Try different hash formats for the explorer
            const hashFormats = [
                txHash,
                txHash.toUpperCase(),
                txHash.toLowerCase(),
                txHash.replace('0x', ''),
                txHash.replace('0x', '').toUpperCase(),
                txHash.replace('0x', '').toLowerCase()
            ];
            
            // Try different explorer URLs
            const explorerUrls = [
                `https://explorer.tellor.io/txs/`,
                `https://testnet-explorer.tellor.io/txs/`,
                `https://layer-explorer.tellor.io/txs/`,
                `https://explorer.palmito.tellorlayer.com/txs/`,
                `https://testnet.palmito.tellorlayer.com/txs/`
            ];
            
            // console.log(...);
            // console.log(...);
            
            // Wait a moment for transaction to be indexed
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify transaction exists on blockchain
            let transactionConfirmed = false;
            try {
                const verifyResponse = await fetch(`${App.getApiEndpoint()}/cosmos/tx/v1beta1/txs/${txHash}`);
                if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    // console.log(...);
                    if (verifyData.tx_response && verifyData.tx_response.code === 0) {
                        // console.log(...);
                        transactionConfirmed = true;
                        
                        // Check for withdrawal-specific events
                        const events = verifyData.tx_response.events || [];
                        const withdrawEvent = events.find(event => event.type === 'tokens_withdrawn');
                        if (withdrawEvent) {
                            // console.log(...);
                        } else {
                            // console.warn(...);
                        }
                    } else {
                        // console.log(...);
                        // console.warn(...);
                        App.debugLog('Transaction error details:', {
                            code: verifyData.tx_response?.code,
                            raw_log: verifyData.tx_response?.raw_log,
                            events: verifyData.tx_response?.events
                        });
                        
                        // Try alternative endpoints
                        const altEndpoints = [
                                        `${App.getApiEndpoint()}/rpc/tx?hash=0x${txHash}&prove=false`,
            `${App.getApiEndpoint()}/cosmos/tx/v1beta1/txs/${txHash.toUpperCase()}`,
            `${App.getApiEndpoint()}/cosmos/tx/v1beta1/txs/${txHash.toLowerCase()}`
                        ];
                        
                        for (const endpoint of altEndpoints) {
                            try {
                                const altResponse = await fetch(endpoint);
                                if (altResponse.ok) {
                                    const altData = await altResponse.json();
                                    // console.log(...);
                                    if (altData.tx_response && altData.tx_response.code === 0) {
                                        transactionConfirmed = true;
                                        // console.log(...);
                                    }
                                    break;
                                }
                            } catch (altError) {
                                // console.warn(...);
                            }
                        }
                    }
                } else {
                    // console.warn(...);
                }
            } catch (error) {
                // console.warn(...);
            }
            
            // console.log(...);
        
        // Simplify success handling to match the working requestAttestation pattern
        if (result && result.code === 0) {
            // Get transaction hash from the result (same as requestAttestation)
            const txHash = result.txhash || result.tx_response?.txhash;
            const w = App.withdrawalAttestationDelayLabel().long;
            App.showSuccessPopup(`Withdrawal successful! You will need to wait ${w} before you can claim your tokens on Ethereum.`, txHash, 'cosmos');
        } else {
            throw new Error(result?.rawLog || result?.raw_log || "Withdrawal failed");
        }
        
        await App.updateKeplrBalance();
        return result;
        } else {
            throw new Error(result?.rawLog || result?.raw_log || "Withdrawal failed");
        }
    } catch (error) {
        // console.error(...);
        App.hidePendingPopup();
        App.showErrorPopup(error.message || "Error withdrawing tokens. Please try again.");
        throw error;
    }
  },

  // Add withdrawal history functions
  addWithdrawalHistory: async function() {
    const transactionsContainer = document.querySelector('.transactions-container');

    // Check if withdrawal history already exists
    const existingHistory = document.querySelector('#withdrawal-history');
    if (existingHistory) {
        await this.updateWithdrawalHistory();
        return;
    }

    // No need to create the container structure as it's now in the HTML
    await this.updateWithdrawalHistory();
  },

  // Function to fetch withdrawal history
  getWithdrawalHistory: async function(showAll = false) {
    try {
        let address;
        let isEvmWallet = false;

        if (App.isKeplrConnected) {
            address = App.keplrAddress;
        } else if (App.isConnected && App.account) {
            address = App.account;
            isEvmWallet = true;
        } else {
            return [];
        }

        if (!address) {
            return [];
        }

        // Clean the connected address
        const cleanAddress = address.toLowerCase().trim();

        // Use the correct API endpoint
        const baseEndpoint = App.getApiEndpoint();
        
        // Get last withdrawal ID with proper error handling
        const response = await fetch(`${baseEndpoint}/layer/bridge/get_last_withdrawal_id`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // console.error(...);
            return [];
        }

        const data = await response.json();
        const lastWithdrawalId = Number(data.withdrawal_id);

        if (!lastWithdrawalId || lastWithdrawalId <= 0) {
            return [];
        }
        
        if (!App.contracts.Bridge) {
            console.error('Bridge contract not available');
            return [];
        }

        // Create arrays for withdrawal data, claim status, and on-chain details promises
        const withdrawalPromises = [];
        const claimStatusPromises = [];
        const withdrawDetailPromises = [];

        const v2Start = App.v2StartingWithdrawId || 0;

        for (let id = 1; id <= lastWithdrawalId; id++) {
            const queryId = generateWithdrawalQueryId(id);
            withdrawalPromises.push(this.fetchWithdrawalData(queryId));

            if (id >= v2Start) {
                claimStatusPromises.push(
                    App.contracts.Bridge.methods.withdrawClaimed(id).call()
                        .then(claimed => ({ claimed: Boolean(claimed), withdrawalId: id }))
                        .catch(err => {
                            console.error(`❌ Error checking claim status for withdrawal ${id}:`, err);
                            return { claimed: false, withdrawalId: id };
                        })
                );
                withdrawDetailPromises.push(
                    App.contracts.Bridge.methods.withdrawDetails(id).call()
                        .then(details => ({
                            withdrawalId: id,
                            pendingAmount: details.pendingAmount || '0',
                            lastVerifiedTime: details.lastVerifiedTime || '0'
                        }))
                        .catch(() => ({ withdrawalId: id, pendingAmount: '0', lastVerifiedTime: '0' }))
                );
            } else {
                claimStatusPromises.push(
                    Promise.resolve({ claimed: false, withdrawalId: id, isV1: true })
                );
                withdrawDetailPromises.push(
                    Promise.resolve({ withdrawalId: id, pendingAmount: '0', lastVerifiedTime: '0' })
                );
            }
        }

        const [withdrawalResults, claimStatuses, withdrawDetails] = await Promise.all([
            Promise.all(withdrawalPromises),
            Promise.all(claimStatusPromises),
            Promise.all(withdrawDetailPromises)
        ]);
        
        // Filter and process valid withdrawals
        const withdrawals = withdrawalResults
            .map((withdrawalData, index) => {
                if (!withdrawalData?.parsed) {
                    return null;
                }

                const id = index + 1;
                const parsedData = withdrawalData.parsed;

                // Clean up addresses - handle both EVM and Cosmos addresses
                const cleanRecipient = parsedData.recipient
                    ? parsedData.recipient.toLowerCase().trim()
                    : '';
                
                const cleanSender = parsedData.sender
                    ? parsedData.sender.toLowerCase().trim()
                    : '';

                // If showAll is true, show all withdrawals. Otherwise filter by address
                const matchesAddress = showAll || 
                    (isEvmWallet && cleanSender === cleanAddress) ||
                    (!isEvmWallet && cleanRecipient === cleanAddress);

                if (matchesAddress) {
                    const claimedStatus = claimStatuses[index]?.claimed || false;
                    const details = withdrawDetails[index] || {};
                    const pendingAmount = details.pendingAmount || '0';
                    return {
                        id,
                        sender: parsedData.sender,
                        recipient: parsedData.recipient,
                        amount: parsedData.amount.toString(),
                        pendingAmount,
                        timestamp: withdrawalData.raw.timestamp,
                        claimed: claimedStatus,
                        isMine: (isEvmWallet && cleanSender === cleanAddress) ||
                                (!isEvmWallet && cleanRecipient === cleanAddress)
                    };
                }
                return null;
            })
            .filter(withdrawal => withdrawal !== null)
            .sort((a, b) => b.id - a.id); // Sort by ID in descending order

        return withdrawals;
    } catch (error) {
        // console.error(...);
        return [];
    }
  },

  fetchWithdrawalData: async function(queryId, retryCount = 0) {
    try {
        const endpoint = `${App.getApiEndpoint()}/tellor-io/layer/oracle/get_current_aggregate_report/${queryId}`;
        
        const response = await fetch(endpoint);
        
        // Check if response is HTML instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('Server returned HTML instead of JSON. The API endpoint may be down.');
        }
        
        if (!response.ok) {
            if (response.status === 400) {
                return null;
            }
            // Retry on server errors (5xx) or network errors
            if ((response.status >= 500 || response.status === 0) && retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return this.fetchWithdrawalData(queryId, retryCount + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.aggregate || !data.aggregate.aggregate_value) {
            return null;
        }

        // Return both the raw data and the parsed data
        return {
            raw: data,
            parsed: this.parseWithdrawalData(data.aggregate.aggregate_value)
        };
    } catch (error) {
        // console.error(...);
        // Retry on network errors or if we haven't exceeded retry limit
        if (retryCount < 3 && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return this.fetchWithdrawalData(queryId, retryCount + 1);
        }
        return null;
    }
  },

  parseWithdrawalData: function(data) {
    try {
        // Add 0x prefix if not present
        const hexData = data.startsWith('0x') ? data : '0x' + data;
        
        // Convert to bytes
        const bytes = ethers.utils.arrayify(hexData);
        
        // Define the ABI types for decoding
        const abiCoder = new ethers.utils.AbiCoder();
        const types = ['address', 'string', 'uint256', 'uint256'];
        
        // Decode the bytes
        const [sender, recipient, amount, tip] = abiCoder.decode(types, bytes);

        return {
            sender,
            recipient,
            amount,
            tip
        };
    } catch (error) {
        // console.error(...);
        return null;
    }
  },

  // Function to update withdrawal history UI
  _withdrawalStylesInjected: false,
  _withdrawalCooldownTimer: null,
  _withdrawalCooldownRefreshScheduled: false,

  withdrawalAttestationDelayMs: function () {
    return 12 * 60 * 60 * 1000;
  },

  withdrawalAttestationDelayLabel: function () {
    return { long: '12 hours', short: '12h' };
  },

  syncWithdrawalAttestationHelpCopy: function () {
    const el = document.getElementById('withdrawRequestAttestWaitTooltip');
    if (!el) {
      return;
    }
    const { long } = App.withdrawalAttestationDelayLabel();
    el.textContent =
      `Uses Cosmos Wallet. Must wait ${long} after withdrawal request is made before you can continue to step 2, request Attestation`;
  },

  withdrawalAttestationUnlockMs: function (tx) {
    const ts = Number(tx.timestamp);
    if (!Number.isFinite(ts)) {
      return Date.now();
    }
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return ms + App.withdrawalAttestationDelayMs();
  },

  formatWithdrawCooldown: function (remainingMs) {
    if (remainingMs <= 0) {
      return '0:00:00';
    }
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  clearWithdrawalCooldownTimer: function () {
    if (App._withdrawalCooldownTimer) {
      clearInterval(App._withdrawalCooldownTimer);
      App._withdrawalCooldownTimer = null;
    }
  },

  bindWithdrawalCooldownCountdowns: function () {
    App.clearWithdrawalCooldownTimer();
    const spans = document.querySelectorAll('.withdraw-cooldown-remain');
    if (!spans.length) {
      return;
    }
    const tick = () => {
      let anyUnlocked = false;
      spans.forEach((span) => {
        const wrap =
          span.closest('[data-withdraw-unlock-ms]') || span.closest('[data-claim-extra-unlock-ms]');
        if (!wrap) {
          return;
        }
        const unlockMs = Number(
          wrap.getAttribute('data-withdraw-unlock-ms') || wrap.getAttribute('data-claim-extra-unlock-ms')
        );
        const rem = unlockMs - Date.now();
        if (rem <= 0) {
          span.textContent = App.formatWithdrawCooldown(0);
          anyUnlocked = true;
        } else {
          span.textContent = App.formatWithdrawCooldown(rem);
        }
      });
      if (anyUnlocked && !App._withdrawalCooldownRefreshScheduled) {
        App._withdrawalCooldownRefreshScheduled = true;
        App.clearWithdrawalCooldownTimer();
        App.updateWithdrawalHistory().finally(() => {
          App._withdrawalCooldownRefreshScheduled = false;
        });
      }
    };
    tick();
    App._withdrawalCooldownTimer = setInterval(tick, 1000);
  },

  updateWithdrawalHistory: async function() {
    // Withdrawal/oracle history is only relevant in Bridge to Ethereum view.
    // Skip heavy oracle polling while on Bridge to Tellor / Delegate views.
    if (App.currentBridgeDirection !== 'ethereum') {
      App.clearWithdrawalCooldownTimer();
      return;
    }

    App.clearWithdrawalCooldownTimer();
    const refreshBtn = document.querySelector('button[onclick="App.updateWithdrawalHistory()"]');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span>⏳</span><span>Loading...</span>';
    }

    try {
        const showAllCheckbox = document.getElementById('showAllWithdrawals');
        const showAll = showAllCheckbox ? showAllCheckbox.checked : false;
        
        const legend = document.getElementById('withdrawalLegend');
        if (legend) {
            legend.style.display = showAll ? 'inline-flex' : 'none';
        }
        
        const transactions = await this.getWithdrawalHistory(showAll);

        let bridgeExtraUnlockMs = null;
        let bridgeTrbDecimals = 12;
        let bridgeExtraWindowSec = 43200;
        if (App.contracts && App.contracts.Bridge && App.contracts.Bridge.methods) {
            try {
                const [wt, tw, mult] = await Promise.all([
                    App.contracts.Bridge.methods.withdrawLimitUpdateTime().call(),
                    App.contracts.Bridge.methods.TWELVE_HOUR_CONSTANT().call(),
                    App.contracts.Bridge.methods.TOKEN_DECIMAL_PRECISION_MULTIPLIER().call()
                ]);
                bridgeExtraUnlockMs = ethers.BigNumber.from(wt).add(tw).mul(1000).toNumber();
                bridgeTrbDecimals = App.bridgeTrbDecimalsFromMultiplier(mult);
                App._cachedBridgeTrbDecimals = bridgeTrbDecimals;
                bridgeExtraWindowSec = ethers.BigNumber.from(tw).toNumber();
            } catch (e) {
                console.warn('Bridge withdraw limit timing / TRB multiplier fetch failed:', e);
            }
        }
        const claimExtraWindowLabel = (() => {
            const sec = bridgeExtraWindowSec;
            if (sec >= 86400) {
                return `${Math.round(sec / 86400)} day(s)`;
            }
            if (sec >= 3600) {
                return `${Math.round(sec / 3600)} hour(s)`;
            }
            if (sec >= 60) {
                return `${Math.round(sec / 60)} minute(s)`;
            }
            return `${sec}s`;
        })();

        const tableBody = document.querySelector('#withdrawal-history tbody');
        if (!tableBody) {
            return;
        }

        if (!this._withdrawalStylesInjected) {
            this._withdrawalStylesInjected = true;
            const style = document.createElement('style');
            style.textContent = `
                #withdrawal-history {
                    border-collapse: collapse;
                    width: 100%;
                }
                #withdrawal-history th {
                    background-color: #f8f9fa;
                    padding: 12px;
                    text-align: left;
                    border-bottom: 2px solid #e2e8f0;
                    font-weight: 600;
                    color: #2d3748;
                }
                #withdrawal-history td {
                    padding: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                #withdrawal-history tr:last-child td {
                    border-bottom: none;
                }
                #withdrawal-history tr:hover {
                    background-color: #f8f9fa;
                }
                #withdrawal-history tr[style*="background-color: #e6f7f7"]:hover {
                    background-color: #d1eeee !important;
                }
                .amount-column {
                    text-align: right;
                }
                .address-cell {
                    font-family: monospace;
                    color: #4a5568;
                }
                .status-true {
                    color: #38a169;
                    font-weight: 500;
                }
                .status-false {
                    color: #e53e3e;
                    font-weight: 500;
                }
                .attest-button, .claim-button {
                    margin: 0 4px;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: opacity 0.2s;
                }
                .attest-button:hover, .claim-button:hover {
                    opacity: 0.9;
                }
                .attest-button:disabled, .claim-button:disabled {
                    background-color: #cbd5e0 !important;
                    cursor: not-allowed;
                    opacity: 0.7;
                }
                .attest-button.disconnected {
                    background-color: #cbd5e0 !important;
                    cursor: not-allowed;
                    opacity: 0.7;
                }
                .withdraw-cooldown-wrap {
                    max-width: 320px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    background: #fffbeb;
                    border: 1px solid #f6e05e;
                }
                .withdraw-cooldown-msg {
                    margin: 0 0 8px 0;
                    font-size: 13px;
                    color: #744210;
                    line-height: 1.4;
                }
                .withdraw-cooldown-display {
                    font-size: 15px;
                    font-weight: 600;
                    color: #c05621;
                    font-family: ui-monospace, monospace;
                }
                .withdraw-cooldown-label {
                    font-weight: 500;
                    color: #744210;
                    margin-right: 8px;
                    font-family: inherit;
                }
                .claim-extra-panel .claim-button {
                    display: block;
                    width: 100%;
                    margin: 10px 0 0 0;
                    box-sizing: border-box;
                }
            `;
            document.head.appendChild(style);
        }

        // Clear existing content
        tableBody.innerHTML = '';

        // Check if MetaMask is connected
        if (!App.isConnected) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style=" text-align: center; border: none;">
                        <div style="background-color: #f8f9fa; border-radius: 8px;">
                            <h4 style=" color: #2d3748; font-size: 18px;">
                                Connect Ethereum wallet to View Withdrawals
                            </h4>
                            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">
                                Note: You need your Ethereum wallet connected to claim your withdrawals on Ethereum.
                            </p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        if (!transactions || transactions.length === 0) {
            const message = showAll ? 
                'No withdrawal transactions found in the system.' : 
                'No withdrawal transactions found for your connected wallet.';
            const hint = showAll ?
                'There are no withdrawals in the bridge yet.' :
                'If you\'ve made withdrawals from Tellor Layer, they will appear here once processed.';
            
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 40px 20px; text-align: center; border: none;">
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">
                                No Withdrawal Transactions Found
                            </h4>
                            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">
                                ${message}
                            </p>
                            <p style="margin: 0; color: #718096; font-size: 14px;">
                                ${hint}
                            </p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Create and append transaction rows
        for (const tx of transactions) {
            if (!tx || !tx.amount) {
                continue;
            }

            try {
                // Convert amount from micro units to TRB (divide by 1e6)
                const amount = Number(tx.amount) / 1e6;
                // Convert timestamp to milliseconds if it's in seconds
                const timestamp = tx.timestamp * (tx.timestamp < 1e12 ? 1000 : 1);
                const date = new Date(timestamp).toLocaleString();
                
                const row = document.createElement('tr');
                
                // Determine if this is user's withdrawal for highlighting
                const isMyWithdrawal = tx.isMine !== undefined ? tx.isMine : true;
                
                // Highlight user's own withdrawals when showing all
                if (showAll && isMyWithdrawal) {
                    row.style.backgroundColor = '#e6f7f7';
                }
                
                const isV2Withdrawal = tx.id >= (App.v2StartingWithdrawId || 0);

                // Button states based on connection status only (anyone can claim any withdrawal)
                const attestButtonDisabled = !App.isKeplrConnected;
                const attestButtonClass = attestButtonDisabled ? 'attest-button disconnected' : 'attest-button';
                const attestButtonStyle = attestButtonDisabled ? 
                    'background-color: #cbd5e0; color: #718096; border: none;' : 
                    'background-color: #003734; color: #eefffb; border: none;';
                
                const pendingDecimals = App.choosePendingTrbDecimals(tx.pendingAmount, bridgeTrbDecimals, amount);
                const pendingTrb = App.formatBridgePendingTrb(tx.pendingAmount, pendingDecimals);
                const hasPending = isV2Withdrawal && pendingTrb > 0;
                const claimExtraUnlockAt =
                    bridgeExtraUnlockMs != null && Number.isFinite(bridgeExtraUnlockMs)
                        ? bridgeExtraUnlockMs
                        : null;
                const claimExtraLocked =
                    Boolean(hasPending && claimExtraUnlockAt != null && Date.now() < claimExtraUnlockAt);
                const claimExtraRemainMs =
                    claimExtraLocked && claimExtraUnlockAt != null ? claimExtraUnlockAt - Date.now() : 0;
                const claimExtraBtnDisabled = claimExtraLocked || !App.isConnected;
                const claimExtraBtnStyle = claimExtraBtnDisabled
                    ? 'background-color:#a0aec0;color:#fff;border:none;cursor:not-allowed;'
                    : 'background-color:#d69e2e;color:#fff;border:none;';

                const unlockMs = App.withdrawalAttestationUnlockMs(tx);
                const attestCooldownActive = isV2Withdrawal && !tx.claimed && Date.now() < unlockMs;
                const remainingMs = unlockMs - Date.now();
                const attestWait = App.withdrawalAttestationDelayLabel();

                let v2ActionsHtml = '';
                if (!isV2Withdrawal) {
                    v2ActionsHtml = `<span style="color: #718096; font-size: 12px;">V1 Bridge</span>`;
                } else if (!tx.claimed) {
                    if (attestCooldownActive) {
                        v2ActionsHtml = `
                            <div class="withdraw-cooldown-wrap" data-withdraw-unlock-ms="${unlockMs}">
                                <div class="withdraw-cooldown-display">
                                    <span class="withdraw-cooldown-label">Time remaining</span>
                                    <span class="withdraw-cooldown-remain">${App.formatWithdrawCooldown(remainingMs)}</span>
                                </div>
                                <p class="withdraw-cooldown-msg">
                                    Request attestation Claim withdrawal buttons will unlock
                                    <strong>${attestWait.long}</strong> after this withdrawal appears on Layer.
                                </p>
                            </div>`;
                    } else {
                        v2ActionsHtml = `
                            <button class="${attestButtonClass}" onclick="App.requestAttestation(${tx.id})" 
                                style="${attestButtonStyle}" ${attestButtonDisabled ? 'disabled' : ''}>
                                <span class="tooltip-container">
                                    <span>2. Request</span><span>Attestation</span>
                                    <span class="tooltip-icon tooltip-icon-white">?</span>
                                    <span class="tooltip-text tooltip-text-right">Uses Cosmos Wallet. Must wait ${attestWait.long} after withdrawal request (step 1) is made before you can request Attestation (step 2)</span>
                                </span>
                            </button>
                            <button class="claim-button" onclick="App.claimWithdrawal(${tx.id})" 
                                style="background-color: #38a169; color: #eefffb; border: none;">
                                <span class="tooltip-container">
                                    <span>3. Process</span><span>Withdrawal</span>
                                    <span class="tooltip-icon tooltip-icon-white">?</span>
                                    <span class="tooltip-text tooltip-text-right">Uses Ethereum Wallet. Must claim withdrawal (step 3) within 12 hours after Attestation request (step 2) is made. Otherwise you must re-request attestation</span>
                                </span>
                            </button>`;
                    }
                }

                row.innerHTML = `
                    <td style="white-space: normal;">
                        ${v2ActionsHtml}
                        ${hasPending
                            ? `<div class="withdraw-cooldown-wrap claim-extra-panel" style="margin-top:8px;"${
                                  claimExtraLocked ? ` data-claim-extra-unlock-ms="${claimExtraUnlockAt}"` : ''
                              }>
                                ${
                                    claimExtraLocked
                                        ? `<div class="withdraw-cooldown-display">
                                        <span class="withdraw-cooldown-label">Claim Extra unlocks in</span>
                                        <span class="withdraw-cooldown-remain">${App.formatWithdrawCooldown(claimExtraRemainMs)}</span>
                                    </div>
                                    <p class="withdraw-cooldown-msg" style="font-size:12px;margin:6px 0 0;">
                                        Limit window: <strong>${claimExtraWindowLabel}</strong> after each bridge withdraw limit update.
                                    </p>`
                                        : `<div class="withdraw-cooldown-display" style="font-size:14px;">
                                        <span class="withdraw-cooldown-label">Claim Extra</span>
                                        <span>${pendingTrb.toFixed(2)} TRB pending</span>
                                    </div>
                                    <p class="withdraw-cooldown-msg" style="font-size:12px;margin:6px 0 0;">
                                        You can use <strong>Claim Extra</strong> below. If the on-chain limit has not advanced yet, wait for the next window (<strong>${claimExtraWindowLabel}</strong> after each limit update).
                                    </p>`
                                }
                                <button class="claim-button" type="button"
                                    onclick="App.claimExtraWithdraw(${tx.id})"
                                    style="${claimExtraBtnStyle}"
                                    ${claimExtraBtnDisabled ? 'disabled' : ''}>
                                    <span class="tooltip-container">
                                        <span>Claim Extra</span>
                                        <span class="tooltip-icon tooltip-icon-white">?</span>
                                        <span class="tooltip-text tooltip-text-right">${
                                            claimExtraLocked
                                                ? `${pendingTrb.toFixed(2)} TRB pending — enabled when the countdown ends.`
                                                : `This withdrawal hit the bridge limit. ${pendingTrb.toFixed(2)} TRB pending; claim after the limit resets (${claimExtraWindowLabel} after each limit update).`
                                        }</span>
                                    </span>
                                </button>
                            </div>`
                            : ''}
                    </td>
                    <td style="font-weight: 500;">${tx.id}</td>
                    <td class="address-cell" title="${tx.sender}">${this.formatAddress(tx.sender)}</td>
                    <td class="address-cell" title="${tx.recipient}">${this.formatAddress(tx.recipient)}</td>
                    <td class="amount-column">
                        ${amount.toFixed(2)} TRB
                        ${hasPending ? `<br><span style="color: #d69e2e; font-size: 12px;">(${pendingTrb.toFixed(2)} pending)</span>` : ''}
                    </td>
                    <td>${date}</td>
                    <td class="status-${tx.claimed}">
                        ${!isV2Withdrawal ? '<span style="color: #718096;">V1</span>'
                            : tx.claimed ? 'Claimed'
                            : attestCooldownActive
                                ? `<span style="color: #d69e2e;">Waiting ${attestWait.short}</span>`
                                : 'Pending'}
                        ${hasPending ? '<br><span style="color: #d69e2e; font-size: 12px;">Extra Pending</span>' : ''}
                    </td>
                `;
                tableBody.appendChild(row);
            } catch (error) {
                // console.error(...);
            }
        }

        App.bindWithdrawalCooldownCountdowns();
    } catch (error) {
        const tableBody = document.querySelector('#withdrawal-history tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        Error loading transaction history. Please try again later.
                        <small>${error.message}</small>
                    </td>
                </tr>
            `;
        }
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span>🔄</span><span>Refresh</span>';
        }
    }
  },

  formatAddress: function(address) {
    if (!address) return 'N/A';
    if (address.startsWith('tellor')) {
        return `${address.slice(0, 8)}...${address.slice(-4)}`;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  formatAmount: function(amount) {
    const amountInTRB = Number(amount) / 1000000;
    return amountInTRB.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
  },

  showBalanceErrorPopup: function(message) {
    const modal = document.createElement('div');
    modal.id = 'balanceErrorModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#d4d8e3';
    modalContent.style.color = '#083b44';
    modalContent.style.borderRadius = '10px';
    modalContent.style.border = '3px solid black';
    modalContent.style.padding = '30px';
    modalContent.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    modalContent.style.fontSize = "15px";
    modalContent.style.width = '400px';
    modalContent.style.textAlign = 'center';
    modalContent.style.maxWidth = '90vw';

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.marginBottom = '25px';
    messageDiv.style.lineHeight = '1.4';
    modalContent.appendChild(messageDiv);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.padding = '10px 30px';
    okButton.style.backgroundColor = '#10b981';
    okButton.style.color = 'white';
    okButton.style.border = 'none';
    okButton.style.borderRadius = '5px';
    okButton.style.fontFamily = "'PPNeueMontreal-Bold', Arial, sans-serif";
    okButton.style.fontSize = '14px';
    okButton.style.cursor = 'pointer';
    okButton.style.transition = 'background-color 0.2s';

    // Hover effects
    okButton.onmouseenter = () => {
      okButton.style.backgroundColor = '#059669';
    };
    okButton.onmouseleave = () => {
      okButton.style.backgroundColor = '#10b981';
    };

    // Event handlers
    okButton.onclick = () => {
      document.body.removeChild(modal);
    };

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Auto-close after 5 seconds
    setTimeout(() => {
      const modal = document.getElementById('balanceErrorModal');
      if (modal) {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    }, 5000);

    buttonContainer.appendChild(okButton);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  },

  hideBalanceErrorPopup: function() {
    const modal = document.getElementById('balanceErrorModal');
    if (modal) {
      document.body.removeChild(modal);
    }
  },

  // Show validation error modal (reuses existing popup structure)
  showValidationErrorPopup: function(message) {
    App.showBalanceErrorPopup(message);
  },

  // Add new function to handle delegation
  delegateTokens: async function() {
    try {
        if (!App.isKeplrConnected) {
            alert('Please connect your Cosmos wallet first');
            return;
        }

        // Verify wallet is still enabled for the chain
        try {
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                // Re-enable the chain using wallet adapter
                await window.cosmosWalletAdapter.enableChain();
            } else if (window.keplr) {
                // Fallback to legacy Keplr method
                await window.keplr.enable(App.cosmosChainId);
            } else {
                throw new Error('No wallet available');
            }
        } catch (error) {
            // console.error(...);
            App.isKeplrConnected = false;
            App.keplrAddress = null;
            const keplrButton = document.getElementById('keplrButton');
            if (keplrButton) {
                keplrButton.innerHTML = 'Connect Cosmos Wallet';
            }
            alert('Please reconnect your Cosmos wallet');
            return;
        }

        // Get input values
        const amount = document.getElementById('delegateStakeAmount').value;
        const validatorAddress = document.getElementById('delegateValidatorAddress').value;

        // Validate inputs
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            App.showValidationErrorPopup('Please enter a valid amount');
            return;
        }

        if (!validatorAddress || !validatorAddress.trim()) {
            App.showValidationErrorPopup('Please select a validator from the dropdown');
            return;
        }

        // Validate validator address format (should start with tellorvaloper)
        if (!validatorAddress.startsWith('tellorvaloper')) {
            App.showValidationErrorPopup('Please select a valid validator from the dropdown');
            return;
        }

        // Check if user has sufficient balance
        const amountInMicroUnits = Math.floor(parseFloat(amount) * 1000000).toString();
        
        // Get current balance using the same method as updateKeplrBalance
        let currentBalance = 0;
        try {
            const restUrl = App.getCosmosApiEndpoint();
            const restResponse = await fetch(`${restUrl}/cosmos/bank/v1beta1/balances/${App.keplrAddress}`);
            const restData = await restResponse.json();
            
            if (restData.balances && Array.isArray(restData.balances)) {
                const loyaBalance = restData.balances.find(b => b.denom === 'loya');
                if (loyaBalance) {
                    currentBalance = parseInt(loyaBalance.amount);
                }
            }
        } catch (error) {
            console.error('Error checking balance for delegation:', error);
        }

        if (currentBalance < parseInt(amountInMicroUnits)) {
            const readableCurrentBalance = (currentBalance / 1000000).toFixed(6);
            App.showBalanceErrorPopup(`Insufficient balance. You have ${readableCurrentBalance} TRB but trying to delegate ${amount} TRB.`);
            return;
        }

        const delegateButton = document.getElementById('delegateButton');
        if (delegateButton) {
            delegateButton.disabled = true;
            delegateButton.innerHTML = '<span>Delegating</span><span>...</span>';
        }

        App.showPendingPopup("Delegating tokens...");

        // Get the Layer account from wallet adapter or Keplr
        let offlineSigner;
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        } else {
            offlineSigner = window.keplr.getOfflineSigner(App.cosmosChainId);
        }
        const accounts = await offlineSigner.getAccounts();
        const layerAccount = accounts[0].address;

        // Call the delegation function
        const result = await window.cosmjs.stargate.delegateTokens(
            layerAccount,
            validatorAddress,
            amount
        );

        App.hidePendingPopup();
        
        if (result && result.code === 0) {
            // Get transaction hash from the result
            const txHash = result.txhash || result.tx_response?.txhash;
            App.showSuccessPopup("Delegation successful!", txHash, 'cosmos');
            // Clear the input fields
            document.getElementById('delegateStakeAmount').value = '';
            document.getElementById('delegateValidatorAddress').value = '';
            document.getElementById('delegateValidatorDropdown').value = '';
            // Refresh status to show new delegation
            await App.refreshCurrentStatus();
        } else {
            throw new Error(result?.rawLog || "Delegation failed");
        }
    } catch (error) {
        // console.error(...);
        App.hidePendingPopup();
        App.showErrorPopup(error.message || "Error delegating tokens. Please try again.");
        
        // Re-enable the delegate button if there was an error
        const delegateButton = document.getElementById('delegateButton');
        if (delegateButton) {
            delegateButton.disabled = false;
            delegateButton.innerHTML = '<span>Delegate</span><span>Tokens</span>';
        }
    }
  },

  // Add function to handle reporter selection
  selectReporter: async function() {
    const selectReporterButton = document.getElementById('selectReporterButton');
    try {
        if (!App.isKeplrConnected) {
            alert('Please connect your Cosmos wallet first');
            return;
        }

        // Verify wallet is still enabled for the chain
        try {
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                // Re-enable the chain using wallet adapter
                await window.cosmosWalletAdapter.enableChain();
            } else if (window.keplr) {
                // Fallback to legacy Keplr method
                await window.keplr.enable(App.cosmosChainId);
            } else {
                throw new Error('No wallet available');
            }
        } catch (error) {
            App.isKeplrConnected = false;
            App.keplrAddress = null;
            const keplrButton = document.getElementById('keplrButton');
            if (keplrButton) {
                keplrButton.innerHTML = 'Connect Cosmos Wallet';
            }
            alert('Please reconnect your Cosmos wallet');
            return;
        }

        // Get inputs
        const reporterAddress = document.getElementById('selectedReporterAddress').value;

        // Validate inputs
        if (!reporterAddress || !reporterAddress.trim()) {
            App.showValidationErrorPopup('Please select a reporter from the dropdown');
            return;
        }

        // Validate reporter address format (should be a valid bech32 address)
        if (!reporterAddress.startsWith('tellor')) {
            App.showValidationErrorPopup('Please select a valid reporter from the dropdown');
            return;
        }

        // Get offline signer
        let offlineSigner;
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        } else if (window.getOfflineSigner) {
            offlineSigner = window.getOfflineSigner(App.cosmosChainId);
        } else {
            throw new Error('No offline signer available');
        }

        const accounts = await offlineSigner.getAccounts();
        const layerAccount = accounts[0].address;
        const normalizedReporter = reporterAddress.trim();

        let current = null;
        try {
            current = await App.fetchCurrentReporter(layerAccount);
        } catch (fetchErr) {
            console.error('Error fetching current reporter:', fetchErr);
        }
        const hasExistingReporter = !!(current && current.reporter);

        if (hasExistingReporter && current.reporter === normalizedReporter) {
            App.showBalanceErrorPopup(
                'This reporter is already your selected reporter. Choose a different reporter to switch.'
            );
            return;
        }

        if (hasExistingReporter) {
            const continued = await App.showReporterSwitchDisclaimerModal();
            if (!continued) {
                return;
            }
        }

        if (selectReporterButton) {
            selectReporterButton.disabled = true;
            selectReporterButton.innerHTML = hasExistingReporter ? 'Switching...' : 'Selecting...';
        }

        let result;
        try {
            if (hasExistingReporter) {
                result = await window.cosmjs.stargate.switchReporter(
                    layerAccount,
                    reporterAddress
                );
            } else {
                result = await window.cosmjs.stargate.selectReporter(
                    layerAccount,
                    reporterAddress
                );
            }
        } catch (fetchError) {
            console.error('Error determining current reporter, falling back to selectReporter:', fetchError);
            result = await window.cosmjs.stargate.selectReporter(
                layerAccount,
                reporterAddress
            );
        }

        const success = result && (result.code === 0 || result.tx_response?.code === 0);

        if (success) {
            // Get transaction hash from the result
            const txHash = result.txhash || result.tx_response?.txhash;
            App.showSuccessPopup("Reporter selection successful!", txHash, 'cosmos');
            // Clear the inputs
            document.getElementById('selectedReporterAddress').value = '';
            document.getElementById('reporterDropdown').value = '';
            // Refresh status to show new selection
            await App.refreshCurrentStatus();
        } else {
            const rawLog =
                (result && (result.rawLog ||
                    result.raw_log ||
                    result.tx_response?.rawLog ||
                    result.tx_response?.raw_log ||
                    (Array.isArray(result.logs) && result.logs[0] && result.logs[0].log) ||
                    (Array.isArray(result.tx_response?.logs) &&
                        result.tx_response.logs[0] &&
                        result.tx_response.logs[0].log))) ||
                '';
            console.error('Reporter selection failed raw log:', rawLog, result);
            throw new Error(rawLog || "Reporter selection failed");
        }
    } catch (error) {
        console.error('Reporter selection error:', error);
        const genericReporterSelectionMsg = 'Reporter selection failed';
        const raw = error?.message != null ? String(error.message) : '';
        if (raw.toLowerCase().includes('selector already exists')) {
            App.showBalanceErrorPopup(
                'You already have a reporter selected. Choose another reporter to switch, or refresh the page if your current reporter is not displayed.'
            );
        } else {
            const detail = raw.trim() || genericReporterSelectionMsg;
            const isGenericDetail = detail.toLowerCase() === genericReporterSelectionMsg.toLowerCase();
            const popupMsg = isGenericDetail
                ? detail
                : `${genericReporterSelectionMsg}: ${detail}`;
            App.showBalanceErrorPopup(popupMsg);
        }
    } finally {
        if (selectReporterButton) {
            selectReporterButton.disabled = false;
            App.updateReporterActionButton();
        }
    }
  },

  // Add new function to handle attestation requests
  requestAttestation: async function(withdrawalId) {
    try {
        if (!App.isKeplrConnected) {
            alert('Please connect your Cosmos wallet first');
            return;
        }

        // Verify wallet is still enabled for the chain
        try {
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                // Re-enable the chain using wallet adapter
                await window.cosmosWalletAdapter.enableChain();
            } else if (window.keplr) {
                // Fallback to legacy Keplr method
                await window.keplr.enable(App.cosmosChainId);
            } else {
                throw new Error('No wallet available');
            }
        } catch (error) {
            // console.error(...);
            App.isKeplrConnected = false;
            App.keplrAddress = null;
            const keplrButton = document.getElementById('keplrButton');
            if (keplrButton) {
                keplrButton.innerHTML = 'Connect Cosmos Wallet';
            }
            alert('Please reconnect your Cosmos wallet');
            return;
        }

        const attestButton = document.querySelector(`button[onclick="App.requestAttestation(${withdrawalId})"]`);
        const claimButton = document.querySelector(`button[onclick="App.claimWithdrawal(${withdrawalId})"]`);
        
        if (attestButton) {
            attestButton.disabled = true;
            attestButton.innerHTML = '<span>Requesting</span><span>...</span>';
        }

        App.showPendingPopup("Requesting attestation...");

        // Generate the query ID for the withdrawal
        const queryId = generateWithdrawalQueryId(withdrawalId);

        // Fetch the withdrawal data to get the correct timestamp
        const response = await fetch(`${App.getCosmosApiEndpoint()}/tellor-io/layer/oracle/get_current_aggregate_report/${queryId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch withdrawal data from oracle');
        }

        const data = await response.json();

        if (!data || !data.timestamp) {
            throw new Error('Could not find withdrawal data in oracle. The withdrawal may not be ready for attestation yet.');
        }

        // Use the timestamp from the oracle response
        const timestamp = data.timestamp;

        // Get the Layer account from wallet adapter or Keplr
        let offlineSigner;
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        } else {
            offlineSigner = window.keplr.getOfflineSigner(App.cosmosChainId);
        }
        const accounts = await offlineSigner.getAccounts();
        const layerAccount = accounts[0].address;

        // Create and send the attestation request using the simpler approach
        const result = await window.cosmjs.stargate.requestAttestations(
            layerAccount,
            queryId,
            timestamp
        );

        App.hidePendingPopup();
        
        if (result && result.code === 0) {
            // Get transaction hash from the result
            const txHash = result.txhash || result.tx_response?.txhash;
            App.showSuccessPopup("Attestation requested successfully!", txHash, 'cosmos');
            // Enable the claim button and remove the waiting class
            if (claimButton) {
                claimButton.disabled = false;
                claimButton.classList.remove('waiting-for-attestation');
            }
            // Refresh the withdrawal history
            await this.updateWithdrawalHistory();
        } else {
            throw new Error(result?.rawLog || "Transaction failed");
        }
    } catch (error) {
        // console.error(...);
        App.hidePendingPopup();
        App.showErrorPopup(error.message || "Error requesting attestation. Please try again.");
        
        // Re-enable the attest button if there was an error
        const attestButton = document.querySelector(`button[onclick="App.requestAttestation(${withdrawalId})"]`);
        if (attestButton) {
            attestButton.disabled = false;
            attestButton.innerHTML = '<span>Request</span><span>Attestation</span>';
        }
    }
  },

  // Add validation helper functions
  validateWithdrawalData: async function(withdrawalId, attestData, valset, sigs, powerThreshold) {
        // Validate validator set
        if (!valset || !Array.isArray(valset)) {
            throw new Error('Invalid validator set: must be an array');
        }

        if (!sigs || !Array.isArray(sigs)) {
            throw new Error('Invalid signatures: must be an array');
        }
        if (sigs.length !== valset.length) {
            throw new Error(
                `Signatures and validator set length mismatch (${sigs.length} vs ${valset.length}). Re-fetch attestation.`
            );
        }

        // Check each validator
        for (let i = 0; i < valset.length; i++) {
            const validator = valset[i];

            if (!validator.addr || !validator.power) {
                throw new Error(`Invalid validator at index ${i}: missing required fields`);
            }

            try {
                ethers.utils.getAddress(validator.addr);
            } catch (e) {
                throw new Error(`Invalid validator at index ${i}: invalid address format`);
            }

            if (!ethers.BigNumber.from(validator.power).gt(0)) {
                throw new Error(`Invalid validator at index ${i}: power must be positive`);
            }
        }

        // Check each signature (v may be number or string from Web3)
        for (let i = 0; i < sigs.length; i++) {
            const sig = sigs[i];
            const vNum = Number(sig.v);

            if (vNum === 0) {
                const zeroBytes = '0x0000000000000000000000000000000000000000000000000000000000000000';
                const rHex = typeof sig.r === 'string' ? sig.r : '0x' + sig.r.toString('hex');
                const sHex = typeof sig.s === 'string' ? sig.s : '0x' + sig.s.toString('hex');

                if (rHex !== zeroBytes || sHex !== zeroBytes) {
                    throw new Error(`Invalid signature at index ${i}: zero signature must have zero r and s`);
                }
            } else if (vNum !== 27 && vNum !== 28) {
                throw new Error(`Invalid signature at index ${i}: v must be 0, 27, or 28`);
            }
        }

        if (powerThreshold !== undefined && powerThreshold !== null && powerThreshold !== '') {
            const th = ethers.BigNumber.from(String(powerThreshold).trim());
            let sum = ethers.BigNumber.from(0);
            for (let i = 0; i < valset.length; i++) {
                const vNum = Number(sigs[i].v);
                if (vNum === 27 || vNum === 28) {
                    sum = sum.add(ethers.BigNumber.from(String(valset[i].power)));
                }
            }
            if (sum.lt(th)) {
                const hint =
                    sum.isZero()
                        ? 'No secp256k1 signatures matched the valset for this checkpoint (wrong digest, attestation encoding, or valset addresses). '
                        : '';
                throw new Error(
                    `${hint}Signed voting power (${sum.toString()}) is below the Layer checkpoint threshold (${th.toString()}). ` +
                    `Re-request attestation on Layer, or verify get_valset_by_timestamp / get_validator_checkpoint_params match the attestation snapshot.`
                );
            }
        }

        // uint8 enum: Web3 may return "0", 0, or BN — only 0 is active for standard Tellor bridge
        const bridgeState = await App.contracts.Bridge.methods.bridgeState().call();
        const stateBn = ethers.BigNumber.from(bridgeState);
        if (!stateBn.isZero()) {
            throw new Error(`Bridge is not active. Current bridgeState: ${bridgeState}`);
        }
    },

  // Modify the claimWithdrawal function to include validation
  claimWithdrawal: async function(withdrawalId) {
    let txHash = null;
    let withdrawDetailsSnapshot = null;
    try {
        if (!checkWalletConnection()) {
            return;
        }

        // Check if withdrawal is already claimed
        const isClaimed = await App.contracts.Bridge.methods.withdrawClaimed(withdrawalId).call();
        if (isClaimed) {
            alert('This withdrawal has already been claimed');
            return;
        }

        App.showPendingPopup("Validating withdrawal data...");

        // Fetch withdrawal data
        const withdrawalData = await this.fetchWithdrawalData(generateWithdrawalQueryId(withdrawalId));
        if (!withdrawalData) {
            throw new Error('Could not fetch withdrawal data');
        }

        // Get the timestamp from the withdrawal data
        const withdrawalTimestamp = withdrawalData.raw.timestamp;
        // console.log(...);

        // Fetch attestation data with the withdrawal timestamp
        const attestationData = await this.fetchAttestationData(
            generateWithdrawalQueryId(withdrawalId),
            withdrawalTimestamp
        );
        if (!attestationData) {
            throw new Error('Could not fetch attestation data');
        }

        // Format the data for the contract call
        const txData = await this.formatWithdrawalData(withdrawalId, withdrawalData, attestationData);

        const signedValCount = (txData.sigs || []).filter((sig) => {
          const v = Number(sig.v);
          return v === 27 || v === 28;
        }).length;
        if (signedValCount === 0) {
          throw new Error(
            'No validator signatures are available for this withdrawal yet. Complete **step 2 — Request attestation** with your Cosmos wallet first (including any required wait after the withdrawal request), then try **Claim withdrawal** again once attestation data exists on the bridge.'
          );
        }

        await this.validateWithdrawalData(
            withdrawalId,
            txData.attestData,
            txData.valset,
            txData.sigs,
            attestationData.powerThreshold
        );

        try {
            withdrawDetailsSnapshot = await App.contracts.Bridge.methods.withdrawDetails(withdrawalId).call();
        } catch (_) {
            withdrawDetailsSnapshot = null;
        }

        const claimMethod = App.contracts.Bridge.methods.withdrawFromLayer(
            txData.attestData,
            txData.valset,
            txData.sigs,
            txData.depositId
        );
        const gasLimit = await App.estimateBridgeClaimGas(claimMethod);
        const tx = await claimMethod.send({ from: App.account, gas: gasLimit });

        txHash = tx.transactionHash;
        // console.log(...);
        App.showSuccessPopup("Withdrawal claimed successfully!", txHash, 'ethereum');
        await this.updateWithdrawalHistory();
        return tx;

    } catch (error) {
        // Get transaction hash from error if available
        if (error.transactionHash) {
            txHash = error.transactionHash;
        } else if (error.receipt && error.receipt.transactionHash) {
            txHash = error.receipt.transactionHash;
        }

        const decoded = App.decodeContractError(error);
        const bareRpc =
          /^execution reverted$/i.test(String(decoded || '').trim()) ||
          /^Gas estimation failed$/i.test(String(decoded || '').trim());
        // estimateBridgeClaimGas throws new Error(decoded) so decoded === error.message for contract reverts — still show decoded.
        let errorMessage =
            decoded && decoded.length > 0 && !bareRpc
                ? decoded.startsWith('Claim withdrawal failed:')
                    ? decoded
                    : `Claim withdrawal failed: ${decoded}`
                : `Claim Withdrawal failed. Make sure the full ${App.withdrawalAttestationDelayLabel().long} have passed since you requested withdrawal, then try requesting attestation again for an updated validator set.`;
        if (decoded && decoded.includes('custom error')) {
            errorMessage += ' If you recently changed validators on Layer, request attestation again after the valset used for signing matches.';
        }
        const looksLikeLimitPanic =
            decoded &&
            (decoded.includes('0x11') ||
                decoded.includes('overflow/underflow') ||
                decoded.includes('arithmetic overflow'));
        if (looksLikeLimitPanic) {
            try {
                const wd =
                    withdrawDetailsSnapshot ||
                    (await App.contracts.Bridge.methods.withdrawDetails(withdrawalId).call());
                const pend = ethers.BigNumber.from(wd.pendingAmount || 0);
                const dec = App._cachedBridgeTrbDecimals != null ? App._cachedBridgeTrbDecimals : 12;
                const trbPend = pend.gt(0) ? String(App.formatBridgePendingTrb(wd.pendingAmount, dec)) : null;
                errorMessage += ` <span style="display:block;margin-top:10px;font-size:13px;color:#92400e;">${
                    trbPend
                        ? `On-chain <strong>${trbPend} TRB</strong> is still pending under the bridge withdraw limit — use <strong>Claim Extra</strong> after the limit resets, or claim the first tranche then re-attest if the oracle amount no longer matches.`
                        : 'If this withdrawal is larger than the current bridge withdraw limit, use <strong>Claim Extra</strong> for the remainder after the limit resets, or request a fresh attestation after a partial claim.'
                }</span>`;
            } catch (_) {
                /* ignore */
            }
        }
        console.error('[claimWithdrawal]', error, { decoded, revertHex: App.extractRevertData(error) });
        if (!txHash) {
            errorMessage += ' <span style="display:block;margin-top:8px;font-size:13px;color:#6b7280;">No Sepolia transaction was created — MetaMask stopped at simulation (e.g. gas estimate), so there is nothing to open on Etherscan.</span>';
        }
        if (txHash) {
          // Use correct Etherscan URL based on current Ethereum network
          const etherscanUrl = App.chainId === 1 
            ? `https://etherscan.io/tx/${txHash}`
            : `https://sepolia.etherscan.io/tx/${txHash}`;
          errorMessage += ` <a href="${etherscanUrl}" target="_blank" style="color: #DC2626; text-decoration: underline;">View on Etherscan</a>`;
        }
        
        App.showErrorPopup(errorMessage);
    } finally {
        App.hidePendingPopup();
    }
  },

  claimExtraWithdraw: async function(withdrawalId) {
    let txHash = null;
    try {
        if (!checkWalletConnection()) {
            return;
        }

        const details = await App.contracts.Bridge.methods.withdrawDetails(withdrawalId).call();
        const pendingBn = ethers.BigNumber.from(details.pendingAmount || 0);
        if (pendingBn.lte(0)) {
            alert('No extra amount pending for this withdrawal.');
            return;
        }
        let ped0 = 12;
        try {
            const mult = await App.contracts.Bridge.methods.TOKEN_DECIMAL_PRECISION_MULTIPLIER().call();
            ped0 = App.bridgeTrbDecimalsFromMultiplier(mult);
        } catch (_) {
            /* default ped0 */
        }
        const mainHintTrb = parseFloat(
            ethers.utils.formatUnits(String(details.amount || '0'), 6)
        );
        const ped = App.choosePendingTrbDecimals(details.pendingAmount, ped0, mainHintTrb);
        const pendingTrbHuman = App.formatBridgePendingTrb(details.pendingAmount, ped);

        App.showPendingPopup(`Claiming ${pendingTrbHuman.toFixed(2)} TRB (extra pending)…`);

        const extraMethod = App.contracts.Bridge.methods.claimExtraWithdrawByWithdrawId(withdrawalId);
        const extraGas = await App.estimateBridgeClaimGas(extraMethod);
        const tx = await extraMethod.send({ from: App.account, gas: extraGas });

        txHash = tx.transactionHash;
        App.showSuccessPopup("Extra withdrawal claimed successfully!", txHash, 'ethereum');
        await this.updateWithdrawalHistory();
        return tx;

    } catch (error) {
        if (error.transactionHash) {
            txHash = error.transactionHash;
        } else if (error.receipt && error.receipt.transactionHash) {
            txHash = error.receipt.transactionHash;
        }

        const decodedExtra = App.decodeContractError(error);
        const bareExtra =
            /^execution reverted$/i.test(String(decodedExtra || '').trim()) ||
            /^Gas estimation failed$/i.test(String(decodedExtra || '').trim());
        let errorMessage =
            decodedExtra && decodedExtra.length > 0 && !bareExtra
                ? decodedExtra.startsWith('Claim extra failed:')
                    ? decodedExtra
                    : `Claim extra failed: ${decodedExtra}`
                : "Claim extra withdrawal failed. The bridge withdraw limit may not have reset yet. Please try again later.";
        console.error('[claimExtraWithdraw]', error, { decoded: decodedExtra, revertHex: App.extractRevertData(error) });
        if (!txHash) {
            errorMessage += ' <span style="display:block;margin-top:8px;font-size:13px;color:#6b7280;">No Sepolia transaction was created — simulation failed before submit.</span>';
        }
        if (txHash) {
            const etherscanUrl = App.chainId === 1
                ? `https://etherscan.io/tx/${txHash}`
                : `https://sepolia.etherscan.io/tx/${txHash}`;
            errorMessage += ` <a href="${etherscanUrl}" target="_blank" style="color: #DC2626; text-decoration: underline;">View on Etherscan</a>`;
        }

        App.showErrorPopup(errorMessage);
    } finally {
        App.hidePendingPopup();
    }
  },

  // Helper function to fetch attestation data
  fetchAttestationData: async function(queryId, timestamp) {
    try {
        // Remove 0x prefix for API calls if present
        const apiQueryId = queryId.startsWith('0x') ? queryId.slice(2) : queryId;
        const baseEndpoint = App.getApiEndpoint();
        
        // Step 1: Get snapshots for this report
        const snapshotsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_snapshots_by_report/${apiQueryId}/${timestamp}`
        );

        if (!snapshotsResponse.ok) {
            const errorText = await snapshotsResponse.text();
            // console.error(...);
            throw new Error(`Failed to fetch snapshots: ${errorText}`);
        }

        const snapshotsData = await snapshotsResponse.json();
        
        if (!snapshotsData?.snapshots?.length) {
            throw new Error('Invalid snapshots data: missing snapshots array');
        }

        const lastSnapshot = snapshotsData.snapshots[snapshotsData.snapshots.length - 1];

        // Step 2: Get attestation data using the snapshot
        const attestationDataResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_attestation_data_by_snapshot/${lastSnapshot}`
        );

        if (!attestationDataResponse.ok) {
            throw new Error(`Failed to fetch attestation data: ${attestationDataResponse.statusText}`);
        }

        const rawAttestationData = await attestationDataResponse.json();

        // First get the current validator set timestamp
        const validatorSetTimestampResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_current_validator_set_timestamp`
        );

        if (!validatorSetTimestampResponse.ok) {
            throw new Error(`Failed to fetch current validator set timestamp: ${validatorSetTimestampResponse.statusText}`);
        }

        const validatorSetTimestampData = await validatorSetTimestampResponse.json();
        // Prefer attestation_timestamp so valset + checkpoint params match the signed snapshot.
        // Using only "current" valset breaks claims when the set changed after the attestation (common on devnets).
        let validatorSetTimestampForAttest = validatorSetTimestampData.timestamp;
        const attTsRaw = rawAttestationData.attestation_timestamp;
        if (attTsRaw !== undefined && attTsRaw !== null && attTsRaw !== '') {
            const parsedAttTs = parseInt(String(attTsRaw), 10);
            if (Number.isFinite(parsedAttTs) && parsedAttTs > 0) {
                validatorSetTimestampForAttest = String(parsedAttTs);
            }
        }

        // Get validator set for the attestation-aligned timestamp (fallback to chain "current" if API rejects att ts)
        let valsetTsResolved = validatorSetTimestampForAttest;
        let validatorsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_valset_by_timestamp/${valsetTsResolved}`
        );
        if (!validatorsResponse.ok && valsetTsResolved !== validatorSetTimestampData.timestamp) {
            valsetTsResolved = validatorSetTimestampData.timestamp;
            validatorsResponse = await fetch(
                `${baseEndpoint}/layer/bridge/get_valset_by_timestamp/${valsetTsResolved}`
            );
        }

        if (!validatorsResponse.ok) {
            const errorText = await validatorsResponse.text();
            console.error('Validator response error:', { 
                status: validatorsResponse.status, 
                text: errorText,
                valsetTimestamp: valsetTsResolved,
                reportTimestamp: rawAttestationData.timestamp,
                attestationTimestamp: rawAttestationData.attestation_timestamp
            });
            throw new Error(`Failed to fetch validator set: ${validatorsResponse.statusText}`);
        }

        const validatorsData = await validatorsResponse.json();

        // Get power threshold for the same timestamp as valset
        let checkpointParamsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_validator_checkpoint_params/${valsetTsResolved}`
        );
        if (!checkpointParamsResponse.ok && valsetTsResolved !== validatorSetTimestampData.timestamp) {
            valsetTsResolved = validatorSetTimestampData.timestamp;
            checkpointParamsResponse = await fetch(
                `${baseEndpoint}/layer/bridge/get_validator_checkpoint_params/${valsetTsResolved}`
            );
        }

        if (!checkpointParamsResponse.ok) {
            throw new Error(`Failed to fetch checkpoint params: ${checkpointParamsResponse.statusText}`);
        }

        const checkpointParams = await checkpointParamsResponse.json();
        const powerThreshold =
            checkpointParams.power_threshold ?? checkpointParams.powerThreshold ?? checkpointParams.threshold;

        // Get attestations
        const attestationsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_attestations_by_snapshot/${lastSnapshot}`
        );

        if (!attestationsResponse.ok) {
            throw new Error(`Failed to fetch attestations: ${attestationsResponse.statusText}`);
        }

        const attestationsResult = await attestationsResponse.json();

        // Process attestations
        const validatorSet = validatorsData.bridge_validator_set;

        const checkpointSource =
            rawAttestationData.checkpoint && String(rawAttestationData.checkpoint).length > 0
                ? rawAttestationData.checkpoint
                : lastSnapshot;
        if (!checkpointSource) {
            throw new Error('Missing checkpoint for attestation signatures');
        }
        const checkpointHex = checkpointSource.startsWith('0x') ? checkpointSource : '0x' + checkpointSource;
        const attestList = App.coerceBridgeAttestationArray(attestationsResult);
        const signatures = this.buildWithdrawalSignaturesForValset(
            attestList,
            validatorSet,
            checkpointHex,
            lastSnapshot
        );

        // Format the attestation data according to the contract's expected structure
        const formattedAttestationData = {
            queryId: ethers.utils.arrayify(this.ensureHexPrefix(rawAttestationData.query_id)),
            report: {
                value: ethers.utils.arrayify(this.ensureHexPrefix(rawAttestationData.aggregate_value)),
                timestamp: this.attestApiUintString(rawAttestationData.timestamp, 'report.timestamp'),
                aggregatePower: this.attestApiUintString(rawAttestationData.aggregate_power, 'report.aggregatePower'),
                previousTimestamp: this.attestApiUintString(
                    rawAttestationData.previous_report_timestamp,
                    'report.previousTimestamp',
                    { allowMissing: true }
                ),
                nextTimestamp: this.attestApiUintString(
                    rawAttestationData.next_report_timestamp,
                    'report.nextTimestamp',
                    { allowMissing: true }
                ),
                lastConsensusTimestamp: this.attestApiUintString(
                    rawAttestationData.last_consensus_timestamp,
                    'report.lastConsensusTimestamp',
                    { allowMissing: true }
                )
            },
            attestationTimestamp: this.attestApiUintString(
                rawAttestationData.attestation_timestamp,
                'attestationTimestamp'
            )
        };

        // Format the validator set according to the contract's expected structure
        const formattedValidatorSet = validatorSet.map((validator) => {
            const addr = App.bridgeValidatorEthAddress(validator);
            if (!addr) {
                throw new Error('Bridge API valset entry missing Ethereum address (ethereumAddress / eth_address)');
            }
            return {
                addr,
                power: this.attestApiUintString(validator.power, 'validator.power')
            };
        });

        return {
            attestationData: formattedAttestationData,
            validatorSet: formattedValidatorSet,
            signatures: signatures,
            powerThreshold: powerThreshold,
            checkpoint: rawAttestationData.checkpoint,
            rawAttestationData: rawAttestationData  // Include raw data for debugging
        };
    } catch (error) {
        // console.error(...);
        throw error;
    }
  },

  showErrorPopup: function(message) {
    const cleaned = String(message || '')
      .replace(/\s*0x[0-9a-f]{100,}\s*/gi, ' ')
      .trim();
    const popup = document.createElement('div');
    popup.id = 'errorPopup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '20px';
    popup.style.backgroundColor = '#FEE2E2';
    popup.style.color = '#991B1B';
    popup.style.borderRadius = '10px';
    popup.style.zIndex = '1000';
    popup.style.border = '2px solid #DC2626';
    popup.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    popup.style.fontSize = '15px';
    popup.style.width = 'auto';
    popup.style.minWidth = '280px';
    popup.style.maxWidth = 'min(440px, 92vw)';
    popup.style.boxSizing = 'border-box';
    popup.style.textAlign = 'center';
    popup.style.lineHeight = '1.45';
    popup.style.wordBreak = 'break-word';
    popup.style.overflowWrap = 'anywhere';
    popup.style.whiteSpace = 'normal';

    // Use innerHTML to allow for the Etherscan link
    popup.innerHTML = cleaned;
  
    document.body.appendChild(popup);
  
    // Remove the popup after 5 seconds
    setTimeout(() => {
      const popup = document.getElementById('errorPopup');
      if (popup) {
        popup.remove();
      }
    }, 5000);
  },

  // Add helper function before formatWithdrawalData
  ensureHexPrefix: function(value) {
    if (!value) return value;
    return value.startsWith('0x') ? value : '0x' + value;
  },

  /** Decimal string for uint256 ABI fields from bridge API (avoids JS precision loss on large powers). */
  attestApiUintString: function (raw, fieldName, { allowMissing = false } = {}) {
    if (raw === undefined || raw === null || raw === '') {
      if (allowMissing) {
        return '0';
      }
      throw new Error(`Bridge attestation API: missing ${fieldName}`);
    }
    const s = String(raw).trim();
    if (!/^\d+$/.test(s)) {
      throw new Error(`Bridge attestation API: invalid non-integer ${fieldName}: ${raw}`);
    }
    return s;
  },

  /** Bridge API may use ethereumAddress, eth_address, etc. */
  bridgeValidatorEthAddress: function (v) {
    const primary =
      v.ethereumAddress ||
      v.ethereum_address ||
      v.eth_address ||
      v.ethAddress ||
      v.evm_address ||
      v.evmAddress ||
      v.operator_eth_address ||
      v.validator_ethereum_address;
    const raw = primary || v.address;
    if (!raw || typeof raw !== 'string') {
      return null;
    }
    let t = raw.trim();
    if (/^[0-9a-fA-F]{40}$/.test(t)) {
      t = '0x' + t;
    }
    if (!t.startsWith('0x')) {
      return null;
    }
    return ethers.utils.getAddress(t);
  },

  /** Normalize get_attestations_by_snapshot JSON to an array of raw signature blobs. */
  coerceBridgeAttestationArray: function (json) {
    if (!json) {
      return [];
    }
    const arr =
      json.attestations ||
      json.Attestations ||
      json.attestation_signatures ||
      json.attestationSignatures ||
      json.signatures ||
      json.sigs ||
      (Array.isArray(json) ? json : null);
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr
      .map((x) => {
        if (x == null) {
          return null;
        }
        if (typeof x === 'string') {
          return x;
        }
        if (typeof x === 'object') {
          if (typeof x.signature === 'string') {
            return x.signature;
          }
          if (typeof x.sig === 'string') {
            return x.sig;
          }
          if (typeof x.data === 'string') {
            return x.data;
          }
          if (typeof x.hex === 'string') {
            return x.hex;
          }
          if (typeof x.attestation === 'string') {
            return x.attestation;
          }
          if (x.r != null && x.s != null) {
            return x;
          }
        }
        return x;
      })
      .filter((x) => x != null);
  },

  /** Normalize one attestation entry to 64-char r/s hex (no 0x) + optional v hint. */
  normalizeAttestationEntry: function (att) {
    if (att == null) {
      return null;
    }
    const pad32 = (hexNo0x) => {
      let h = String(hexNo0x).replace(/^0x/i, '');
      if (!/^[0-9a-fA-F]*$/.test(h)) {
        return null;
      }
      while (h.length < 64) {
        h = '0' + h;
      }
      return h.slice(-64);
    };
    if (typeof att === 'object' && att.r != null && att.s != null) {
      const r = pad32(att.r);
      const s = pad32(att.s);
      if (!r || !s) {
        return null;
      }
      let vPreferred = null;
      if (att.v !== undefined && att.v !== null) {
        const vn = Number(att.v);
        if (vn === 27 || vn === 28) {
          vPreferred = vn;
        } else if (vn === 0 || vn === 1) {
          vPreferred = vn + 27;
        }
      }
      return { r, s, vPreferred };
    }
    let h = String(att).trim().replace(/^0x/i, '');
    if (h.length === 130) {
      const r = h.slice(0, 64);
      const s = h.slice(64, 128);
      const vb = parseInt(h.slice(128, 130), 16);
      let vPreferred = null;
      if (vb === 27 || vb === 28) {
        vPreferred = vb;
      } else if (vb === 0 || vb === 1) {
        vPreferred = vb + 27;
      }
      return { r, s, vPreferred };
    }
    if (h.length === 128) {
      return { r: h.slice(0, 64), s: h.slice(64, 128), vPreferred: null };
    }
    return null;
  },

  /** Digests validators may have signed for the checkpoint (try best match). */
  checkpointMessageDigests: function (checkpointHex, lastSnapshotRaw) {
    const pairs = [];
    const push = (label, digest) => {
      if (digest && typeof digest === 'string' && digest.startsWith('0x')) {
        pairs.push({ label, digest });
      }
    };
    const cpStr = String(checkpointHex || '').trim();
    const cpNorm = cpStr.startsWith('0x') ? cpStr : '0x' + cpStr;
    let cpBytes;
    try {
      cpBytes = ethers.utils.arrayify(cpNorm);
    } catch (_) {
      cpBytes = ethers.utils.toUtf8Bytes(cpStr);
    }
    const sha256Cp = ethers.utils.sha256(cpBytes);
    push('sha256(checkpoint)', sha256Cp);
    push('keccak256(checkpoint)', ethers.utils.keccak256(cpBytes));
    push('hashMessage(bytes(sha256(checkpoint)))', ethers.utils.hashMessage(ethers.utils.arrayify(sha256Cp)));
    push('hashMessage(checkpoint_bytes)', ethers.utils.hashMessage(cpBytes));
    push('sha256(utf8(checkpoint_ascii))', ethers.utils.sha256(ethers.utils.toUtf8Bytes(cpStr)));
    push('keccak256(utf8(checkpoint_ascii))', ethers.utils.keccak256(ethers.utils.toUtf8Bytes(cpStr)));
    push('hashMessage(utf8(checkpoint_ascii))', ethers.utils.hashMessage(cpStr));
    try {
      push('solidityKeccak256(bytes)', ethers.utils.solidityKeccak256(['bytes'], [cpBytes]));
      if (cpBytes.length === 32) {
        const b32 = ethers.utils.hexZeroPad(cpNorm, 32);
        push('solidityKeccak256(bytes32)', ethers.utils.solidityKeccak256(['bytes32'], [b32]));
      }
    } catch (_) {
      /* ignore packing errors */
    }
    if (lastSnapshotRaw != null && String(lastSnapshotRaw).trim() !== '') {
      const ls = String(lastSnapshotRaw).trim();
      const cpBody = cpStr.replace(/^0x/i, '');
      if (ls.replace(/^0x/i, '') !== cpBody) {
        push('sha256(utf8(lastSnapshot))', ethers.utils.sha256(ethers.utils.toUtf8Bytes(ls)));
        push('keccak256(utf8(lastSnapshot))', ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ls)));
        push('hashMessage(utf8(lastSnapshot))', ethers.utils.hashMessage(ls));
        const lsHex = ls.startsWith('0x') ? ls : '0x' + ls;
        try {
          const lsb = ethers.utils.arrayify(lsHex);
          push('sha256(lastSnapshot_bytes)', ethers.utils.sha256(lsb));
          push('keccak256(lastSnapshot_bytes)', ethers.utils.keccak256(lsb));
          push('hashMessage(lastSnapshot_bytes)', ethers.utils.hashMessage(lsb));
        } catch (_) {
          /* ignore */
        }
      }
    }
    const seen = new Set();
    return pairs.filter(({ digest }) => {
      if (seen.has(digest)) {
        return false;
      }
      seen.add(digest);
      return true;
    });
  },

  _recoverAttestationsToValset: function (messageDigest, normalizedEntries, validatorMap) {
    const signatureMap = new Map();
    const recoverOne = (r, s, v) => {
      try {
        return ethers.utils
          .recoverAddress(messageDigest, { r: '0x' + r, s: '0x' + s, v })
          .toLowerCase();
      } catch (_) {
        return null;
      }
    };
    for (const { r, s, vPreferred } of normalizedEntries) {
      const order =
        vPreferred === 27 || vPreferred === 28
          ? [vPreferred, vPreferred === 27 ? 28 : 27]
          : [27, 28];
      const rsOrder = [{ r, s }, { r: s, s: r }];
      let placed = false;
      for (const { r: rr, s: ss } of rsOrder) {
        if (placed) {
          break;
        }
        const tried = new Set();
        for (const v of order) {
          if (tried.has(v)) {
            continue;
          }
          tried.add(v);
          const recoveredAddress = recoverOne(rr, ss, v);
          if (!recoveredAddress) {
            continue;
          }
          const validatorIndex = validatorMap.get(recoveredAddress);
          if (validatorIndex !== undefined) {
            signatureMap.set(validatorIndex, {
              v,
              r: '0x' + rr,
              s: '0x' + ss
            });
            placed = true;
            break;
          }
        }
      }
    }
    return signatureMap;
  },

  /**
   * Map snapshot attestations to validator-ordered signatures (contract expects sigs[i] = validator i).
   * Never assume attestations[] index aligns with validator order — recover signer and place by valset index.
   */
  buildWithdrawalSignaturesForValset: function (attestations, validatorSet, checkpointHex, lastSnapshotRaw) {
    const zeroSig = {
      v: 0,
      r: '0x0000000000000000000000000000000000000000000000000000000000000000',
      s: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    const validatorMap = new Map();
    validatorSet.forEach((validator, index) => {
      try {
        const addr = App.bridgeValidatorEthAddress(validator);
        if (addr) {
          validatorMap.set(addr.toLowerCase(), index);
        }
      } catch (_) {
        /* skip malformed valset row */
      }
    });
    const list = Array.isArray(attestations) ? attestations : [];
    const normalizedList = [];
    for (const raw of list) {
      const n = App.normalizeAttestationEntry(raw);
      if (n) {
        normalizedList.push(n);
      }
    }
    const digests = App.checkpointMessageDigests(checkpointHex, lastSnapshotRaw);
    let bestMap = new Map();
    let bestScore = -1;
    let bestLabel = '';
    for (const { label, digest } of digests) {
      const signatureMap = App._recoverAttestationsToValset(digest, normalizedList, validatorMap);
      const score = signatureMap.size;
      if (score > bestScore) {
        bestScore = score;
        bestMap = signatureMap;
        bestLabel = label;
      }
    }
    if (bestScore <= 0 && normalizedList.length > 0) {
      console.warn(
        '[buildWithdrawalSignaturesForValset] No signatures recovered; tried digests:',
        digests.map((d) => d.label),
        'normalizedAttestations:',
        normalizedList.length,
        'validators:',
        validatorSet.length,
        'valsetEthAddressesSample:',
        validatorSet.slice(0, 3).map((v) => {
          try {
            return App.bridgeValidatorEthAddress(v);
          } catch (e) {
            return String(e && e.message);
          }
        })
      );
    } else if (bestScore > 0) {
      console.info('[buildWithdrawalSignaturesForValset] Matched', bestScore, 'signatures using digest:', bestLabel);
    }
    return Array.from({ length: validatorSet.length }, (_, idx) => bestMap.get(idx) || zeroSig);
  },

  formatWithdrawalData: function(withdrawalId, withdrawalData, attestationData) {
        if (!attestationData) {
            throw new Error('Missing attestation data');
        }

        // The attestation data is already formatted in fetchAttestationData
        const { attestationData: formattedAttestationData, validatorSet, signatures } = attestationData;

        if (!formattedAttestationData || !validatorSet || !signatures) {
            throw new Error('Invalid attestation data structure');
        }

        return {
            attestData: formattedAttestationData,
            valset: validatorSet,
            sigs: signatures,
            depositId: withdrawalId
        };
    },

  initBridgeDirectionUI: function() {
    const bridgeToggle = document.getElementById('bridgeDirectionToggle');
    const bridgeSection = document.getElementById('bridgeSection');
    const bridgeToTellorContent = document.getElementById('bridgeToTellorContent');
    const bridgeToEthereumContent = document.getElementById('bridgeToEthereumContent');
    const delegateBtn = document.getElementById('delegateBtn');
    const delegateSection = document.getElementById('delegateSection');
    const transactionsContainer = document.getElementById('bridgeTransactionsContainer');

    if (!bridgeToggle || !bridgeSection || !bridgeToTellorContent || !bridgeToEthereumContent || !delegateBtn || !delegateSection) {
      // console.error(...);
      return;
    }

    // Set initial state - Bridge to Tellor is default
    this.currentBridgeDirection = 'layer';
    bridgeToTellorContent.style.display = 'block';
    bridgeToEthereumContent.style.display = 'none';
    bridgeToggle.checked = false;
    delegateSection.classList.remove('active');

    // Initially hide transactions container
    if (transactionsContainer) {
        transactionsContainer.classList.remove('active');
    }
    
    // Initially show frontend code link (since we start with layer direction)
    const frontendCodeLink = document.querySelector('.frontend-code-link');
    if (frontendCodeLink) {
        frontendCodeLink.style.display = 'block';
    }

    // Add toggle event listener
    bridgeToggle.addEventListener('change', () => {
      if (bridgeToggle.checked) {
        this.switchBridgeDirection('ethereum');
      } else {
        this.switchBridgeDirection('layer');
      }
    });

    delegateBtn.addEventListener('click', () => {
        if (this.currentBridgeDirection !== 'delegate') {
            this.switchBridgeDirection('delegate');
        }
    });

  },

  initWalletManagerDropdown: function() {
    const walletManagerToggle = document.getElementById('walletManagerToggle');
    const walletManagerDropdown = document.querySelector('.wallet-manager-dropdown');
    const walletManagerClose = document.getElementById('walletManagerClose');
    
    if (walletManagerToggle && walletManagerDropdown) {
      // Remove any existing event listeners by cloning the button
      const newToggle = walletManagerToggle.cloneNode(true);
      walletManagerToggle.parentNode.replaceChild(newToggle, walletManagerToggle);
      
      newToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        walletManagerDropdown.classList.toggle('open');
      });
      
      // Close dropdown when clicking close button
      if (walletManagerClose) {
        const newClose = walletManagerClose.cloneNode(true);
        walletManagerClose.parentNode.replaceChild(newClose, walletManagerClose);
        
        newClose.addEventListener('click', (e) => {
          e.stopPropagation();
          walletManagerDropdown.classList.remove('open');
        });
      }
      
      // Close dropdown when clicking outside (but not on wallet-related elements)
      document.addEventListener('click', (e) => {
        // Don't close if clicking on any wallet-related elements inside the dropdown
        if (walletManagerDropdown.contains(e.target) || 
            e.target.closest('.wallet-section') ||
            e.target.closest('.wallet-group') ||
            e.target.closest('.network-group') ||
            e.target.closest('.button-style-1') ||
            e.target.closest('.button-style-2') ||
            e.target.closest('.toggle-button')) {
          return;
        }
        
        // Only close if clicking truly outside the dropdown
        if (!walletManagerDropdown.contains(e.target)) {
          walletManagerDropdown.classList.remove('open');
        }
      });
      
      // Close dropdown on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          walletManagerDropdown.classList.remove('open');
        }
      });
      
      // Initial update of toggle text
      this.updateWalletManagerToggleText();
    } else {
      // Try again after a short delay
      setTimeout(() => {
        this.initWalletManagerDropdown();
      }, 1000);
    }
  },

  updateWalletManagerToggleText: function() {
    const walletManagerText = document.querySelector('.wallet-manager-text');
    if (!walletManagerText) return;
    
    const isEthereumConnected = App.isConnected && App.account !== '0x0';
    const isCosmosConnected = App.isKeplrConnected && App.keplrAddress;

    const ethIsMainnet = App.chainId === 1;
    const cosmosIsMainnet = App.cosmosChainId === 'tellor-1';
    const dot = (isMainnet) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isMainnet ? '#10b981' : '#f59e0b'};margin-right:4px;vertical-align:middle;"></span>`;

    if (isEthereumConnected && isCosmosConnected) {
      const ethAddr = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
      const cosmosAddr = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
      walletManagerText.innerHTML = `${dot(ethIsMainnet)}Eth: ${ethAddr} | ${dot(cosmosIsMainnet)}Cosmos: ${cosmosAddr}`;
    } else if (isEthereumConnected) {
      const ethAddr = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
      walletManagerText.innerHTML = `${dot(ethIsMainnet)}Eth: ${ethAddr} | Cosmos: --`;
    } else if (isCosmosConnected) {
      const cosmosAddr = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
      walletManagerText.innerHTML = `Eth: -- | ${dot(cosmosIsMainnet)}Cosmos: ${cosmosAddr}`;
    } else {
      walletManagerText.textContent = 'Connect Wallets';
    }
  },

  /**
   * Maps hub / side-nav `data-function` values to a direction accepted by switchBridgeDirection.
   * Raw 'bridge' is invalid there (early return) — callers must use this so layer vs ethereum sub-tabs restore.
   */
  resolveBridgeNavDirection: function(functionType) {
    if (functionType === 'bridge') {
      const last = this.currentBridgeDirection;
      return (last === 'layer' || last === 'ethereum') ? last : 'layer';
    }
    return functionType;
  },

  switchBridgeDirection: function(direction) {
    if (direction !== 'layer' && direction !== 'ethereum' && direction !== 'delegate') {
        // console.error(...);
        return;
    }

    const bridgeToggle = document.getElementById('bridgeDirectionToggle');
    const bridgeSection = document.getElementById('bridgeSection');
    const bridgeToTellorContent = document.getElementById('bridgeToTellorContent');
    const bridgeToEthereumContent = document.getElementById('bridgeToEthereumContent');
    const delegateBtn = document.getElementById('delegateBtn');
    const delegateSection = document.getElementById('delegateSection');
    const transactionsContainer = document.getElementById('bridgeTransactionsContainer');
    const boxWrapper = document.querySelector('.box-wrapper');

    if (!bridgeSection || !bridgeToTellorContent || !bridgeToEthereumContent || !delegateSection) {
        // console.error(...);
        return;
    }

    // Update bridge toggle state
    if (bridgeToggle) {
        bridgeToggle.checked = direction === 'ethereum';
    }

    // Update bridge content visibility
    if (direction === 'layer' || direction === 'ethereum') {
        bridgeToTellorContent.style.display = direction === 'layer' ? 'block' : 'none';
        bridgeToEthereumContent.style.display = direction === 'ethereum' ? 'block' : 'none';
        bridgeSection.classList.add('active');
        delegateSection.classList.remove('active');
    } else {
        bridgeToTellorContent.style.display = 'none';
        bridgeToEthereumContent.style.display = 'none';
        bridgeSection.classList.remove('active');
        delegateSection.classList.toggle('active', direction === 'delegate');
    }
    
    // Update box wrapper classes for animation
    if (boxWrapper) {
        boxWrapper.classList.remove('layer-direction', 'ethereum-direction', 'delegate-direction');
        if (direction === 'layer') {
            boxWrapper.classList.add('layer-direction');
        } else if (direction === 'ethereum') {
            boxWrapper.classList.add('ethereum-direction');
        } else if (direction === 'delegate') {
            boxWrapper.classList.add('delegate-direction');
        }
    }
    
    // Show/hide transactions container based on direction only
    if (transactionsContainer) {
        transactionsContainer.classList.toggle('active', direction === 'ethereum');
    }
    
    // Hide frontend code link when ethereum direction is selected
    const frontendCodeLink = document.querySelector('.frontend-code-link');
    if (frontendCodeLink) {
        frontendCodeLink.style.display = direction === 'ethereum' ? 'none' : 'block';
    }

    // Store the new direction
    this.currentBridgeDirection = direction;

    // Update UI for the new direction
    this.updateUIForCurrentDirection();

    // Load withdrawal history only when entering Bridge to Ethereum view.
    if (direction === 'ethereum') {
        App.updateWithdrawalHistory().catch(() => {});
    }
    
    // Update network compatibility warning
    this.updateNetworkCompatibilityWarning();
    
    // Update balances when switching directions
    if (App.isConnected) {
        App.updateBalance().catch(error => {
            // console.error(...);
        });
    }
    if (App.isKeplrConnected) {
        App.updateKeplrBalance().catch(error => {
            // console.error(...);
        });
    }
    
    // Populate validator dropdown when switching to delegate section
    if (direction === 'delegate') {
        this.populateValidatorDropdown();
        this.populateReporterDropdown();
        this.refreshCurrentStatus();
    }
  },

  updateUIForCurrentDirection: function() {
    if (this.currentBridgeDirection === 'layer') {
        // Update Layer section UI
        const approveButton = document.getElementById('approveButton');
        const depositButton = document.getElementById('depositButton');
        
        if (App.contracts.Bridge && App.contracts.Token) {
            if (approveButton) approveButton.disabled = false;
            if (depositButton) depositButton.disabled = false;
        }
    } else if (this.currentBridgeDirection === 'ethereum') {
        // Update Ethereum section UI
        const withdrawButton = document.getElementById('withdrawButton');
        
        // Enable withdrawal button if Keplr is connected, regardless of network
        if (App.isKeplrConnected) {
            if (withdrawButton) {
                withdrawButton.disabled = false;
                
                // Check network compatibility and update button title
                if (App.isConnected) {
                    const isEthereumMainnet = App.chainId === 1;
                    const isCosmosMainnet = App.cosmosChainId === 'tellor-1';
                    
                    if (isEthereumMainnet === isCosmosMainnet) {
                        withdrawButton.title = 'Request withdrawal from Layer to Ethereum';
                    } else {
                        withdrawButton.title = 'Network mismatch detected. Both wallets must be on the same network type.';
                    }
                } else {
                    withdrawButton.title = 'Connect your Ethereum wallet to withdraw';
                }
            }
        } else {
            // If not connected, show a helpful message but keep button enabled for UX
            if (withdrawButton) {
                withdrawButton.disabled = false;
                withdrawButton.title = 'Connect your Cosmos wallet to withdraw';
            }
        }
        
        // Always keep withdrawal button enabled and provide helpful prompts
        if (withdrawButton) {
            withdrawButton.disabled = false;
            
            // Check if inputs are filled and provide appropriate title
            const ethStakeAmountInput = document.getElementById('ethStakeAmount');
            const ethQueryIdInput = document.getElementById('ethQueryId');
            
            if (ethStakeAmountInput && ethQueryIdInput) {
                const amount = parseFloat(ethStakeAmountInput.value) || 0;
                const address = ethQueryIdInput.value.trim();
                
                if (amount <= 0 && !address) {
                    withdrawButton.title = 'Please enter amount and Ethereum address';
                } else if (amount <= 0) {
                    withdrawButton.title = 'Please enter a valid amount to withdraw';
                } else if (!address) {
                    withdrawButton.title = 'Please enter Ethereum address to receive withdrawal';
                } else {
                    withdrawButton.title = 'Request withdrawal from Layer to Ethereum';
                }
            }
        }
    } else if (this.currentBridgeDirection === 'delegate') {
        // Update Delegate section UI
        const delegateButton = document.getElementById('delegateButton');
        
        if (App.isKeplrConnected) {
            if (delegateButton) delegateButton.disabled = false;
        }
    }

    // Only show transactions table in ethereum direction
    const transactionsContainer = document.getElementById('bridgeTransactionsContainer');
    if (transactionsContainer) {
        transactionsContainer.classList.toggle('active', this.currentBridgeDirection === 'ethereum');
    }
  },

  // Add function to update network compatibility warning
  updateNetworkCompatibilityWarning: function() {
    const warningElement = document.getElementById('networkCompatibilityWarning');
    
    if (warningElement) {
      if (App.isConnected && App.isKeplrConnected) {
        const isEthereumMainnet = App.chainId === 1;
        const isCosmosMainnet = App.cosmosChainId === 'tellor-1';
        
        if (isEthereumMainnet !== isCosmosMainnet) {
          const ethereumNetwork = isEthereumMainnet ? 'Ethereum Mainnet' : 'Sepolia Testnet';
          const cosmosNetwork = isCosmosMainnet ? 'Tellor Mainnet' : 'Tellor Testnet';
          
          warningElement.innerHTML = `
            <strong>⚠️ Network Mismatch Detected</strong><br>
            Your wallets are on different networks:<br>
            • Ethereum: ${ethereumNetwork}<br>
            • Cosmos: ${cosmosNetwork}<br><br>
            <strong>Withdrawals will fail with mismatched networks.</strong><br>
            Please switch one wallet to match the other network.
          `;
          warningElement.style.display = 'block';
        } else {
          warningElement.style.display = 'none';
        }
      } else {
        warningElement.style.display = 'none';
      }
    }
  },

  /**
   * When both Ethereum and Cosmos wallets are connected, bridge flows require the same tier
   * (Ethereum Mainnet ↔ tellor-1, Sepolia ↔ Tellor testnet). Returns null if OK or if either
   * wallet is disconnected (no cross-check possible).
   */
  getEthCosmosBridgeNetworkMismatchMessage: function() {
    if (!App.isConnected || !App.isKeplrConnected) {
      return null;
    }
    const isEthereumMainnet = App.chainId === 1;
    const isCosmosMainnet = App.cosmosChainId === 'tellor-1';
    if (isEthereumMainnet === isCosmosMainnet) {
      return null;
    }
    const ethereumNetwork = isEthereumMainnet ? 'Ethereum Mainnet' : 'Sepolia Testnet';
    const cosmosNetwork = isCosmosMainnet ? 'Tellor Mainnet' : 'Tellor Testnet';
    return (
      `Network mismatch detected!\n\n` +
      `Ethereum Wallet: ${ethereumNetwork}\n` +
      `Cosmos Wallet: ${cosmosNetwork}\n\n` +
      `Both wallets must be on the same network type (both mainnet or both testnet).\n\n` +
      `Please switch one of your wallets to match the other network.`
    );
  },

  // Add debug function to check network status
  debugNetworkStatus: function() {
    const status = {
      cosmosChainId: App.cosmosChainId,
      isKeplrConnected: App.isKeplrConnected,
      currentBridgeDirection: App.currentBridgeDirection,
      keplrAddress: App.keplrAddress,
      connectedWallet: App.connectedWallet,
      ethereumChainId: App.chainId,
      isEthereumConnected: App.isConnected,
      ethereumAccount: App.account
    };
    
    // Check network compatibility
    if (App.isConnected && App.isKeplrConnected) {
      const isEthereumMainnet = App.chainId === 1;
      const isCosmosMainnet = App.cosmosChainId === 'tellor-1';
      status.networkCompatible = isEthereumMainnet === isCosmosMainnet;
      status.ethereumNetwork = isEthereumMainnet ? 'Mainnet' : 'Testnet';
      status.cosmosNetwork = isCosmosMainnet ? 'Mainnet' : 'Testnet';
    }
    
    App.debugLog('Network Status:', status);
    
    // Check button states
    const withdrawButton = document.getElementById('withdrawButton');
    if (withdrawButton) {
      App.debugLog('Withdrawal Button State:', {
        disabled: withdrawButton.disabled,
        text: withdrawButton.textContent,
        title: withdrawButton.title
      });
    }
    
    // Show network compatibility status
    if (App.isConnected && App.isKeplrConnected) {
      const isEthereumMainnet = App.chainId === 1;
      const isCosmosMainnet = App.cosmosChainId === 'tellor-1';
      
      if (isEthereumMainnet === isCosmosMainnet) {
        App.debugLog('✅ Networks are compatible - withdrawals should work');
      } else {
        App.debugLog('❌ Networks are incompatible - withdrawals will fail');
        App.debugLog('Ethereum:', isEthereumMainnet ? 'Mainnet' : 'Testnet');
        App.debugLog('Cosmos:', isCosmosMainnet ? 'Mainnet' : 'Testnet');
      }
    }
    
    return status;
  },

  // Add new function to fetch validators from Layer network
  fetchValidators: async function() {
    try {
              const response = await fetch(`${App.getCosmosApiEndpoint()}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch validators: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.validators || !Array.isArray(data.validators)) {
        throw new Error('Invalid validators response format');
      }
      
      // Sort validators by voting power (descending)
      const sortedValidators = data.validators.sort((a, b) => {
        const powerA = parseInt(a.tokens || '0');
        const powerB = parseInt(b.tokens || '0');
        return powerB - powerA;
      });
      
      return sortedValidators.map(validator => ({
        address: validator.operator_address,
        moniker: validator.description?.moniker || 'Unknown Validator',
        votingPower: validator.tokens || '0',
        commission: validator.commission?.commission_rates?.rate || '0',
        jailed: validator.jailed || false
      }));
    } catch (error) {
      console.error('Error fetching validators:', error);
      throw error;
    }
  },

  // Add function to fetch reporters from Layer network
  fetchReporters: async function() {
    try {
      const response = await fetch(`${App.getCosmosApiEndpoint()}/tellor-io/layer/reporter/reporters`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reporters: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.reporters || !Array.isArray(data.reporters)) {
        throw new Error('Invalid reporters response format');
      }
      
      // Sort reporters by power (descending), similar to validator dropdown
      const sortedReporters = data.reporters.sort((a, b) => {
        const powerA = parseInt(a.power || '0');
        const powerB = parseInt(b.power || '0');
        return powerB - powerA;
      });
      
      return sortedReporters.map(reporter => ({
        address: reporter.address,
        name: reporter.metadata?.moniker || 'Unknown Reporter',
        description: `Power: ${reporter.power}, Commission: ${(parseFloat(reporter.metadata?.commission_rate || '0') * 100).toFixed(2)}%`,
        active: !reporter.metadata?.jailed || false
      }));
    } catch (error) {
      console.error('Error fetching reporters:', error);
      throw error;
    }
  },

  // Add function to fetch current reporter selection
  fetchCurrentReporter: async function(selectorAddress) {
    try {
      const endpoint = `${App.getCosmosApiEndpoint()}/tellor-io/layer/reporter/selector-reporter/${selectorAddress}`;
      App.debugLog('Fetching current reporter from:', endpoint);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 404) {
          App.debugLog('No reporter selected for address:', selectorAddress);
          return null; // No reporter selected
        }
        
        // Handle 500 errors that might indicate "not found" on mainnet
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('not found')) {
              App.debugLog('No reporter selected (500 error format):', selectorAddress);
              return null;
            }
          } catch (e) {
            // If we can't parse the error response, continue with the original error
          }
        }
        
        throw new Error(`Failed to fetch current reporter: ${response.status}`);
      }
      
      const data = await response.json();
      App.debugLog('Current reporter data:', data);
      
      // Handle mainnet-specific error format
      if (data.code && data.message && data.message.includes('not found')) {
        App.debugLog('No reporter selected (mainnet format):', selectorAddress);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching current reporter:', error);
      throw error;
    }
  },

  // Add function to fetch current delegations
  fetchCurrentDelegations: async function(delegatorAddress) {
    try {
      const endpoint = `${App.getCosmosApiEndpoint()}/cosmos/staking/v1beta1/delegations/${delegatorAddress}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch delegations: ${response.status}`);
      }
      
      const data = await response.json();
      App.debugLog('Delegations data:', data);
      
      if (!data.delegation_responses || !Array.isArray(data.delegation_responses)) {
        return [];
      }
      
      return data.delegation_responses.map(delegation => ({
        validatorAddress: delegation.delegation.validator_address,
        amount: delegation.balance.amount,
        denom: delegation.balance.denom
      }));
    } catch (error) {
      console.error('Error fetching delegations:', error);
      throw error;
    }
  },

  extractLoyaAmountFromCoins: function(coins) {
    if (!Array.isArray(coins)) {
      return 0;
    }
    const loyaCoin = coins.find((coin) => coin && coin.denom === 'loya');
    if (!loyaCoin || loyaCoin.amount == null) {
      return 0;
    }
    const parsed = parseFloat(String(loyaCoin.amount));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  },

  formatLoyaToTrb: function(loyaAmount) {
    const parsed = Number(loyaAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return '0.000000';
    }
    return (parsed / 1000000).toFixed(6);
  },

  fetchDelegatorRewards: async function(delegatorAddress) {
    const endpoint = `${App.getCosmosApiEndpoint()}/cosmos/distribution/v1beta1/delegators/${encodeURIComponent(delegatorAddress)}/rewards`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      if (response.status === 404) {
        return { rewards: [], totalLoya: 0 };
      }
      throw new Error(`Failed to fetch delegator rewards: ${response.status}`);
    }
    const data = await response.json();
    const rewards = Array.isArray(data.rewards) ? data.rewards.map((entry) => {
      const validatorAddress = entry.validator_address || entry.validatorAddress || '';
      const loyaAmount = App.extractLoyaAmountFromCoins(entry.reward);
      return {
        validatorAddress,
        loyaAmount
      };
    }).filter((entry) => entry.validatorAddress) : [];
    return {
      rewards,
      totalLoya: App.extractLoyaAmountFromCoins(data.total)
    };
  },

  extractSelectorTipsLoya: function(payload) {
    if (payload == null) {
      return 0;
    }
    if (typeof payload === 'string' || typeof payload === 'number') {
      const parsed = parseFloat(String(payload));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    if (Array.isArray(payload)) {
      return App.extractLoyaAmountFromCoins(payload);
    }
    if (typeof payload === 'object') {
      if (Array.isArray(payload.coins)) {
        return App.extractLoyaAmountFromCoins(payload.coins);
      }
      if (Array.isArray(payload.amount)) {
        return App.extractLoyaAmountFromCoins(payload.amount);
      }
      const candidates = [
        payload.available_tips,
        payload.availableTips,
        payload.tip_amount,
        payload.tipAmount,
        payload.amount
      ];
      for (const candidate of candidates) {
        const parsed = App.extractSelectorTipsLoya(candidate);
        if (parsed > 0) {
          return parsed;
        }
      }
    }
    return 0;
  },

  fetchSelectorAvailableTips: async function(selectorAddress) {
    const endpoint = `${App.getCosmosApiEndpoint()}/tellor-io/layer/reporter/available-tips/${encodeURIComponent(selectorAddress)}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      if (response.status === 404 || response.status === 500) {
        return 0;
      }
      throw new Error(`Failed to fetch selector tips: ${response.status}`);
    }
    const data = await response.json();
    return App.extractSelectorTipsLoya(data);
  },

  getClaimableDelegatorRewardRows: function() {
    return Array.isArray(App.delegatorRewardRows)
      ? App.delegatorRewardRows.filter((row) => row.loyaAmount > 0)
      : [];
  },

  updateDelegatorRewardActionButtons: function() {
    const hasRewards = App.getClaimableDelegatorRewardRows().length > 0;
    const claimButton = document.getElementById('claimDelegatorRewardsButton');
    if (claimButton) {
      claimButton.disabled = !hasRewards || !App.isKeplrConnected;
    }
  },

  updateSelectorTipActionButton: function() {
    const claimButton = document.getElementById('claimSelectorTipsButton');
    const available = Number(App.selectorAvailableTipsRaw) || 0;
    if (claimButton) {
      claimButton.disabled = !App.isKeplrConnected || available <= 0;
    }
  },

  buildRewardClaimModal: function({ title, confirmLabel, bodyBuilder, onConfirm }) {
    if (typeof App._closeActiveRewardClaimModal === 'function') {
      App._closeActiveRewardClaimModal();
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';
    const modal = document.createElement('div');
    modal.style.cssText = 'width:100%;max-width:520px;background:#0f1f1f;border:1px solid #1f4f4f;border-radius:10px;padding:16px;color:#d9f6f6;box-shadow:0 10px 25px rgba(0,0,0,0.35);';
    const titleNode = document.createElement('h3');
    titleNode.textContent = title;
    titleNode.style.cssText = 'margin:0 0 12px 0;font-size:16px;font-weight:600;';
    const body = document.createElement('div');
    body.style.cssText = 'margin-bottom:14px;font-size:13px;';
    bodyBuilder(body);
    const errorNode = document.createElement('div');
    errorNode.style.cssText = 'display:none;margin-bottom:10px;color:#ffb4b4;font-size:12px;';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn-small';
    cancelButton.textContent = 'Cancel';
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'btn-small';
    confirmButton.textContent = confirmLabel;
    actions.appendChild(cancelButton);
    actions.appendChild(confirmButton);
    modal.appendChild(titleNode);
    modal.appendChild(body);
    modal.appendChild(errorNode);
    modal.appendChild(actions);

    const infoTooltip = document.createElement('div');
    infoTooltip.style.cssText = 'display:none;position:fixed;z-index:13000;max-width:260px;background:#f9f9f9;color:#1e2b2b;border:1px solid #d3e5e5;border-radius:6px;padding:8px 10px;font-size:12px;line-height:1.35;box-shadow:0 6px 16px rgba(0,0,0,0.2);pointer-events:none;';
    document.body.appendChild(infoTooltip);

    const positionInfoTooltip = (target) => {
      const rect = target.getBoundingClientRect();
      const tooltipRect = infoTooltip.getBoundingClientRect();
      let left = rect.left + rect.width + 10;
      let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = rect.left - tooltipRect.width - 10;
      }
      if (left < 8) left = 8;
      if (top + tooltipRect.height > window.innerHeight - 8) {
        top = window.innerHeight - tooltipRect.height - 8;
      }
      if (top < 8) top = 8;
      infoTooltip.style.left = `${left}px`;
      infoTooltip.style.top = `${top}px`;
    };

    const showInfoTooltip = (target) => {
      const msg = target.getAttribute('data-modal-tooltip');
      if (!msg) return;
      infoTooltip.textContent = msg;
      infoTooltip.style.display = 'block';
      positionInfoTooltip(target);
    };

    const hideInfoTooltip = () => {
      infoTooltip.style.display = 'none';
    };

    modal.querySelectorAll('[data-modal-tooltip]').forEach((icon) => {
      icon.addEventListener('mouseenter', () => showInfoTooltip(icon));
      icon.addEventListener('mouseleave', hideInfoTooltip);
      icon.addEventListener('focus', () => showInfoTooltip(icon));
      icon.addEventListener('blur', hideInfoTooltip);
    });
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      hideInfoTooltip();
      if (infoTooltip.parentNode) {
        infoTooltip.parentNode.removeChild(infoTooltip);
      }
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (App._closeActiveRewardClaimModal === close) {
        App._closeActiveRewardClaimModal = null;
      }
    };
    App._closeActiveRewardClaimModal = close;
    cancelButton.addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        close();
      }
    });
    confirmButton.addEventListener('click', async () => {
      try {
        errorNode.style.display = 'none';
        await onConfirm();
        close();
      } catch (error) {
        errorNode.textContent = error.message || 'Unable to continue.';
        errorNode.style.display = 'block';
      }
    });
  },

  openDelegatorRewardsClaimModal: function() {
    const rewardRows = App.getClaimableDelegatorRewardRows();
    if (!rewardRows.length) {
      App.showErrorPopup('No claimable delegator rewards available.');
      return;
    }
    App.buildRewardClaimModal({
      title: 'Claim Delegator Rewards',
      confirmLabel: 'Continue',
      bodyBuilder: (container) => {
        container.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:12px;color:#9ac3c3;display:flex;align-items:center;gap:6px;">
              <span>Delegator rewards become liquid in your wallet after claim.</span>
              <span data-modal-tooltip="Delegator reward claims withdraw staking rewards directly to your wallet as liquid tokens. No undelegation is required for this claim." style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1px solid #6fa3a3;color:#9fd6d6;font-size:11px;cursor:help;flex:0 0 auto;" tabindex="0" role="button" aria-label="Delegator reward claim info">ⓘ</span>
            </div>
            <label style="display:flex;gap:8px;align-items:center;"><input type="radio" name="delegator-claim-mode" value="all" checked> Claim all validators</label>
            <label style="display:flex;gap:8px;align-items:center;"><input type="radio" name="delegator-claim-mode" value="single"> Claim one validator</label>
            <select id="delegatorClaimModalValidator" class="input-address" style="display:none;">
              <option value="">Select validator reward...</option>
            </select>
          </div>
        `;
        const select = container.querySelector('#delegatorClaimModalValidator');
        const validatorMonikerByAddress = new Map(
          (Array.isArray(App.rewardDestinationValidators) ? App.rewardDestinationValidators : []).map((validator) => [
            validator.address,
            validator.moniker || 'Validator'
          ])
        );
        rewardRows.forEach((row) => {
          const option = document.createElement('option');
          option.value = row.validatorAddress;
          const shortAddr = row.validatorAddress.length > 20 ? `${row.validatorAddress.substring(0, 17)}...` : row.validatorAddress;
          const moniker = validatorMonikerByAddress.get(row.validatorAddress) || 'Validator';
          option.textContent = `${moniker} (${shortAddr}) - ${App.formatLoyaToTrb(row.loyaAmount)} TRB`;
          select.appendChild(option);
        });
        const radios = container.querySelectorAll('input[name="delegator-claim-mode"]');
        radios.forEach((radio) => {
          radio.addEventListener('change', () => {
            const singleSelected = container.querySelector('input[name="delegator-claim-mode"]:checked').value === 'single';
            select.style.display = singleSelected ? 'block' : 'none';
          });
        });
      },
      onConfirm: async () => {
        const mode = document.querySelector('input[name="delegator-claim-mode"]:checked')?.value || 'all';
        if (mode === 'all') {
          await App.claimAllDelegatorRewards();
          return;
        }
        const validatorAddress = document.getElementById('delegatorClaimModalValidator')?.value || '';
        if (!validatorAddress) {
          throw new Error('Select a validator reward to claim.');
        }
        await App.claimSelectedDelegatorReward(validatorAddress);
      }
    });
  },

  openSelectorTipClaimModal: async function() {
    const available = Number(App.selectorAvailableTipsRaw) || 0;
    if (available <= 0) {
      App.showErrorPopup('No claimable selector tips available.');
      return;
    }
    if (!Array.isArray(App.rewardDestinationValidators) || !App.rewardDestinationValidators.length) {
      try {
        const validators = await App.fetchValidators();
        const activeValidators = Array.isArray(validators) ? validators.filter((validator) => !validator.jailed) : [];
        App.rewardDestinationValidators = activeValidators.map((validator) => ({
          address: validator.address,
          moniker: validator.moniker
        }));
      } catch (error) {
        console.error('Failed to load validator destinations for selector claim:', error);
      }
      App.updateSelectorTipActionButton();
      if (!Array.isArray(App.rewardDestinationValidators) || !App.rewardDestinationValidators.length) {
        App.showErrorPopup('No validator destinations available. Try refreshing validators.');
        return;
      }
    }
    App.buildRewardClaimModal({
      title: 'Claim Selector Tips',
      confirmLabel: 'Claim Tips',
      bodyBuilder: (container) => {
        container.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:12px;color:#9ac3c3;">Available tips: ${App.formatLoyaToTrb(available)} TRB</div>
            <div style="font-size:12px;color:#9ac3c3;display:flex;align-items:center;gap:6px;">
              <span>Selector tips are restaked first, not liquid on claim.</span>
              <span data-modal-tooltip="Selector tip claims restake rewards to the validator you choose. They are not liquid at claim time. To make them liquid, undelegate and wait the ~21 day unbonding period." style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1px solid #6fa3a3;color:#9fd6d6;font-size:11px;cursor:help;flex:0 0 auto;" tabindex="0" role="button" aria-label="Selector tip claim info">ⓘ</span>
            </div>
            <select id="selectorClaimModalValidator" class="input-address">
              <option value="">Select validator destination...</option>
            </select>
          </div>
        `;
        const select = container.querySelector('#selectorClaimModalValidator');
        App.rewardDestinationValidators.forEach((validator) => {
          const option = document.createElement('option');
          option.value = validator.address;
          const shortAddr = validator.address.length > 20 ? `${validator.address.substring(0, 17)}...` : validator.address;
          const moniker = validator.moniker || 'Validator';
          option.textContent = `${moniker} (${shortAddr})`;
          option.title = `Address: ${validator.address}`;
          select.appendChild(option);
        });
      },
      onConfirm: async () => {
        const validatorAddress = document.getElementById('selectorClaimModalValidator')?.value || '';
        if (!validatorAddress) {
          throw new Error('Select a validator destination for selector tip claim.');
        }
        await App.claimSelectorTips(validatorAddress);
      }
    });
  },

  getCosmosSignerAndAddress: async function() {
    if (!App.isKeplrConnected || !App.keplrAddress) {
      throw new Error('Cosmos wallet not connected.');
    }
    let offlineSigner;
    if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
      offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
    } else if (window.keplr) {
      offlineSigner = window.keplr.getOfflineSigner(App.cosmosChainId);
    } else if (window.getOfflineSigner) {
      offlineSigner = window.getOfflineSigner(App.cosmosChainId);
    } else {
      throw new Error('No Cosmos signer available.');
    }
    const accounts = await offlineSigner.getAccounts();
    const signerAddress = (accounts && accounts[0] && accounts[0].address) || App.keplrAddress;
    return { offlineSigner, signerAddress };
  },

  broadcastCosmosMessages: async function(messages, memo = '') {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('No messages to broadcast.');
    }
    const { offlineSigner, signerAddress } = await App.getCosmosSignerAndAddress();
    const client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
      App.getCosmosRpcEndpoint(),
      offlineSigner
    );
    const gasAmount = Math.max(200000, 120000 * messages.length);
    const feeAmount = Math.max(15000, 8000 * messages.length);
    return client.signAndBroadcastDirect(
      signerAddress,
      messages,
      {
        amount: [{ denom: 'loya', amount: String(feeAmount) }],
        gas: String(gasAmount)
      },
      memo
    );
  },

  displayDelegatorRewardsStatus: async function(delegatorAddress) {
    const statusElement = document.getElementById('delegatorRewardsStatus');
    if (!statusElement) {
      return;
    }
    try {
      statusElement.innerHTML = '<div class="status-loading">Loading...</div>';
      const rewardsData = await App.fetchDelegatorRewards(delegatorAddress);
      App.delegatorRewardRows = rewardsData.rewards || [];
      const eligibleRows = App.getClaimableDelegatorRewardRows();
      if (eligibleRows.length === 0) {
        statusElement.innerHTML = '<div class="status-empty">No claimable delegator rewards</div>';
        App.updateDelegatorRewardActionButtons();
        return;
      }
      const totalLoya = eligibleRows.reduce((sum, row) => sum + row.loyaAmount, 0);
      statusElement.innerHTML = `
        <div class="status-item">
          <span class="status-label">Claimable total:</span>
          <span class="status-amount">${App.formatLoyaToTrb(totalLoya)} TRB</span>
        </div>
      `;
      App.updateDelegatorRewardActionButtons();
    } catch (error) {
      console.error('Error displaying delegator rewards status:', error);
      statusElement.innerHTML = '<div class="status-empty">Error loading delegator rewards</div>';
      App.delegatorRewardRows = [];
      App.updateDelegatorRewardActionButtons();
    }
  },

  displaySelectorTipsStatus: async function(selectorAddress) {
    const statusElement = document.getElementById('selectorTipsStatus');
    if (!statusElement) {
      return;
    }
    try {
      statusElement.innerHTML = '<div class="status-loading">Loading...</div>';
      const availableLoya = await App.fetchSelectorAvailableTips(selectorAddress);
      App.selectorAvailableTipsRaw = String(availableLoya || 0);
      if (availableLoya <= 0) {
        statusElement.innerHTML = '<div class="status-empty">No claimable selector tips</div>';
        App.updateSelectorTipActionButton();
        return;
      }
      statusElement.innerHTML = `
        <div class="status-item">
          <span class="status-label">Available tips:</span>
          <span class="status-amount">${App.formatLoyaToTrb(availableLoya)} TRB</span>
        </div>
      `;
      App.updateSelectorTipActionButton();
    } catch (error) {
      console.error('Error displaying selector tips status:', error);
      statusElement.innerHTML = '<div class="status-empty">Error loading selector tips</div>';
      App.selectorAvailableTipsRaw = '0';
      App.updateSelectorTipActionButton();
    }
  },

  claimAllDelegatorRewards: async function() {
    try {
      const rewardRows = Array.isArray(App.delegatorRewardRows) ? App.delegatorRewardRows.filter((row) => row.loyaAmount > 0) : [];
      if (rewardRows.length === 0) {
        throw new Error('No claimable delegator rewards available.');
      }
      if (typeof App._closeActiveRewardClaimModal === 'function') {
        App._closeActiveRewardClaimModal();
      }
      App.showPendingPopup('Claiming delegator rewards...');
      const { signerAddress } = await App.getCosmosSignerAndAddress();
      const messages = rewardRows.map((row) => ({
        typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
        value: {
          delegatorAddress: signerAddress,
          validatorAddress: row.validatorAddress
        }
      }));
      const result = await App.broadcastCosmosMessages(messages, 'Claim All Delegator Rewards');
      App.hidePendingPopup();
      if (!result || result.code !== 0) {
        throw new Error(result?.rawLog || 'Delegator reward claim failed');
      }
      App.showSuccessPopup('Delegator rewards claimed successfully!', result?.txhash || null, 'cosmos');
      await App.refreshCurrentStatus();
    } catch (error) {
      console.error('Failed to claim all delegator rewards:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to claim delegator rewards');
    }
  },

  claimSelectedDelegatorReward: async function(validatorAddressInput = '') {
    try {
      const validatorAddress = String(validatorAddressInput || '').trim();
      if (!validatorAddress) {
        throw new Error('Select a validator reward to claim.');
      }
      if (typeof App._closeActiveRewardClaimModal === 'function') {
        App._closeActiveRewardClaimModal();
      }
      App.showPendingPopup('Claiming selected validator reward...');
      const { signerAddress } = await App.getCosmosSignerAndAddress();
      const result = await App.broadcastCosmosMessages([
        {
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value: {
            delegatorAddress: signerAddress,
            validatorAddress
          }
        }
      ], 'Claim Selected Delegator Reward');
      App.hidePendingPopup();
      if (!result || result.code !== 0) {
        throw new Error(result?.rawLog || 'Selected reward claim failed');
      }
      App.showSuccessPopup('Validator reward claimed successfully!', result?.txhash || null, 'cosmos');
      await App.refreshCurrentStatus();
    } catch (error) {
      console.error('Failed to claim selected delegator reward:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to claim selected validator reward');
    }
  },

  claimSelectorTips: async function(validatorAddressInput = '') {
    try {
      const available = Number(App.selectorAvailableTipsRaw) || 0;
      if (available <= 0) {
        throw new Error('No claimable selector tips available.');
      }
      const validatorAddress = String(validatorAddressInput || '').trim();
      if (!validatorAddress) {
        throw new Error('Select a validator destination for selector tip claim.');
      }
      if (typeof App._closeActiveRewardClaimModal === 'function') {
        App._closeActiveRewardClaimModal();
      }
      App.showPendingPopup('Claiming selector tips...');
      const { signerAddress } = await App.getCosmosSignerAndAddress();
      const result = await App.broadcastCosmosMessages([
        {
          typeUrl: '/layer.reporter.MsgWithdrawTip',
          value: {
            selectorAddress: signerAddress,
            validatorAddress
          }
        }
      ], 'Claim Selector Tips');
      App.hidePendingPopup();
      if (!result || result.code !== 0) {
        throw new Error(result?.rawLog || 'Selector tip claim failed');
      }
      App.showSuccessPopup('Selector tips claimed successfully!', result?.txhash || null, 'cosmos');
      await App.refreshCurrentStatus();
    } catch (error) {
      console.error('Failed to claim selector tips:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to claim selector tips');
    }
  },

  // Add function to display current reporter status
  displayCurrentReporterStatus: async function(selectorAddress) {
    const statusElement = document.getElementById('currentReporterStatus');
    if (!statusElement) return;

    try {
      statusElement.innerHTML = '<div class="status-loading">Loading...</div>';
      
      const reporterData = await this.fetchCurrentReporter(selectorAddress);
      
      if (!reporterData) {
        statusElement.innerHTML = '<div class="status-empty">No reporter selected</div>';
        App._hasCurrentReporterSelection = false;
        App.updateReporterActionButton();
        return;
      }

      // Display reporter moniker + address with copy tooltip
      const reporterAddress = reporterData.reporter || 'Unknown';

      // Try to resolve reporter moniker from reporters list
      let reporterLabel = reporterAddress;
      try {
        const reporters = await this.fetchReporters();
        const match = reporters.find(r => r.address === reporterAddress);
        if (match && match.name) {
          const shortAddr = reporterAddress.length > 20
            ? reporterAddress.substring(0, 17) + '...'
            : reporterAddress;
          reporterLabel = `${match.name} (${shortAddr})`;
        }
      } catch (e) {
        console.error('Error fetching reporters for reporter status:', e);
      }

      statusElement.innerHTML = `
        <div class="status-item">
          <span class="status-address">${reporterLabel}</span>
          <button class="copy-btn" onclick="App.copyToClipboard('${reporterAddress}')" data-tooltip="Copy address">⧉</button>
        </div>
      `;
      App._hasCurrentReporterSelection = true;
      App.updateReporterActionButton();
    } catch (error) {
      console.error('Error displaying reporter status:', error);
      statusElement.innerHTML = '<div class="status-empty">Error loading reporter status</div>';
      App._hasCurrentReporterSelection = false;
      App.updateReporterActionButton();
    }
  },

  // Toggle delegations dropdown
  toggleDelegationsDropdown: function() {
    const dropdown = document.getElementById('delegationsDropdown');
    const arrow = document.getElementById('delegationsDropdownArrow');
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
      dropdown.style.display = 'block';
      arrow.classList.add('rotated');
    } else {
      dropdown.style.display = 'none';
      arrow.classList.remove('rotated');
    }
  },

  // Copy text to clipboard
  copyToClipboard: function(text) {
    if (navigator.clipboard && window.isSecureContext) {
      // Use modern clipboard API
      navigator.clipboard.writeText(text).then(() => {
        this.showCopySuccess();
      }).catch(err => {
        console.error('Failed to copy: ', err);
        this.fallbackCopyToClipboard(text);
      });
    } else {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  },

  // Fallback copy method for older browsers
  fallbackCopyToClipboard: function(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch (err) {
      console.error('Fallback copy failed: ', err);
      alert('Failed to copy address');
    }
    
    document.body.removeChild(textArea);
  },

  // Show copy success feedback
  showCopySuccess: function() {
    // Create a temporary success message
    const successMsg = document.createElement('div');
    successMsg.textContent = 'Copied!';
    successMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #003434;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    document.body.appendChild(successMsg);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (successMsg.parentNode) {
        successMsg.parentNode.removeChild(successMsg);
      }
    }, 2000);
  },

  // Add function to display current delegations status
  displayCurrentDelegationsStatus: async function(delegatorAddress) {
    const statusElement = document.getElementById('currentDelegationsStatus');
    const countBadge = document.getElementById('currentDelegationsCountBadge');
    if (!statusElement) return;

    try {
      statusElement.innerHTML = '<div class="status-loading">Loading...</div>';
      
      const delegations = await this.fetchCurrentDelegations(delegatorAddress);
      
      if (!delegations || delegations.length === 0) {
        statusElement.innerHTML = '<div class="status-empty">No delegations found</div>';
        if (countBadge) {
          countBadge.style.display = 'none';
          countBadge.textContent = '';
        }
        return;
      }

      // Fetch validators to map operator address -> moniker
      let validatorMonikers = {};
      try {
        const validators = await this.fetchValidators();
        validators.forEach(validator => {
          validatorMonikers[validator.address] = validator.moniker || 'Unknown Validator';
        });
      } catch (e) {
        console.error('Error fetching validators for delegations status:', e);
      }

      // Calculate total delegation and find top validator
      let totalDelegated = 0;
      let topDelegation = null;
      delegations.forEach(delegation => {
        if (delegation.denom === 'loya') {
          const amount = parseInt(delegation.amount);
          totalDelegated += amount;
          if (!topDelegation || amount > parseInt(topDelegation.amount)) {
            topDelegation = delegation;
          }
        }
      });

      const totalTRB = (totalDelegated / 1000000).toFixed(6);
      const delegationCount = delegations.length;
      if (countBadge) {
        countBadge.textContent = `${delegationCount} delegation${delegationCount !== 1 ? 's' : ''}`;
        countBadge.style.display = 'inline-flex';
      }

      // Derive top validator display (moniker + short address), if any
      let topValidatorHtml = '';
      if (topDelegation) {
        const topAddr = topDelegation.validatorAddress;
        const moniker = validatorMonikers[topAddr] || 'Validator';
        topValidatorHtml = `
          <div class="status-top-validator">
            <span class="status-label">Top validator:</span>
            <span class="status-address">${moniker}</span>
          </div>
        `;
      }

      // Display total with badge + optional top validator, and dropdown arrow
      statusElement.innerHTML = `
        <div class="status-total-container" onclick="App.toggleDelegationsDropdown()">
          <div class="status-total-content">
            <span class="status-label">Total:</span>
            <span class="status-amount">${totalTRB} TRB</span>
          </div>
          ${topValidatorHtml}
          <span class="dropdown-arrow" id="delegationsDropdownArrow">▼</span>
        </div>
      `;

      // Populate dropdown with detailed delegations (moniker + address)
      const dropdownContent = document.getElementById('delegationsDropdownContent');
      if (dropdownContent) {
        let dropdownHtml = '';
        for (const delegation of delegations) {
          const amountTRB = (parseInt(delegation.amount) / 1000000).toFixed(6);
          const fullAddr = delegation.validatorAddress;
          const shortAddr = fullAddr.length > 20 
            ? fullAddr.substring(0, 17) + '...'
            : fullAddr;
          const moniker = validatorMonikers[fullAddr] || 'Validator';
          
          dropdownHtml += `
            <div class="status-item status-delegation">
              <div class="address-with-copy">
                <span class="status-address">${moniker} (${shortAddr})</span>
                <button class="copy-btn" onclick="App.copyToClipboard('${fullAddr}')" data-tooltip="Copy full address">⧉</button>
              </div>
              <span class="status-amount">${amountTRB} TRB</span>
            </div>
          `;
        }
        dropdownContent.innerHTML = dropdownHtml;
        App.debugLog('Dropdown HTML set:', dropdownHtml);
      }
    } catch (error) {
      console.error('Error displaying delegations status:', error);
      statusElement.innerHTML = '<div class="status-empty">Error loading delegations</div>';
      if (countBadge) {
        countBadge.style.display = 'none';
        countBadge.textContent = '';
      }
    }
  },

  // Add function to refresh all status
  refreshCurrentStatus: async function() {
    if (!App.isKeplrConnected || !App.keplrAddress) {
      const delegationsStatus = document.getElementById('currentDelegationsStatus');
      if (delegationsStatus) {
        delegationsStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view delegations</div>';
      }
      const reporterStatus = document.getElementById('currentReporterStatus');
      if (reporterStatus) {
        reporterStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view selected reporter</div>';
      }
      const delegatorRewardsStatus = document.getElementById('delegatorRewardsStatus');
      if (delegatorRewardsStatus) {
        delegatorRewardsStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view rewards</div>';
      }
      const selectorTipsStatus = document.getElementById('selectorTipsStatus');
      if (selectorTipsStatus) {
        selectorTipsStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view selector tips</div>';
      }
      return;
    }

    try {
      await Promise.all([
        this.displayCurrentReporterStatus(App.keplrAddress),
        this.displayCurrentDelegationsStatus(App.keplrAddress),
        this.displayDelegatorRewardsStatus(App.keplrAddress),
        this.displaySelectorTipsStatus(App.keplrAddress)
      ]);
    } catch (error) {
      console.error('Error refreshing current status:', error);
    }
  },



  // Initialize delegate section
  initDelegateSection: function() {
    // Set initial state - don't load validators until wallet is connected
    const dropdown = document.getElementById('delegateValidatorDropdown');
    if (dropdown) {
      dropdown.innerHTML = '<option value="">Connect Cosmos wallet to view validators</option>';
      dropdown.disabled = true;
    }
    const delegationsStatus = document.getElementById('currentDelegationsStatus');
    if (delegationsStatus && !App.isKeplrConnected) {
      delegationsStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view delegations</div>';
    }
    const reporterStatus = document.getElementById('currentReporterStatus');
    if (reporterStatus && !App.isKeplrConnected) {
      reporterStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view selected reporter</div>';
    }
    const delegatorRewardsStatus = document.getElementById('delegatorRewardsStatus');
    if (delegatorRewardsStatus && !App.isKeplrConnected) {
      delegatorRewardsStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view rewards</div>';
    }
    const selectorTipsStatus = document.getElementById('selectorTipsStatus');
    if (selectorTipsStatus && !App.isKeplrConnected) {
      selectorTipsStatus.innerHTML = '<div class="status-empty">Connect Cosmos wallet to view selector tips</div>';
    }
    
    // Add change event listener to update the hidden input
    if (dropdown && !dropdown.hasAttribute('data-initialized')) {
      dropdown.setAttribute('data-initialized', 'true');
      dropdown.addEventListener('change', function() {
        const hiddenInput = document.getElementById('delegateValidatorAddress');
        if (hiddenInput) {
          hiddenInput.value = this.value;
        }
      });
    }
    
    // Add refresh button event listener if not already added
    const refreshBtn = document.getElementById('refreshValidatorsBtn');
    if (refreshBtn && !refreshBtn.hasAttribute('data-initialized')) {
      refreshBtn.setAttribute('data-initialized', 'true');
      refreshBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⟳';
        try {
          await App.populateValidatorDropdown();
        } catch (error) {
          console.error('Error refreshing validators:', error);
        } finally {
          this.disabled = false;
          this.textContent = '↻';
        }
      });
    }

    // Initialize reporter dropdown
    const reporterDropdown = document.getElementById('reporterDropdown');
    if (reporterDropdown) {
      reporterDropdown.innerHTML = '<option value="">Connect Cosmos wallet to view reporters</option>';
      reporterDropdown.disabled = true;
    }
    
    // Add change event listener to update the hidden input for reporters
    if (reporterDropdown && !reporterDropdown.hasAttribute('data-initialized')) {
      reporterDropdown.setAttribute('data-initialized', 'true');
      reporterDropdown.addEventListener('change', function() {
        const hiddenInput = document.getElementById('selectedReporterAddress');
        if (hiddenInput) {
          hiddenInput.value = this.value;
        }
      });
    }
    
    // Add refresh button event listener for reporters if not already added
    const refreshReportersBtn = document.getElementById('refreshReportersBtn');
    if (refreshReportersBtn && !refreshReportersBtn.hasAttribute('data-initialized')) {
      refreshReportersBtn.setAttribute('data-initialized', 'true');
      refreshReportersBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⟳';
        try {
          await App.populateReporterDropdown();
        } catch (error) {
          console.error('Error refreshing reporters:', error);
        } finally {
          this.disabled = false;
          this.textContent = '↻';
        }
      });
    }

    // Add refresh button event handlers for status cards
    const refreshReporterStatusBtn = document.getElementById('refreshReporterStatusBtn');
    if (refreshReporterStatusBtn && !refreshReporterStatusBtn.hasAttribute('data-initialized')) {
      refreshReporterStatusBtn.setAttribute('data-initialized', 'true');
      refreshReporterStatusBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⟳';
        try {
          if (App.isKeplrConnected && App.keplrAddress) {
            await App.displayCurrentReporterStatus(App.keplrAddress);
          }
        } catch (error) {
          console.error('Error refreshing reporter status:', error);
        } finally {
          this.disabled = false;
          this.textContent = '↻';
        }
      });
    }

    const refreshDelegationsBtn = document.getElementById('refreshDelegationsBtn');
    if (refreshDelegationsBtn && !refreshDelegationsBtn.hasAttribute('data-initialized')) {
      refreshDelegationsBtn.setAttribute('data-initialized', 'true');
      refreshDelegationsBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⟳';
        try {
          if (App.isKeplrConnected && App.keplrAddress) {
            await App.displayCurrentDelegationsStatus(App.keplrAddress);
          }
        } catch (error) {
          console.error('Error refreshing delegations status:', error);
        } finally {
          this.disabled = false;
          this.textContent = '↻';
        }
      });
    }

    const refreshDelegatorRewardsBtn = document.getElementById('refreshDelegatorRewardsBtn');
    if (refreshDelegatorRewardsBtn && !refreshDelegatorRewardsBtn.hasAttribute('data-initialized')) {
      refreshDelegatorRewardsBtn.setAttribute('data-initialized', 'true');
      refreshDelegatorRewardsBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⟳';
        try {
          if (App.isKeplrConnected && App.keplrAddress) {
            await App.displayDelegatorRewardsStatus(App.keplrAddress);
          }
        } catch (error) {
          console.error('Error refreshing delegator rewards:', error);
        } finally {
          this.disabled = false;
          this.textContent = '↻';
        }
      });
    }

    const refreshSelectorTipsBtn = document.getElementById('refreshSelectorTipsBtn');
    if (refreshSelectorTipsBtn && !refreshSelectorTipsBtn.hasAttribute('data-initialized')) {
      refreshSelectorTipsBtn.setAttribute('data-initialized', 'true');
      refreshSelectorTipsBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '⟳';
        try {
          if (App.isKeplrConnected && App.keplrAddress) {
            await App.displaySelectorTipsStatus(App.keplrAddress);
          }
        } catch (error) {
          console.error('Error refreshing selector tips:', error);
        } finally {
          this.disabled = false;
          this.textContent = '↻';
        }
      });
    }

    const claimDelegatorRewardsButton = document.getElementById('claimDelegatorRewardsButton');
    if (claimDelegatorRewardsButton && !claimDelegatorRewardsButton.hasAttribute('data-initialized')) {
      claimDelegatorRewardsButton.setAttribute('data-initialized', 'true');
      claimDelegatorRewardsButton.addEventListener('click', function() {
        App.openDelegatorRewardsClaimModal();
      });
    }

    const claimSelectorTipsButton = document.getElementById('claimSelectorTipsButton');
    if (claimSelectorTipsButton && !claimSelectorTipsButton.hasAttribute('data-initialized')) {
      claimSelectorTipsButton.setAttribute('data-initialized', 'true');
      claimSelectorTipsButton.addEventListener('click', async function() {
        await App.openSelectorTipClaimModal();
      });
    }

    App.updateDelegatorRewardActionButtons();
    App.updateSelectorTipActionButton();
  },

  // Add function to populate validator dropdown
  populateValidatorDropdown: async function(isNetworkSwitch = false) {
    try {
      const dropdown = document.getElementById('delegateValidatorDropdown');
      if (!dropdown) {
        console.error('Validator dropdown not found');
        return;
      }
      
      // Show appropriate loading state
      if (isNetworkSwitch) {
        const networkName = App.cosmosChainId === 'tellor-1' ? 'mainnet' : 'testnet';
        dropdown.innerHTML = `<option value="">Switching to ${networkName} - loading validators...</option>`;
      } else {
        dropdown.innerHTML = '<option value="">Loading validators...</option>';
      }
      dropdown.disabled = true;
      
      const validators = await this.fetchValidators();
      const activeValidators = Array.isArray(validators) ? validators.filter((validator) => !validator.jailed) : [];
      App.rewardDestinationValidators = activeValidators.map((validator) => ({
        address: validator.address,
        moniker: validator.moniker
      }));
      
      // Clear loading state and populate dropdown with network indicator
      const networkName = App.cosmosChainId === 'tellor-1' ? 'Mainnet' : 'Testnet';
      dropdown.innerHTML = `<option value="">Select a validator (${networkName})...</option>`;
      
                      validators.forEach(validator => {
                    if (!validator.jailed) { // Only show non-jailed validators
                        const votingPower = (parseInt(validator.votingPower) / 1000000).toFixed(2);
                        const commission = (parseFloat(validator.commission) * 100).toFixed(2);
                        
                        // Truncate moniker if it's too long
                        let displayMoniker = validator.moniker;
                        if (displayMoniker.length > 20) {
                            displayMoniker = displayMoniker.substring(0, 17) + '...';
                        }
                        
                        const option = document.createElement('option');
                        option.value = validator.address;
                        option.textContent = `${displayMoniker} (${votingPower} TRB, ${commission}% COMMSN)`;
                        option.title = `Address: ${validator.address}`;
                        dropdown.appendChild(option);
                    }
                });
      
      dropdown.disabled = false;
      App.updateSelectorTipActionButton();
      

      
    } catch (error) {
      console.error('Error populating validator dropdown:', error);
      App.rewardDestinationValidators = [];
      App.updateSelectorTipActionButton();
      const dropdown = document.getElementById('delegateValidatorDropdown');
      if (dropdown) {
        dropdown.innerHTML = '<option value="">Error loading validators</option>';
        dropdown.disabled = true;
      }
    }
  },

  // Add function to populate reporter dropdown
  populateReporterDropdown: async function(isNetworkSwitch = false) {
    try {
      const dropdown = document.getElementById('reporterDropdown');
      if (!dropdown) {
        console.error('Reporter dropdown not found');
        return;
      }
      
      // Show appropriate loading state
      if (isNetworkSwitch) {
        const networkName = App.cosmosChainId === 'tellor-1' ? 'mainnet' : 'testnet';
        dropdown.innerHTML = `<option value="">Switching to ${networkName} - loading reporters...</option>`;
      } else {
        dropdown.innerHTML = '<option value="">Loading reporters...</option>';
      }
      dropdown.disabled = true;
      
      const reporters = await this.fetchReporters();
      
      // Clear loading state and populate dropdown with network indicator
      const networkName = App.cosmosChainId === 'tellor-1' ? 'Mainnet' : 'Testnet';
      dropdown.innerHTML = `<option value="">Select a reporter (${networkName})...</option>`;
      
      reporters.forEach(reporter => {
        if (reporter.active) { // Only show active reporters
          // Truncate name if it's too long
          let displayName = reporter.name;
          if (displayName.length > 20) {
            displayName = displayName.substring(0, 17) + '...';
          }
          
          const option = document.createElement('option');
          option.value = reporter.address;
          // Extract power and commission from description
          const powerMatch = reporter.description.match(/Power: (\d+)/);
          const commissionMatch = reporter.description.match(/Commission: ([\d.]+)%/);
          const power = powerMatch ? powerMatch[1] : '0';
          const commission = commissionMatch ? commissionMatch[1] : '0';
          
          option.textContent = `${displayName} (${power} POWER, ${commission}% COMMSN)`;
          option.title = `Address: ${reporter.address}`;
          dropdown.appendChild(option);
        }
      });
      
      dropdown.disabled = false;
      
    } catch (error) {
      console.error('Error populating reporter dropdown:', error);
      const dropdown = document.getElementById('reporterDropdown');
      if (dropdown) {
        dropdown.innerHTML = '<option value="">Error loading reporters</option>';
        dropdown.disabled = true;
      }
    }
  },

  // Dispute Functions
  initDisputeProposer: async function() {
    try {
      // Initialize the dispute proposer
      if (window.disputeProposer) {
        await window.disputeProposer.init();
      } else {
        console.error('DisputeProposer not found');
      }
    } catch (error) {
      console.error('Failed to initialize dispute proposer:', error);
    }
  },

  // Propose a dispute
  proposeDispute: async function() {
    try {
      if (!window.disputeProposer) {
        throw new Error('DisputeProposer not initialized');
      }

      // Get form values
      const disputedReporter = document.getElementById('disputedReporter').value.trim();
      const reportMetaId = document.getElementById('reportMetaId').value.trim();
      const reportQueryId = document.getElementById('reportQueryId').value.trim();
      const disputeCategory = document.getElementById('disputeCategory').value;
      const fee = document.getElementById('disputeFee').value.trim();
      const payFromBond = document.getElementById('payFromBond').checked;

      // Validate inputs
      if (!disputedReporter) {
        throw new Error('Please enter the disputed reporter address');
      }
      if (!reportMetaId) {
        throw new Error('Please enter the report meta ID');
      }
      if (!reportQueryId) {
        throw new Error('Please enter the report query ID');
      }
      if (!disputeCategory) {
        throw new Error('Please select a dispute category');
      }
      if (!fee || parseFloat(fee) <= 0) {
        throw new Error('Please enter a valid fee amount');
      }

      // Validate address format
      if (!window.disputeProposer.isValidAddress(disputedReporter)) {
        throw new Error('Invalid disputed reporter address format');
      }

      // Show pending popup
      App.showPendingPopup("Proposing dispute...");

      // Submit the dispute proposal
      const result = await window.disputeProposer.proposeDispute(
        disputedReporter, 
        reportMetaId, 
        reportQueryId, 
        disputeCategory, 
        fee, 
        payFromBond
      );
      
      // Hide pending popup
      App.hidePendingPopup();
      
      if (result.success) {
        // Show success popup with transaction hash and block explorer link
        App.showSuccessPopup("Dispute proposed successfully!", result.transactionHash, 'cosmos');
        
        // Clear form
        document.getElementById('disputedReporter').value = '';
        document.getElementById('reportMetaId').value = '';
        document.getElementById('reportQueryId').value = '';
        document.getElementById('disputeFee').value = '';
        document.getElementById('payFromBond').checked = false;
      } else {
        throw new Error('Failed to propose dispute');
      }
    } catch (error) {
      console.error('Failed to propose dispute:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to propose dispute');
    }
  },

  // Refresh disputes when wallet connects (if on Vote on Dispute tab)
  refreshDisputesOnWalletConnect: function() {
    const voteDisputeTab = document.getElementById('voteDisputeTab');
    const queryDisputeTab = document.getElementById('queryDisputeTab');
    
    // Refresh Vote on Dispute tab if active
    if (voteDisputeTab && voteDisputeTab.classList.contains('active')) {
      setTimeout(() => {
        if (window.App && window.App.loadOpenDisputes) {
          window.App.loadOpenDisputes();
        }
      }, 500);
    }
    
    // Refresh Query Dispute tab if active
    if (queryDisputeTab && queryDisputeTab.classList.contains('active')) {
      setTimeout(() => {
        if (window.App && window.App.loadAllDisputes) {
          window.App.loadAllDisputes();
        }
      }, 500);
    }
    
    // Only check voting power when the vote tab is active.
    if (voteDisputeTab && voteDisputeTab.classList.contains('active')) {
      setTimeout(() => {
        if (window.App && window.App.checkVotingPower) {
          window.App.checkVotingPower();
        }
      }, 600);
    }
  },

      // Check and display voting power status
    checkVotingPower: async function() {
        try {
            if (!window.disputeProposer) {
                return;
            }
            
            const walletStatus = await window.disputeProposer.getWalletStatus();
            if (!walletStatus.isConnected) {
                return;
            }

            const votingPowerCheck = await window.disputeProposer.checkVotingPower();
            const votingPowerIndicator = document.getElementById('votingPowerIndicator');
            
            if (votingPowerIndicator) {
                if (!votingPowerCheck.hasVotingPower) {
                    votingPowerIndicator.innerHTML = `
                        <div class="voting-power-warning">
                            <span class="warning-icon">⚠️</span>
                            <span class="warning-text">No Voting Power: ${votingPowerCheck.details}</span>
                        </div>
                    `;
                    votingPowerIndicator.style.display = 'block';
                } else {
                    votingPowerIndicator.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Failed to check voting power:', error);
        }
    },

    // Load all disputes for query tab
    loadAllDisputes: async function() {
        try {
            if (!window.disputeProposer) {
                throw new Error('DisputeProposer not initialized');
            }

            // Show loading state
            const disputesTable = document.getElementById('disputesTable');
            const loadingDiv = document.getElementById('disputesLoading');
            const errorDiv = document.getElementById('disputesError');
            
            // Check wallet connection first
            const walletStatus = await disputeProposer.getWalletStatus();
            if (!walletStatus.isConnected) {
                // Hide loading and table
                if (loadingDiv) {
                    loadingDiv.style.display = 'none';
                }
                if (disputesTable) {
                    disputesTable.style.display = 'none';
                }
                
                // Show wallet connection message
                if (errorDiv) {
                    errorDiv.innerHTML = `
                        <div class="wallet-connection-required">
                            <span class="connection-text">Please connect your Cosmos wallet to view disputes</span>
                        </div>
                    `;
                    errorDiv.className = 'disputes-wallet-required';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            if (loadingDiv) {
                loadingDiv.style.display = 'block';
                loadingDiv.textContent = `Loading disputes for ${walletStatus.network || 'current network'}...`;
            }
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            if (disputesTable) {
                disputesTable.style.display = 'none';
            }

            const result = await disputeProposer.getAllDisputesForQuery();
            
            // Hide loading state
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }

            if (result.disputes && result.disputes.length > 0) {
                await App.displayDisputesTable(result.disputes, result.pagination, walletStatus.network);
                if (disputesTable) {
                    disputesTable.style.display = 'block';
                }
            } else {
                if (errorDiv) {
                    errorDiv.textContent = `No disputes found on ${walletStatus.network || 'current network'}.`;
                    errorDiv.className = 'disputes-error';
                    errorDiv.style.display = 'block';
                }
            }

        } catch (error) {
            console.error('Failed to load disputes:', error);
            
            // Hide loading state
            const loadingDiv = document.getElementById('disputesLoading');
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }

            // Show error state
            const errorDiv = document.getElementById('disputesError');
            if (errorDiv) {
                errorDiv.textContent = `Failed to load disputes: ${error.message}`;
                errorDiv.className = 'disputes-error';
                errorDiv.style.display = 'block';
            }
        }
    },

    /**
     * Parse a cosmos-sdk integer string for UI checks (Claim / Withdraw Fee buttons use > 0 only).
     * Returns a safe Number, or 1 when the value exceeds Number.MAX_SAFE_INTEGER but is still > 0.
     */
    cosmosIntStringToUiNumber: function (raw) {
        if (raw == null || raw === '') {
            return 0;
        }
        const s = String(raw).trim();
        if (s === '0') {
            return 0;
        }
        try {
            const b = BigInt(s);
            if (b <= 0n) {
                return 0;
            }
            if (b <= BigInt(Number.MAX_SAFE_INTEGER)) {
                return Number(b);
            }
            return 1;
        } catch {
            const n = parseFloat(s);
            return Number.isFinite(n) && n > 0 ? n : 0;
        }
    },

    /**
     * Normalize LCD JSON for claimable dispute rewards.
     * Supports layer proto (claimableAmount.rewardAmount / feeRefundAmount) and legacy flat keys.
     */
    normalizeClaimableDisputeRewardsPayload: function (data) {
        if (!data || typeof data !== 'object') {
            return { 'claim-rewards': 0, 'withdraw-fee-refund': 0 };
        }
        if (Object.prototype.hasOwnProperty.call(data, 'claim-rewards') ||
            Object.prototype.hasOwnProperty.call(data, 'withdraw-fee-refund')) {
            return {
                'claim-rewards': parseFloat(data['claim-rewards'] ?? 0) || 0,
                'withdraw-fee-refund': parseFloat(data['withdraw-fee-refund'] ?? 0) || 0
            };
        }
        const inner = data.claimable_amount || data.claimableAmount;
        if (inner && typeof inner === 'object') {
            const rewardClaimed = inner.reward_claimed === true || inner.rewardClaimed === true;
            const rewardStr = inner.reward_amount ?? inner.rewardAmount ?? '0';
            const feeStr = inner.fee_refund_amount ?? inner.feeRefundAmount ?? '0';
            return {
                'claim-rewards': rewardClaimed ? 0 : App.cosmosIntStringToUiNumber(rewardStr),
                'withdraw-fee-refund': App.cosmosIntStringToUiNumber(feeStr)
            };
        }
        return { 'claim-rewards': 0, 'withdraw-fee-refund': 0 };
    },

    // Fetch claimable dispute rewards for an address and dispute
    fetchClaimableDisputeRewards: async function (address, disputeId) {
        const zeros = { 'claim-rewards': 0, 'withdraw-fee-refund': 0 };
        try {
            const lcd = App.getCosmosApiEndpoint();
            const idEnc = encodeURIComponent(String(disputeId));
            const addrEnc = encodeURIComponent(String(address));
            const urls = [
                `${lcd}/tellor-io/layer/dispute/claimable-dispute-rewards/${idEnc}/${addrEnc}`,
                `${lcd}/tellor-io/layer/dispute/claimabledisputerewards/${addrEnc}/${idEnc}`
            ];

            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                App.debugLog('Fetching claimable rewards from:', url);
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    App.debugLog('Claimable rewards data:', data);
                    return App.normalizeClaimableDisputeRewardsPayload(data);
                }
                if (response.status !== 404 && response.status !== 500) {
                    throw new Error(`Failed to fetch claimable rewards: ${response.status} ${response.statusText}`);
                }
                if (i === urls.length - 1) {
                    App.debugLog('Claimable rewards endpoint not active or no data, returning defaults');
                    return zeros;
                }
            }
            return zeros;
        } catch (error) {
            console.error('Error fetching claimable dispute rewards:', error);
            return zeros;
        }
    },

    // Display disputes in a table format
    displayDisputesTable: async function(disputes, pagination, network) {
        const tableBody = document.getElementById('disputesTableBody');
        const totalCount = document.getElementById('disputesTotalCount');
        
        if (!tableBody) {
            console.error('Disputes table body not found');
            return;
        }

        // Clear existing rows
        tableBody.innerHTML = '';

        // Update total count with network info
        if (totalCount && pagination) {
            const networkDisplay = network ? ` on ${network}` : '';
            totalCount.textContent = `Total Disputes: ${pagination.total}${networkDisplay}`;
        }

        // Get connected address
        const walletStatus = await window.disputeProposer.getWalletStatus();
        const connectedAddress = walletStatus.isConnected ? walletStatus.address : null;

        // Add rows for each dispute
        for (const dispute of disputes) {
            const row = document.createElement('tr');
            const data = dispute.displayData;
            
            // Format status with color coding
            const statusClass = App.getStatusClass(data.disputeStatus);
            const openBadge = data.isOpen ? '<span class="badge badge-success">Open</span>' : '<span class="badge badge-secondary">Closed</span>';
            
            // Format dates
            const startDate = data.startTime ? new Date(data.startTime).toLocaleDateString() : 'N/A';
            const endDate = data.endTime ? new Date(data.endTime).toLocaleDateString() : 'N/A';
            
            // Fetch claimable rewards if address is connected
            let claimableRewards = { 'claim-rewards': 0, 'withdraw-fee-refund': 0 };
            if (connectedAddress) {
                claimableRewards = await App.fetchClaimableDisputeRewards(connectedAddress, data.disputeId);
            }

            // Build actions column
            let actionsHtml = '';
            
            // Existing status-based actions
            if (data.disputeStatus === 'DISPUTE_STATUS_VOTING') {
                actionsHtml = `<button class="btn-small btn-vote" onclick="App.navigateToVoting('${data.disputeId}')">Vote</button>`;
            } else if (data.disputeStatus === 'DISPUTE_STATUS_PREVOTE') {
                actionsHtml = `<button class="btn-small btn-add-fee" onclick="App.navigateToAddFee('${data.disputeId}')">Add Fee</button>`;
            } else {
                actionsHtml = `<span class="status-text">${App.formatStatus(data.disputeStatus)}</span>`;
            }

            // Add claim buttons if rewards are available
            const claimButtons = [];
            if (claimableRewards['claim-rewards'] > 0) {
                claimButtons.push(`<button class="btn-small btn-claim-rewards" onclick="App.claimDisputeRewards('${data.disputeId}')">Claim Rewards</button>`);
            }
            if (claimableRewards['withdraw-fee-refund'] > 0) {
                claimButtons.push(`<button class="btn-small btn-withdraw-fee" onclick="App.withdrawFeeRefund('${data.disputeId}')">Withdraw Fee Refund</button>`);
            }

            if (claimButtons.length > 0) {
                // If there are existing actions, add a separator
                if (actionsHtml && !actionsHtml.includes('status-text')) {
                    actionsHtml += '<br style="margin-top: 4px;">';
                }
                actionsHtml += '<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">' + claimButtons.join('') + '</div>';
            }
            
            row.innerHTML = `
                <td class="dispute-id">#${data.disputeId}</td>
                <td class="dispute-status">
                    <span class="status-badge ${statusClass}">${App.formatStatus(data.disputeStatus)}</span>
                    ${openBadge}
                </td>
                <td class="dispute-category">${App.formatCategory(data.disputeCategory)}</td>
                <td class="dispute-reporter" title="${data.reporter}">${App.truncateAddress(data.reporter)}</td>
                <td class="dispute-query">${data.queryId}</td>
                <td class="dispute-fees">
                    <div class="fee-info">
                        <div>Required: ${data.slashAmount} TRB</div>
                        <div>Paid: ${data.feeTotal} TRB</div>
                        <div class="fee-remaining">Remaining: ${data.feeRemaining} TRB</div>
                    </div>
                </td>
                <td class="dispute-dates">
                    <div>Start: ${startDate}</div>
                    <div>End: ${endDate}</div>
                </td>
                <td class="dispute-block">${data.blockNumber}</td>
                <td class="dispute-actions">
                    ${actionsHtml}
                </td>
            `;
            
            tableBody.appendChild(row);
        }
    },

    // Helper functions for formatting
    getStatusClass: function(status) {
        switch (status) {
            case 'DISPUTE_STATUS_VOTING': return 'status-voting';
            case 'DISPUTE_STATUS_PREVOTE': return 'status-prevote';
            case 'DISPUTE_STATUS_RESOLVED': return 'status-resolved';
            case 'DISPUTE_STATUS_FAILED': return 'status-failed';
            default: return 'status-unknown';
        }
    },

    formatStatus: function(status) {
        return status ? status.replace('DISPUTE_STATUS_', '').replace(/_/g, ' ') : 'Unknown';
    },

    formatCategory: function(category) {
        return category ? category.replace('DISPUTE_CATEGORY_', '').replace(/_/g, ' ') : 'Unspecified';
    },

    truncateAddress: function(address) {
        if (!address || address.length <= 12) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
    },

    // Navigate to add fee tab with dispute pre-selected
    navigateToAddFee: function(disputeId) {
        try {
            App.debugLog('Navigating to add fee tab for dispute:', disputeId);
            
            // Switch to the add fee tab
            if (window.switchDisputeTab) {
                window.switchDisputeTab('addFeeDisputeTab');
            }
            
            // Wait a moment for the tab to load, then populate the dispute ID
            setTimeout(() => {
                const disputeIdInput = document.getElementById('addFeeDisputeId');
                if (disputeIdInput) {
                    disputeIdInput.value = disputeId;
                    App.debugLog(`Dispute ID #${disputeId} populated in add fee tab`);
                    
                    // Optional: Focus on the amount field for user convenience
                    const amountInput = document.getElementById('addFeeAmount');
                    if (amountInput) {
                        amountInput.focus();
                    }
                } else {
                    console.error('Add fee dispute ID input not found');
                }
            }, 200);
            
        } catch (error) {
            console.error('Failed to navigate to add fee tab:', error);
            App.showErrorPopup('Failed to navigate to add fee tab');
        }
    },

    // Navigate to voting tab with dispute pre-selected
    navigateToVoting: function(disputeId) {
        try {
            App.debugLog('Navigating to voting tab for dispute:', disputeId);
            
            // Switch to the voting tab
            if (window.switchDisputeTab) {
                window.switchDisputeTab('voteDisputeTab');
            }
            
            // Wait a moment for the tab to load, then select the dispute
            setTimeout(async () => {
                const disputeSelect = document.getElementById('voteDisputeId');
                if (disputeSelect) {
                    // Check if the dispute option exists in the dropdown
                    const option = disputeSelect.querySelector(`option[value="${disputeId}"]`);
                    if (option) {
                        disputeSelect.value = disputeId;
                        App.debugLog(`Dispute #${disputeId} selected in voting tab`);
                    } else {
                        // If dispute not in dropdown, try to refresh the list first
                        App.debugLog(`Dispute #${disputeId} not found in dropdown, refreshing list...`);
                        if (window.App && window.App.loadOpenDisputes) {
                            await window.App.loadOpenDisputes();
                            
                            // Try again after refresh
                            setTimeout(() => {
                                const refreshedOption = disputeSelect.querySelector(`option[value="${disputeId}"]`);
                                if (refreshedOption) {
                                    disputeSelect.value = disputeId;
                                    App.debugLog(`Dispute #${disputeId} selected after refresh`);
                                } else {
                                    console.warn(`Dispute #${disputeId} not available for voting (may not be in voting state)`);
                                    // Still switch to the tab but show a message
                                    App.showInfoMessage(`Dispute #${disputeId} may not be available for voting at this time.`);
                                }
                            }, 500);
                        }
                    }
                } else {
                    console.error('Vote dispute dropdown not found');
                }
            }, 200);
            
        } catch (error) {
            console.error('Failed to navigate to voting tab:', error);
            App.showErrorPopup('Failed to navigate to voting tab');
        }
    },

    // Claim dispute rewards
    claimDisputeRewards: async function(disputeId) {
        try {
            if (!window.disputeProposer) {
                throw new Error('DisputeProposer not initialized');
            }

            // Check wallet connection
            const walletStatus = await window.disputeProposer.getWalletStatus();
            if (!walletStatus.isConnected || !walletStatus.address) {
                throw new Error('Wallet not connected. Please connect your Cosmos wallet.');
            }

            // Show pending popup
            App.showPendingPopup("Claiming dispute rewards...");

            const rpcEndpoint = App.getCosmosRpcEndpoint();

            // Get offline signer
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.keplr) {
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : LAYER_TESTNET_CHAIN_ID;
                offlineSigner = window.keplr.getOfflineSigner(chainId);
            } else {
                throw new Error('No wallet connected.');
            }

            // Create Stargate client
            const client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Parse disputeId to number
            const numericDisputeId = parseInt(disputeId);
            if (isNaN(numericDisputeId) || numericDisputeId <= 0) {
                throw new Error('Invalid dispute ID');
            }

            // Create the claim rewards message
            const msg = {
                typeUrl: '/layer.dispute.MsgClaimDisputeRewards',
                value: {
                    creator: walletStatus.address,
                    disputeId: numericDisputeId
                }
            };

            App.debugLog('Claiming dispute rewards:', {
                creator: msg.value.creator,
                disputeId: msg.value.disputeId
            });

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcastDirect(
                walletStatus.address,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '15000' }],
                    gas: '200000'
                },
                'Claim Dispute Rewards'
            );

            // Hide pending popup
            App.hidePendingPopup();

            if (result && result.code === 0) {
                const txHash = result.txhash || result.tx_response?.txhash;
                App.showSuccessPopup(`Successfully claimed dispute rewards! Transaction: ${txHash}`);
                
                // Reload disputes to update the UI
                setTimeout(() => {
                    if (App.loadAllDisputes) {
                        App.loadAllDisputes();
                    }
                }, 2000);
            } else {
                throw new Error(result.rawLog || 'Transaction failed');
            }
        } catch (error) {
            console.error('Failed to claim dispute rewards:', error);
            App.hidePendingPopup();
            App.showErrorPopup(error.message || 'Failed to claim dispute rewards');
        }
    },

    // Withdraw fee refund
    withdrawFeeRefund: async function(disputeId) {
        try {
            if (!window.disputeProposer) {
                throw new Error('DisputeProposer not initialized');
            }

            // Check wallet connection
            const walletStatus = await window.disputeProposer.getWalletStatus();
            if (!walletStatus.isConnected || !walletStatus.address) {
                throw new Error('Wallet not connected. Please connect your Cosmos wallet.');
            }

            // Show pending popup
            App.showPendingPopup("Withdrawing fee refund...");

            const rpcEndpoint = App.getCosmosRpcEndpoint();

            // Get offline signer
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.keplr) {
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : LAYER_TESTNET_CHAIN_ID;
                offlineSigner = window.keplr.getOfflineSigner(chainId);
            } else {
                throw new Error('No wallet connected.');
            }

            // Create Stargate client
            const client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Parse disputeId to number
            const numericDisputeId = parseInt(disputeId);
            if (isNaN(numericDisputeId) || numericDisputeId <= 0) {
                throw new Error('Invalid dispute ID');
            }

            // Create the withdraw fee refund message
            const msg = {
                typeUrl: '/layer.dispute.MsgWithdrawFeeRefund',
                value: {
                    creator: walletStatus.address,
                    disputeId: numericDisputeId
                }
            };

            App.debugLog('Withdrawing fee refund:', {
                creator: msg.value.creator,
                disputeId: msg.value.disputeId
            });

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcastDirect(
                walletStatus.address,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '15000' }],
                    gas: '200000'
                },
                'Withdraw Fee Refund'
            );

            // Hide pending popup
            App.hidePendingPopup();

            if (result && result.code === 0) {
                const txHash = result.txhash || result.tx_response?.txhash;
                App.showSuccessPopup(`Successfully withdrew fee refund! Transaction: ${txHash}`);
                
                // Reload disputes to update the UI
                setTimeout(() => {
                    if (App.loadAllDisputes) {
                        App.loadAllDisputes();
                    }
                }, 2000);
            } else {
                throw new Error(result.rawLog || 'Transaction failed');
            }
        } catch (error) {
            console.error('Failed to withdraw fee refund:', error);
            App.hidePendingPopup();
            App.showErrorPopup(error.message || 'Failed to withdraw fee refund');
        }
    },

    // Show info message to user
    showInfoMessage: function(message) {
        // You can implement a toast notification here
        // For now, using alert as a simple solution
        alert(message);
    },

    // Load open disputes for dropdown
    loadOpenDisputes: async function() {
    try {
      if (!window.disputeProposer) {
        throw new Error('DisputeProposer not initialized');
      }

      // Check if wallet is connected
      const walletStatus = await window.disputeProposer.getWalletStatus();
      if (!walletStatus.isConnected) {
        const disputeSelect = document.getElementById('voteDisputeId');
        disputeSelect.innerHTML = '<option value="">Please connect your wallet first</option>';
        return;
      }

      // Show loading state
      const disputeSelect = document.getElementById('voteDisputeId');
      disputeSelect.innerHTML = '<option value="">Loading open disputes...</option>';

      // Fetch open disputes with status information
      const openDisputes = await window.disputeProposer.getOpenDisputes();
      
      // Populate dropdown
      disputeSelect.innerHTML = '<option value="">Select a dispute</option>';
      
      if (openDisputes.length === 0) {
        disputeSelect.innerHTML = '<option value="">No open disputes available</option>';
      } else {
        openDisputes.forEach(dispute => {
          const option = document.createElement('option');
          option.value = dispute.id;
          
          // Format fee information
          const feeRequired = (parseInt(dispute.feeRequired) / 1000000).toFixed(2);
          const feePaid = (parseInt(dispute.feePaid) / 1000000).toFixed(2);
          const feeRemaining = (dispute.feeRemaining / 1000000).toFixed(2);
          
          // Add status indicator
          const statusText = dispute.canVote ? ' (Ready to Vote)' : ' (Needs Fee)';
          option.textContent = `Dispute #${dispute.id} (${feePaid}/${feeRequired} TRB)${statusText}`;
          option.dataset.disputeInfo = JSON.stringify(dispute);
          disputeSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to load open disputes:', error);
      const disputeSelect = document.getElementById('voteDisputeId');
      disputeSelect.innerHTML = '<option value="">Error loading disputes</option>';
    }
  },

  // Add fee to dispute
  addFeeToDispute: async function() {
    try {
      if (!window.disputeProposer) {
        throw new Error('DisputeProposer not initialized');
      }

      // Get form values
      const disputeId = parseInt(document.getElementById('addFeeDisputeId').value);
      const amount = document.getElementById('addFeeAmount').value;
      const payFromBond = document.getElementById('addFeePayFromBond').checked;

      // Validate inputs
      if (!disputeId || disputeId <= 0) {
        throw new Error('Please enter a valid dispute ID');
      }
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Get dispute information to check if user is the disputed reporter
      const disputeInfo = await window.disputeProposer.getDisputeInfo(disputeId);
      const metadata = disputeInfo.metadata;
      
      if (!metadata) {
        throw new Error('Could not retrieve dispute information');
      }

      // Check if user is the disputed reporter
      const userAddress = window.disputeProposer.currentAddress;
      const disputedReporter = metadata.initial_evidence?.reporter;
      
      if (userAddress && disputedReporter && userAddress === disputedReporter && payFromBond) {
        throw new Error('Disputed reporters cannot add fees from bond. Please uncheck "Pay from bond" or use a different wallet.');
      }

      // Show pending popup
      App.showPendingPopup("Adding fee to dispute...");

      // Add fee to dispute
      const result = await window.disputeProposer.addFeeToDispute(disputeId, amount, payFromBond);
      
      // Hide pending popup
      App.hidePendingPopup();
      
      if (result.success) {
        // Show success popup with transaction hash and block explorer link
        App.showSuccessPopup("Fee added to dispute successfully!", result.transactionHash, 'cosmos');
        
        // Clear form
        document.getElementById('addFeeDisputeId').value = '';
        document.getElementById('addFeeAmount').value = '';
        document.getElementById('addFeePayFromBond').checked = false;
      } else {
        throw new Error('Failed to add fee to dispute');
      }
    } catch (error) {
      console.error('Failed to add fee to dispute:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to add fee to dispute');
    }
  },

  // Vote on a dispute
  voteOnDispute: async function() {
    try {
      if (!window.disputeProposer) {
        throw new Error('DisputeProposer not initialized');
      }

      // Get form values
      const disputeId = parseInt(document.getElementById('voteDisputeId').value);
      const voteChoice = document.getElementById('voteChoice').value;

      // Validate inputs
      if (!disputeId || disputeId <= 0) {
        throw new Error('Please enter a valid dispute ID');
      }
      if (!voteChoice) {
        throw new Error('Please select a vote choice');
      }

      // Get dispute information to check status
      const disputeInfo = await window.disputeProposer.getDisputeInfo(disputeId);
      const metadata = disputeInfo.metadata;
      
      if (!metadata) {
        throw new Error('Could not retrieve dispute information');
      }

      // Check if dispute is in voting state
      if (metadata.dispute_status !== 'DISPUTE_STATUS_VOTING') {
        const status = metadata.dispute_status || 'Unknown';
        const feeRequired = (parseInt(metadata.dispute_fee) / 1000000).toFixed(2);
        const feePaid = (parseInt(metadata.fee_total) / 1000000).toFixed(2);
        const feeRemaining = ((parseInt(metadata.dispute_fee) - parseInt(metadata.fee_total)) / 1000000).toFixed(2);
        
        throw new Error(`Dispute is not in voting state. Current status: ${status}. Fee required: ${feeRequired} TRB, Fee paid: ${feePaid} TRB, Fee remaining: ${feeRemaining} TRB. Please add the remaining fee first.`);
      }

      // Validate inputs using dispute module
      if (!window.disputeProposer.validateDisputeId(disputeId)) {
        throw new Error('Invalid dispute ID format');
      }
      if (!window.disputeProposer.validateVoteChoice(voteChoice)) {
        throw new Error('Invalid vote choice');
      }

      // Show pending popup
      App.showPendingPopup("Submitting vote...");

      // Submit the vote
      const result = await window.disputeProposer.voteOnDispute(disputeId, voteChoice);
      
      // Hide pending popup
      App.hidePendingPopup();
      
      if (result.success) {
        // Show success popup with transaction hash and block explorer link
        App.showSuccessPopup("Vote submitted successfully!", result.transactionHash, 'cosmos');
        
        // Clear form
        document.getElementById('voteDisputeId').value = '';
        document.getElementById('voteChoice').value = '';
      } else {
        throw new Error('Failed to submit vote');
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to submit vote');
    }
  },

  // Get dispute information
  getDisputeInfo: async function() {
    try {
      if (!window.disputeProposer) {
        throw new Error('DisputeProposer not initialized');
      }

      const disputeId = parseInt(document.getElementById('queryDisputeId').value.trim());
      
      if (!disputeId || disputeId <= 0) {
        throw new Error('Please enter a valid dispute ID');
      }

      // Show pending popup
      App.showPendingPopup("Fetching dispute information...");

      // Get dispute info
      const disputeInfo = await window.disputeProposer.getDisputeInfo(disputeId);
      const votingInfo = await window.disputeProposer.getVotingInfo(disputeId);
      const hasVoted = await window.disputeProposer.hasVoted(disputeId);
      
      // Hide pending popup
      App.hidePendingPopup();
      
      // Display results
      const resultDiv = document.getElementById('disputeQueryResult');
      resultDiv.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Dispute #${disputeId}</h3>
        <div class="bg-gray-100 p-3 rounded mb-3">
          <pre class="text-sm">${JSON.stringify(disputeInfo, null, 2)}</pre>
        </div>
        <h4 class="text-md font-semibold mb-2">Voting Information</h4>
        <div class="bg-gray-100 p-3 rounded mb-3">
          <pre class="text-sm">${JSON.stringify(votingInfo, null, 2)}</pre>
        </div>
        <h4 class="text-md font-semibold mb-2">Your Voting Status</h4>
        <div class="bg-gray-100 p-3 rounded">
          <pre class="text-sm">${JSON.stringify(hasVoted, null, 2)}</pre>
        </div>
      `;
      
    } catch (error) {
      console.error('Failed to get dispute info:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to get dispute information');
    }
  },


};

// Export App to window object for global access
window.App = App;
window.App.claimWithdrawal = App.claimWithdrawal;  // Explicitly expose claimWithdrawal
window.App.claimExtraWithdraw = App.claimExtraWithdraw;
window.App.requestAttestation = App.requestAttestation;  // Also explicitly expose requestAttestation
window.App.proposeDispute = App.proposeDispute;  // Expose dispute function
  window.App.voteOnDispute = App.voteOnDispute;  // Expose dispute voting function
  window.App.loadOpenDisputes = App.loadOpenDisputes;  // Expose load open disputes function
  window.App.refreshDisputesOnWalletConnect = App.refreshDisputesOnWalletConnect;  // Expose refresh disputes function
  window.App.addFeeToDispute = App.addFeeToDispute;  // Expose add fee to dispute function
  window.App.checkVotingPower = App.checkVotingPower;  // Expose voting power check function
  window.App.loadAllDisputes = App.loadAllDisputes;  // Expose load all disputes function
window.App.getDisputeInfo = App.getDisputeInfo;  // Expose dispute query function

// Global function to hide TRB price tooltip
window.hideTrbPriceTooltip = function() {
    const trbPriceTooltip = document.querySelector('.trb-price-tooltip');
    if (trbPriceTooltip) {
        trbPriceTooltip.style.display = 'none';
        trbPriceTooltip.style.visibility = 'hidden';
        trbPriceTooltip.style.opacity = '0';
        trbPriceTooltip.style.transform = 'scale(0.95)';
        trbPriceTooltip.textContent = '';
        trbPriceTooltip.style.pointerEvents = 'none';
        trbPriceTooltip.style.left = '-9999px';
        trbPriceTooltip.style.top = '-9999px';
        trbPriceTooltip.style.zIndex = '-1';
    }
    
    // Also try to hide any other tooltips that might exist
    const allTooltips = document.querySelectorAll('.trb-price-tooltip');
    allTooltips.forEach(t => {
        t.style.display = 'none';
        t.style.visibility = 'hidden';
        t.style.opacity = '0';
        t.style.transform = 'scale(0.95)';
        t.style.left = '-9999px';
        t.style.top = '-9999px';
        t.style.zIndex = '-1';
    });
};



// Global function to reset TRB price tooltip
window.resetTrbPriceTooltip = function() {
    const trbPriceTooltip = document.querySelector('.trb-price-tooltip');
    if (trbPriceTooltip) {
        trbPriceTooltip.style.display = 'none';
        trbPriceTooltip.style.visibility = 'hidden';
        trbPriceTooltip.textContent = '';
    }
};


// Export App as default for module usage
export default App;

function checkWalletConnection() {
    if (!App.isConnected) {
        alert("Please connect your wallet first");
        return false;
    }
    if (!App.ensureSupportedEthereumNetwork()) {
        return false;
    }
    return true;
}

$(function () {
    $(window).load(function () {
        try {
            // Initialize app
            App.init().catch(error => {
                // console.error(...);
                App.handleError(error);
            });
            
            // Initialize withdrawal button functionality
            setTimeout(() => {
                const withdrawButton = document.getElementById('withdrawButton');
                if (withdrawButton) {
                    // Force enable the withdrawal button for Bridge to Ethereum section
                    withdrawButton.disabled = false;
                }
                
                // Set up periodic check to ensure withdrawal button stays enabled
                setInterval(() => {
                    const withdrawButton = document.getElementById('withdrawButton');
                    if (withdrawButton && withdrawButton.disabled) {
                        withdrawButton.disabled = false;
                    }
                }, 2000); // Check every 2 seconds
            }, 1000); // Wait 1 second for App.init to complete
            
        } catch (error) {
            // console.error(...);
            // Show user-friendly error message but keep button enabled
            const walletButton = document.getElementById("walletButton");
            if (walletButton) {
                walletButton.textContent = 'Connect Wallet';
                walletButton.disabled = false;
            }
        }
    });
});

// Fallback initialization for wallet manager dropdown
$(document).ready(function() {
    setTimeout(() => {
        if (window.App && window.App.initWalletManagerDropdown) {
            window.App.initWalletManagerDropdown();
        }
    }, 3000);
});

$(document).ready(function() {
    const depositButton = document.getElementById('depositButton');
    if (depositButton) {
        depositButton.disabled = true;
    }
    

});

async function checkBalance(amount) {
  if (!App.contracts.Token || !App.account) return true;
  
  try {
    const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
    const amountWei = App.web3.utils.toWei(amount.toString(), 'ether');
    
    if (App.web3.utils.toBN(amountWei).gt(App.web3.utils.toBN(balance))) {
      const readableBalance = App.web3.utils.fromWei(balance, 'ether');
      App.showBalanceErrorPopup(`Insufficient balance. You have ${readableBalance} TRB but trying to deposit ${amount} TRB`);
      return false;
    }
    return true;
  } catch (error) {
    // console.error(...);
    return false;
  }
}

const SUPPORTED_CHAIN_IDS = {
    11155111: 'Sepolia',
    1: 'Ethereum Mainnet'
};

function validateChainId(chainId) {
    if (!chainId || !SUPPORTED_CHAIN_IDS[chainId]) {
        throw new Error(`Please connect to Sepolia (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1).`);
    }
    return true;
}