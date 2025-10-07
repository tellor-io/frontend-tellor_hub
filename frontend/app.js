import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';
import { 
    generateWithdrawalQueryId
} from './js/bridgeContract.js';

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

  _depositLimit: function() {
    return App.depositLimit;
  },

  init: function () {
    return new Promise((resolve, reject) => {
      try {
        // Initialize ethers
        App.ethers = ethers;
        
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
            App.initNoStakeReporting(); // Initialize no-stake reporting
        App.initDisputeProposer(); // Initialize dispute proposer
        
        // Add wallet connection listener for dispute refresh
        document.addEventListener('walletConnected', () => {
            if (window.App && window.App.refreshDisputesOnWalletConnect) {
                window.App.refreshDisputesOnWalletConnect();
            }
        });
            
            // Initialize network display
            App.updateNetworkDisplay();
            App.updateCosmosNetworkDisplay();
            
            // Initialize withdrawal history table
            App.updateWithdrawalHistory();
            
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
            reject(error);
          });
      } catch (error) {
        // console.error(...);
        reject(error);
      }
    });
  },

  initWeb3: function () {
    return new Promise((resolve, reject) => {
      try {
        // Check for Ethereum wallet adapter
        const hasEthereumAdapter = typeof window.ethereumWalletAdapter !== 'undefined';
        const hasKeplr = typeof window.keplr !== 'undefined';
        
        // Handle Ethereum wallets
        if (hasEthereumAdapter) {
          // Use wallet adapter for Ethereum wallets
          const availableWallets = window.ethereumWalletAdapter.detectWallets();
          
          if (availableWallets.length > 0) {
            // Enable Ethereum wallet buttons
            const walletButton = document.getElementById("walletButton");
            
            if (walletButton) {
              walletButton.disabled = false;
              walletButton.innerHTML = 'Connect Ethereum Wallet';
            }
          }
        } else {
          // Fallback to direct MetaMask detection
          const hasMetaMask = typeof window.ethereum !== 'undefined';
          
          if (hasMetaMask) {
            App.web3Provider = window.ethereum;
            App.web3 = new Web3(window.ethereum);
            
            // Set up event listeners
            const handleDisconnect = () => {
              App.disconnectMetaMask();
            };

                const handleChainChanged = () => {
      // Prevent automatic page reload to avoid hosting issues
      // window.location.reload();
      App.handleError(new Error('Network changed. Please refresh manually if needed.'));
      
      // Update network display
      if (App.updateNetworkDisplay) {
        App.updateNetworkDisplay();
      }
    };

            const handleAccountsChanged = (accounts) => {
              App.handleAccountsChanged(accounts);
            };

            // Remove existing listeners if any
            if(App.web3Provider) {
              window.ethereum.removeListener('disconnect', handleDisconnect);
              window.ethereum.removeListener('chainChanged', handleChainChanged);
              window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
            
            // Add new listeners
            window.ethereum.on('disconnect', handleDisconnect);
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('accountsChanged', handleAccountsChanged);

            // Enable MetaMask buttons
            const walletButton = document.getElementById("walletButton");
            if (walletButton) walletButton.disabled = false;
          }
        }
        
        // Handle Cosmos wallets
        const hasCosmosWallet = hasKeplr || 
                               typeof window.cosmostation !== 'undefined' || 
                               typeof window.leap !== 'undefined' || 
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
        
        // Always try to switch to Sepolia first (preferred for testing)
        if (App.chainId !== 11155111) {
            // console.log(...);
            try {
                // Try to switch to Sepolia first (preferred for testing)
                await window.ethereumWalletAdapter.switchChain(11155111);
                App.chainId = 11155111;
                // console.log(...);
            } catch (switchError) {
                // If switching to Sepolia fails, check if we're on mainnet
                if (App.chainId === 1) {
                    // User is on mainnet, ask if they want to stay or switch
                    const userChoice = confirm('You are connected to Ethereum Mainnet. Would you like to switch to Sepolia Testnet for testing? Click OK to switch to Sepolia, or Cancel to stay on Mainnet.');
                    if (userChoice) {
                        // User wants to switch to Sepolia, try again
                        try {
                            await window.ethereumWalletAdapter.switchChain(11155111);
                            App.chainId = 11155111;
                        } catch (secondSwitchError) {
                            alert('Failed to switch to Sepolia. Please manually switch to Sepolia testnet (chain ID: 11155111) in your wallet.');
                            throw new Error('Failed to switch to Sepolia network');
                        }
                    }
                    // If user cancels, they stay on mainnet
                } else {
                    // User is on an unsupported network
                    alert('Please manually switch to Sepolia testnet (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1) in your wallet and try again.');
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
        
        // Keep dropdown open after wallet connection
        App.keepWalletDropdownOpen();
        
        // Update balances and limits
        await Promise.all([
            App.updateBalance(),
            App.fetchDepositLimit()
        ]);
        
        App.setPageParams();
        
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
    console.log('App state:', {
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
        // console.log(...);
        
        // Always try to switch to Sepolia first (preferred for testing)
        if (chainId !== 11155111) {
            // console.log(...);
            try {
                // Try to switch to Sepolia first (preferred for testing)
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
                });
                
                // Verify the switch worked
                chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                    chainId = parseInt(chainId, 16);
                }
                App.chainId = chainId;
                // console.log(...);
                
            } catch (switchError) {
                // console.log(...);
                
                // If switching to Sepolia fails, check if we're on mainnet
                if (chainId === 1) {
                    // User is on mainnet, ask if they want to stay or switch
                    const userChoice = confirm('You are connected to Ethereum Mainnet. Would you like to switch to Sepolia Testnet for testing? Click OK to switch to Sepolia, or Cancel to stay on Mainnet.');
                    if (userChoice) {
                        // User wants to switch to Sepolia, try again
                        try {
                            await window.ethereum.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
                            });
                            
                            // Verify the switch worked
                            chainId = await window.ethereum.request({ method: 'eth_chainId' });
                            if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                                chainId = parseInt(chainId, 16);
                            }
                            App.chainId = chainId;
                        } catch (secondSwitchError) {
                            alert('Failed to switch to Sepolia. Please manually switch to Sepolia testnet (chain ID: 11155111) in your wallet.');
                            throw new Error('Failed to switch to Sepolia network');
                        }
                    }
                    // If user cancels, they stay on mainnet
                } else {
                    // If the network doesn't exist (error code 4902), add it
                    if (switchError.code === 4902) {
                        try {
                            // console.log(...);
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0xaa36a7', // 11155111 in hex
                                    chainName: 'Sepolia',
                                    nativeCurrency: {
                                        name: 'Sepolia Ether',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                                }]
                            });
                            
                            // Verify the add worked
                            chainId = await window.ethereum.request({ method: 'eth_chainId' });
                            if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                                chainId = parseInt(chainId, 16);
                            }
                            App.chainId = chainId;
                            // console.log(...);
                            
                        } catch (addError) {
                            // console.error(...);
                            alert('Please manually add Sepolia testnet (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1) to MetaMask and try again.');
                            throw new Error('Failed to add supported network to MetaMask');
                        }
                    } else {
                        // console.error(...);
                        alert('Please manually switch to Sepolia testnet (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1) in MetaMask and try again.');
                        throw new Error('Failed to switch to supported network');
                    }
                }
            }
        }
        
        // Validate chain ID
        try {
            validateChainId(chainId);
        } catch (error) {
            // console.error(...);
            // console.error(...);
            // console.error(...);
            alert('Please connect to Sepolia (chain ID: 11155111) or Ethereum Mainnet (chain ID: 1).');
            throw error;
        }
        
        // Set account and connection state
        App.account = accounts[0];
        App.isConnected = true;
        
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
        
        // Keep dropdown open after wallet connection
        App.keepWalletDropdownOpen();

        
        // Update balances and limits
        await Promise.all([
            App.updateBalance(),
            App.fetchDepositLimit()
        ]);
        
        App.setPageParams();
        
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
            App.cosmosChainId = 'layertest-4'; // Default to testnet
        }
        
        // Try to detect the current network from the wallet adapter
        try {
            const currentChainId = await window.cosmosWalletAdapter.getChainId();
            if (currentChainId === 'tellor-1') {
                App.cosmosChainId = 'tellor-1';
            } else if (currentChainId === 'layertest-4') {
                App.cosmosChainId = 'layertest-4';
            }
        } catch (error) {
            console.log('Could not detect current network from wallet adapter, using default');
        }
        
        // Connect to the selected wallet
        const connectionResult = await window.cosmosWalletAdapter.connectToWallet(walletType);
        
        // Cache the wallet type for future reconnections
        App.cachedCosmosWalletType = walletType;
        
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
        
        // Keep dropdown open after wallet connection
        App.keepWalletDropdownOpen();
        
        // Update balance immediately after connection
        await App.updateKeplrBalance();
        
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
            // Refresh validator dropdown when connecting in delegate section
            await App.populateValidatorDropdown();
            await App.populateReporterDropdown();
            await App.refreshCurrentStatus();
        } else {
            // If not in delegate section, still populate validators for when user switches to delegate
            await App.populateValidatorDropdown();
            await App.populateReporterDropdown();
            await App.refreshCurrentStatus();
        }
        
        App.setPageParams();
        
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
            App.cosmosChainId = 'layertest-4'; // Default to testnet
        }
        
        // Get the appropriate endpoints based on current Cosmos network
        let rpcUrl, restUrl, chainName;
        if (App.cosmosChainId === 'tellor-1') {
            rpcUrl = "https://mainnet.tellorlayer.com/rpc";
            restUrl = "https://mainnet.tellorlayer.com/rpc";
            chainName = "Tellor Layer";
        } else {
            rpcUrl = "https://node-palmito.tellorlayer.com/rpc";
            restUrl = "https://node-palmito.tellorlayer.com/rpc";
            chainName = "Tellor Layer Testnet";
        }

        // Try to detect the current network from Keplr
        try {
            const currentChainId = await window.keplr.getChainId();
            if (currentChainId === 'tellor-1') {
                App.cosmosChainId = 'tellor-1';
                rpcUrl = "https://mainnet.tellorlayer.com/rpc";
                restUrl = "https://mainnet.tellorlayer.com/rpc";
                chainName = "Tellor Layer";
            } else if (currentChainId === 'layertest-4') {
                App.cosmosChainId = 'layertest-4';
                rpcUrl = "https://node-palmito.tellorlayer.com/rpc";
                restUrl = "https://node-palmito.tellorlayer.com/rpc";
                chainName = "Tellor Layer Testnet";
            }
        } catch (error) {
            console.log('Could not detect current network from Keplr, using default');
        }

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
        
        // Update button text
        const truncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
        const keplrButton = document.getElementById('keplrButton');
        if (keplrButton) {
            keplrButton.innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();
        
        // Keep dropdown open after wallet connection
        App.keepWalletDropdownOpen();
        
        // Update balance immediately after connection
        await App.updateKeplrBalance();
        
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
            // Refresh validator dropdown when connecting in delegate section
            await App.populateValidatorDropdown();
            await App.populateReporterDropdown();
            await App.refreshCurrentStatus();
        } else {
            // If not in delegate section, still populate validators for when user switches to delegate
            await App.populateValidatorDropdown();
            await App.populateReporterDropdown();
            await App.refreshCurrentStatus();
        }
        
        App.setPageParams();
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

        // Disable action buttons
        const withdrawButton = document.getElementById('withdrawButton');
        const delegateButton = document.getElementById('delegateButton');
        if (withdrawButton) {
            withdrawButton.disabled = true;
        }
        if (delegateButton) {
            delegateButton.disabled = true;
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
            throw new Error("No accounts found");
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
        
        if (!SUPPORTED_CHAIN_IDS[chainId]) {
            App.showNetworkAlert();
            await App.disconnectWallet();
            throw new Error(`Unsupported network: ${chainId}`);
        }
        
        // Initialize contracts sequentially to ensure proper setup
        await App.initBridgeContract();
        await App.initTokenContract();
        
        // Only proceed with these calls if contracts are properly initialized
        if (App.contracts.Bridge && App.contracts.Token) {
            await Promise.all([
                App.fetchDepositLimit(),
                App.updateBalance()
            ]);
        }
        
        App.isConnected = true;
        
        // Update the wallet button
        document.getElementById('walletButton').innerHTML = `Disconnect <span class="truncated-address">(${truncatedAddress})</span>`;
        
        // Update wallet manager toggle text
        App.updateWalletManagerToggleText();
        
        // Keep dropdown open after account change
        App.keepWalletDropdownOpen();
        
        App.setPageParams();
        this.updateUIForCurrentDirection();
        
        // Update network compatibility warning
        App.updateNetworkCompatibilityWarning();
    } catch (error) {
        // console.error(...);
        App.handleError(error);
        await App.disconnectWallet();
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

        const response = await fetch("./abis/TokenBridge.json");
        if (!response.ok) {
            throw new Error(`Failed to load ABI: ${response.statusText}`);
        }
        
        const data = await response.json();
        const abi = data.abi || data;
        
        if (!Array.isArray(abi)) {
            throw new Error("Invalid ABI format");
        }

        App.contracts.Bridge = new App.web3.eth.Contract(abi);
        
        const contractAddresses = {
            11155111: "0x62733e63499a25E35844c91275d4c3bdb159D29d", // Sepolia
            1: "0x5589e306b1920F009979a50B88caE32aecD471E4",        // Mainnet
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
    } else {
      return 'https://node-palmito.tellorlayer.com';
    }
  },

  // Get the appropriate Cosmos API endpoint based on current Cosmos network
  getCosmosApiEndpoint: function() {
    if (App.cosmosChainId === 'tellor-1') {
      return 'https://mainnet.tellorlayer.com';
    } else {
      return 'https://node-palmito.tellorlayer.com';
    }
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
        if (toggleText) toggleText.textContent = 'Switch to Sepolia';
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
      } else if (App.cosmosChainId === 'layertest-4') {
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

  // Switch Cosmos network function
  switchCosmosNetwork: async function() {
    if (!App.isKeplrConnected) {
      alert('Please connect your Cosmos wallet first');
      return;
    }

    // Show confirmation dialog
    const targetNetwork = App.cosmosChainId === 'tellor-1' ? 'testnet' : 'mainnet';
    const currentNetwork = App.cosmosChainId === 'tellor-1' ? 'mainnet' : 'testnet';
    
    const message = `Switching from ${currentNetwork} to ${targetNetwork} requires reconnecting your wallet. Do you want to continue?`;
    
         App.showConfirmationModal(message, async () => {
       // User confirmed - proceed with network switch
       const cosmosToggleButton = document.getElementById('cosmos-network-toggle-btn');
       if (cosmosToggleButton) {
         cosmosToggleButton.disabled = true;
         cosmosToggleButton.textContent = 'Switching...';
       }

    try {
      let targetChainId;
      if (App.cosmosChainId === 'tellor-1') {
        // Currently on mainnet, switch to testnet
        targetChainId = 'layertest-4';
      } else if (App.cosmosChainId === 'layertest-4') {
        // Currently on testnet, switch to mainnet
        targetChainId = 'tellor-1';
      } else {
        App.showValidationErrorPopup('Cannot switch from unsupported Cosmos network');
        return;
      }

      // Disconnect current Cosmos connection
      await App.disconnectKeplr();
      
      // Update App state
      App.cosmosChainId = targetChainId;
      
      // Update UI
      App.updateCosmosNetworkDisplay();
      
      // Reconnect with new network using cached wallet type if available
      if (App.cachedCosmosWalletType && window.cosmosWalletAdapter) {
        // Use the wallet adapter with cached wallet type
        await App.connectCosmosWallet(App.cachedCosmosWalletType);
      } else {
        // Fall back to legacy Keplr connection
        await App.connectKeplr();
      }
      
      // Always refresh validator dropdown when switching networks
      try {
        await App.populateValidatorDropdown(true); // true = isNetworkSwitch
        await App.populateReporterDropdown(true); // true = isNetworkSwitch
        await App.refreshCurrentStatus();
        console.log('Validator and reporter dropdowns refreshed after network switch');
      } catch (error) {
        console.error('Failed to refresh dropdowns after network switch:', error);
      }
      
      // Update balance for the new network after a small delay to ensure wallet is ready
      setTimeout(async () => {
        try {
          await App.updateKeplrBalance();
        } catch (error) {
          console.error('Error updating balance after network switch:', error);
        }
      }, 1000);
      
      // Re-enable the toggle button
      if (cosmosToggleButton) {
        cosmosToggleButton.disabled = false;
        cosmosToggleButton.textContent = 'Switch to Mainnet';
      }
      
    } catch (error) {
      // console.error('Error switching Cosmos network:', error);
      App.handleError(error);
    } finally {
      if (cosmosToggleButton) {
        cosmosToggleButton.disabled = false;
        cosmosToggleButton.textContent = 'Switch to Palmito (test)';
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
        App.fetchDepositLimit()
      ]);
      
      // Update UI
      App.updateNetworkDisplay();
      App.setPageParams();
      
      console.log(`Successfully switched to ${targetChainId === 1 ? 'Mainnet' : 'Sepolia'}`);
      
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

  setPageParams: function() {
    // Update connected address in UI
    const connectedAddressElement = document.getElementById("connectedAddress");
    if (connectedAddressElement) {
      connectedAddressElement.textContent = App.account;
    }

    // Update balances and limits based on current direction and wallet type
    if (App.currentBridgeDirection === 'layer') {
      // For Layer section
      if (App.contracts.Bridge && App.contracts.Token) {
        document.getElementById('approveButton').disabled = false;
        document.getElementById('depositButton').disabled = false;
        // Always fetch deposit limit in Layer section
        App.fetchDepositLimit().catch(error => {
          // console.error(...);
        });
      }
      // Update MetaMask balance if connected
      if (App.isConnected) {
        App.updateBalance().catch(error => {
          // console.error(...);
        });
      }
    } else {
      // For Ethereum section
      if (App.isConnected) {
        // Update MetaMask balance
        App.updateBalance().catch(error => {
          // console.error(...);
        });
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

        // Get the appropriate RPC endpoint based on current Cosmos network
        let rpcEndpoint;
        if (App.cosmosChainId === 'tellor-1') {
            rpcEndpoint = 'https://mainnet.tellorlayer.com/rpc';
        } else {
            rpcEndpoint = 'https://node-palmito.tellorlayer.com/rpc';
        }


        
        // Force a fresh connection by using a new client each time
        const signingClient = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            rpcEndpoint,
            offlineSigner,
            {
                gasPrice: "0.025loya"
            }
        );


        
        // Use REST API directly to get the correct balance for the current network
        let balanceAmount = 0;
        try {
            const restUrl = rpcEndpoint.replace('/rpc', '');
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
        explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
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

    let trbPrice = 0;
    // Fetch TRB price from CoinGecko API
    async function updateTrbPrice() {
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
      } catch (error) {
        // console.warn(...);
        trbPrice = 0.5; // Default value in USD
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
        console.log('updateTooltip called:', { amount, shouldBeVisible: shouldTooltipBeVisible(), activeInput: activeInput.id });
        
        if (amount > 0 && shouldTooltipBeVisible()) {
            if (trbPrice === 0) {
                await updateTrbPrice();
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

    // Update price every 60 seconds, but only if the page is visible
    let priceUpdateInterval;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(priceUpdateInterval);
      } else {
    updateTrbPrice();
        // Reduce polling frequency to avoid hosting issues
        priceUpdateInterval = setInterval(updateTrbPrice, 300000); // 5 minutes instead of 1 minute
      }
    });

    // Initial price fetch
    updateTrbPrice().catch(error => {
      // // console.warn(...);
    });
    // Reduce polling frequency to avoid hosting issues
    priceUpdateInterval = setInterval(updateTrbPrice, 300000); // 5 minutes instead of 1 minute
    
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
            if (activeSection && activeSection.id === 'noStakeReportSection') {
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
                    if (functionType !== 'noStakeReport') {
                        // Double-check that tooltip is hidden
                        enhancedHideTooltip();
                    }
                }, 50);
                
                // Only hide tooltip when going to No-Stake Report (which has no TRB inputs)
                if (functionType === 'noStakeReport') {
                    // Tooltip is already hidden, no need to do anything else
                } else {
                    // For other sections, check if there's a value in the current input and show tooltip if appropriate
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

        // Validate network compatibility for withdrawal
        if (App.isConnected && App.isKeplrConnected) {
            const isEthereumMainnet = App.chainId === 1;
            const isCosmosMainnet = App.cosmosChainId === 'tellor-1';
            
            if (isEthereumMainnet !== isCosmosMainnet) {
                const ethereumNetwork = isEthereumMainnet ? 'Ethereum Mainnet' : 'Sepolia Testnet';
                const cosmosNetwork = isCosmosMainnet ? 'Tellor Mainnet' : 'Tellor Testnet';
                
                App.showValidationErrorPopup(
                    `Network mismatch detected!\n\n` +
                    `Ethereum Wallet: ${ethereumNetwork}\n` +
                    `Cosmos Wallet: ${cosmosNetwork}\n\n` +
                    `Both wallets must be on the same network type (both mainnet or both testnet).\n\n` +
                    `Please switch one of your wallets to match the other network.`
                );
                return;
            }
        }

        const amount = document.getElementById('ethStakeAmount').value;
        const ethereumAddress = document.getElementById('ethQueryId').value;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            App.showValidationErrorPopup('Please enter a valid amount');
            return;
        }

        if (!ethereumAddress || !ethereumAddress.startsWith('0x')) {
            App.showValidationErrorPopup('Please enter a valid Ethereum address');
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

        // Get the appropriate RPC endpoint based on current Cosmos network
        let rpcEndpoint;
        if (App.cosmosChainId === 'tellor-1') {
            rpcEndpoint = 'https://mainnet.tellorlayer.com';
        } else {
            rpcEndpoint = 'https://node-palmito.tellorlayer.com';
        }

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
                recipient: ethereumAddress.toLowerCase().replace('0x', ''), // Remove 0x prefix for Layer chain
                amount: {
                    denom: 'loya',
                    amount: amountInMicroUnits
                }
            }
        };

        App.showPendingPopup("Withdrawal transaction pending...");

        // Sign and broadcast using direct signing
        // console.log(...);
        console.log('Message details:', {
            creator: msg.value.creator,
            recipient: msg.value.recipient,
            amount: msg.value.amount,
            amountInMicroUnits: amountInMicroUnits,
            originalAmount: amount,
            ethereumAddress: ethereumAddress
        });
        
        // Compare with successful transaction format
        console.log('Expected format (from successful tx):', {
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
            
            console.log('Attempting to extract transaction hash from:', {
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
                        console.log('Transaction error details:', {
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
            App.showSuccessPopup("Withdrawal successful! You will need to wait 12 hours before you can claim your tokens on Ethereum.", txHash, 'cosmos');
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
  getWithdrawalHistory: async function() {
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

        // Create arrays for withdrawal data and claim status promises
        const withdrawalPromises = [];
        const claimStatusPromises = [];

        // Create promises for all withdrawals
        for (let id = 1; id <= lastWithdrawalId; id++) {
            const queryId = generateWithdrawalQueryId(id);
            withdrawalPromises.push(this.fetchWithdrawalData(queryId));
            // Use contract's withdrawClaimed function instead of API endpoint
            claimStatusPromises.push(
                App.contracts.Bridge.methods.withdrawClaimed(id).call()
                    .then(claimed => ({ claimed }))
                    .catch(() => ({ claimed: false }))
            );
        }

        // Process all withdrawals in parallel
        const [withdrawalResults, claimStatuses] = await Promise.all([
            Promise.all(withdrawalPromises),
            Promise.all(claimStatusPromises)
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

                // For EVM wallet, match sender address. For Keplr, match recipient address
                if ((isEvmWallet && cleanSender === cleanAddress) ||
                    (!isEvmWallet && cleanRecipient === cleanAddress)) {
                    return {
                        id,
                        sender: parsedData.sender,
                        recipient: parsedData.recipient,
                        amount: parsedData.amount.toString(),
                        timestamp: withdrawalData.raw.timestamp,
                        claimed: claimStatuses[index]?.claimed || false
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
  updateWithdrawalHistory: async function() {
    try {
        const transactions = await this.getWithdrawalHistory();

        const tableBody = document.querySelector('#withdrawal-history tbody');
        if (!tableBody) {
            // console.error(...);
            return;
        }

        // Add table styles
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
        `;
        document.head.appendChild(style);

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
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 40px 20px; text-align: center; border: none;">
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">
                                No Withdrawal Transactions Found
                            </h4>
                            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">
                                No withdrawal transactions found for your connected wallet.
                            </p>
                            <p style="margin: 0; color: #718096; font-size: 14px;">
                                If you've made withdrawals from Tellor Layer, they will appear here once processed.
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
                
                // Determine button states based on connection status
                const attestButtonDisabled = !App.isKeplrConnected;
                const attestButtonClass = attestButtonDisabled ? 'attest-button disconnected' : 'attest-button';
                const attestButtonStyle = attestButtonDisabled ? 
                    'background-color: #cbd5e0; color: #718096; border: none;' : 
                    'background-color: #003734; color: #eefffb; border: none;';
                
                row.innerHTML = `
                    <td style="white-space: normal;">
                        ${!tx.claimed ? 
                            `<button class="${attestButtonClass}" onclick="App.requestAttestation(${tx.id})" 
                                style="${attestButtonStyle}" ${attestButtonDisabled ? 'disabled' : ''}>
                                <span class="tooltip-container">
                                    <span>2. Request</span><span>Attestation</span>
                                    <span class="tooltip-icon tooltip-icon-white">?</span>
                                    <span class="tooltip-text tooltip-text-right">Uses Cosmos Wallet. Must wait 12 hours after withdrawal request (step 1) is made before you can request Attestation(step 2)</span>
                                </span>
                            </button>
                            <button class="claim-button" onclick="App.claimWithdrawal(${tx.id})" 
                                style="background-color: #38a169; color: #eefffb; border: none;">
                                <span class="tooltip-container">
                                    <span>3. Claim</span><span>Withdrawal</span>
                                    <span class="tooltip-icon tooltip-icon-white">?</span>
                                    <span class="tooltip-text tooltip-text-right">Uses Ethereum Wallet. Must claim withdrawal(step 3) within 12 hours after Attestation request(step 2) is made. Otherwise you must re-request attestation</span>
                                </span>
                            </button>` 
                            : ''}
                    </td>
                    <td style="font-weight: 500;">${tx.id}</td>
                    <td class="address-cell" title="${tx.sender}">${this.formatAddress(tx.sender)}</td>
                    <td class="address-cell" title="${tx.recipient}">${this.formatAddress(tx.recipient)}</td>
                    <td class="amount-column">${amount.toFixed(2)} TRB</td>
                    <td>${date}</td>
                    <td class="status-${tx.claimed}">${tx.claimed ? 'Claimed' : 'Pending'}</td>
                `;
                tableBody.appendChild(row);
            } catch (error) {
                // console.error(...);
            }
        }
    } catch (error) {
        // console.error(...);
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
        const stakeAmount = document.getElementById('reporterStakeAmount').value;

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

        // Validate stake amount (required for reporter selection)
        if (!stakeAmount || !stakeAmount.trim()) {
            App.showValidationErrorPopup('Please enter a TRB amount for reporter selection');
            return;
        }
        
        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) {
            App.showValidationErrorPopup('Please enter a valid TRB amount (greater than 0)');
            return;
        }

        // Disable the button during processing
        const selectReporterButton = document.getElementById('selectReporterButton');
        if (selectReporterButton) {
            selectReporterButton.disabled = true;
            selectReporterButton.innerHTML = 'Selecting...';
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

        // Call the reporter selection function
        const result = await window.cosmjs.stargate.selectReporter(
            layerAccount,
            reporterAddress,
            stakeAmount
        );

        if (result && result.txhash) {
            // Get transaction hash from the result
            const txHash = result.txhash || result.tx_response?.txhash;
            App.showSuccessPopup("Reporter selection successful!", txHash, 'cosmos');
            // Clear the inputs
            document.getElementById('selectedReporterAddress').value = '';
            document.getElementById('reporterDropdown').value = '';
            document.getElementById('reporterStakeAmount').value = '';
            // Refresh status to show new selection
            await App.refreshCurrentStatus();
        } else {
            throw new Error(result?.rawLog || "Reporter selection failed");
        }
    } catch (error) {
        console.error('Reporter selection error:', error);
        App.showBalanceErrorPopup(`Reporter selection failed: ${error.message}`);
    } finally {
        // Re-enable the button
        const selectReporterButton = document.getElementById('selectReporterButton');
        if (selectReporterButton) {
            selectReporterButton.disabled = false;
            selectReporterButton.innerHTML = 'Select Reporter';
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
  validateWithdrawalData: async function(withdrawalId, attestData, valset, sigs) {
        try {
            // Validate validator set
            if (!valset || !Array.isArray(valset)) {
                throw new Error('Invalid validator set: must be an array');
            }

            // Check each validator
            for (let i = 0; i < valset.length; i++) {
                const validator = valset[i];
                
                // Check if validator has required fields
                if (!validator.addr || !validator.power) {
                    // console.error(...);
                    throw new Error(`Invalid validator at index ${i}: missing required fields`);
                }

                // Validate address format
                try {
                    ethers.utils.getAddress(validator.addr);
                } catch (e) {
                    // console.error(...);
                    throw new Error(`Invalid validator at index ${i}: invalid address format`);
                }

                // Validate power is a positive number
                if (!ethers.BigNumber.from(validator.power).gt(0)) {
                    // console.error(...);
                    throw new Error(`Invalid validator at index ${i}: power must be positive`);
                }
            }

            // Validate signatures
            if (!sigs || !Array.isArray(sigs)) {
                throw new Error('Invalid signatures: must be an array');
            }

            // Check each signature
            for (let i = 0; i < sigs.length; i++) {
                const sig = sigs[i];

                // For blank attestations, v should be 0 and r/s should be zero bytes
                if (sig.v === 0) {
                    const zeroBytes = '0x0000000000000000000000000000000000000000000000000000000000000000';
                    const rHex = typeof sig.r === 'string' ? sig.r : '0x' + sig.r.toString('hex');
                    const sHex = typeof sig.s === 'string' ? sig.s : '0x' + sig.s.toString('hex');
                    
                    if (rHex !== zeroBytes || sHex !== zeroBytes) {
                        throw new Error(`Invalid signature at index ${i}: zero signature must have zero r and s`);
                    }
                } else if (sig.v !== 27 && sig.v !== 28) {
                    throw new Error(`Invalid signature at index ${i}: v must be 0, 27, or 28`);
                }
            }

            // Check bridge state
            const bridgeState = await App.contracts.Bridge.methods.bridgeState().call();
            if (bridgeState !== '0') { // Assuming 0 is the active state
                throw new Error(`Bridge is not active. Current state: ${bridgeState}`);
            }
        } catch (error) {
            // console.error(...);
            throw error;
        }
    },

  // Modify the claimWithdrawal function to include validation
  claimWithdrawal: async function(withdrawalId) {
    let txHash = null;
    try {
        if (!App.isConnected) {
            alert('Please connect your MetaMask wallet first');
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
        
        // Validate the data before sending to contract
        try {
            await this.validateWithdrawalData(withdrawalId, txData.attestData, txData.valset, txData.sigs);
        } catch (error) {
            throw new Error('The attestation data is not valid. Please try requesting attestation again to get the latest validator set.');
        }

        // Make the contract call
        const tx = await App.contracts.Bridge.methods.withdrawFromLayer(
            txData.attestData,
            txData.valset,
            txData.sigs,
            txData.depositId
        ).send({ from: App.account });

        txHash = tx.transactionHash;
        // console.log(...);
        App.showSuccessPopup("Withdrawal claimed successfully!", txHash, 'ethereum');
        await this.updateWithdrawalHistory();
        return tx;

    } catch (error) {
        // console.error(...);
        // Get transaction hash from error if available
        if (error.transactionHash) {
            txHash = error.transactionHash;
        } else if (error.receipt && error.receipt.transactionHash) {
            txHash = error.receipt.transactionHash;
        }
        
        let errorMessage = "Claim Withdrawal failed. Make sure you have waited the full 12 hrs have passed since you requested withdrawal & then try requesting attestation again for updated validator set.";
        if (txHash) {
            const etherscanUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
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
        const currentValidatorSetTimestamp = validatorSetTimestampData.timestamp;

        // Get validator set for the current timestamp
        const validatorsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_valset_by_timestamp/${currentValidatorSetTimestamp}`
        );

        if (!validatorsResponse.ok) {
            const errorText = await validatorsResponse.text();
            console.error('Validator response error:', { 
                status: validatorsResponse.status, 
                text: errorText,
                currentTimestamp: currentValidatorSetTimestamp,
                reportTimestamp: rawAttestationData.timestamp,
                attestationTimestamp: rawAttestationData.attestation_timestamp
            });
            throw new Error(`Failed to fetch validator set: ${validatorsResponse.statusText}`);
        }

        const validatorsData = await validatorsResponse.json();

        // Get power threshold for this timestamp
        const checkpointParamsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_validator_checkpoint_params/${currentValidatorSetTimestamp}`
        );

        if (!checkpointParamsResponse.ok) {
            throw new Error(`Failed to fetch checkpoint params: ${checkpointParamsResponse.statusText}`);
        }

        const checkpointParams = await checkpointParamsResponse.json();
        const powerThreshold = checkpointParams.power_threshold;

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

        // Create a map of validator addresses to their indices
        const validatorMap = new Map();
        validatorSet.forEach((validator, index) => {
            const address = validator.ethereumAddress.toLowerCase();
            validatorMap.set(address, index);
        });

        // Process each attestation
        const signatureMap = new Map();
        // Ensure checkpoint has 0x prefix before arrayifying
        const checkpointWithPrefix = rawAttestationData.checkpoint.startsWith('0x') ? 
            rawAttestationData.checkpoint : 
            '0x' + rawAttestationData.checkpoint;
        const messageHash = ethers.utils.sha256(ethers.utils.arrayify(checkpointWithPrefix));

        // Process each attestation
        for (let i = 0; i < attestationsResult.attestations.length; i++) {
            const attestation = attestationsResult.attestations[i];
            if (!attestation || attestation.length === 0) {
                // Add zero signature for validators who didn't sign
                signatureMap.set(i, {
                    v: 0,
                    r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    s: "0x0000000000000000000000000000000000000000000000000000000000000000"
                });
                continue;
            }

            // Try both v values (27 and 28)
            for (const v of [27, 28]) {
                const recoveredAddress = ethers.utils.recoverAddress(
                    messageHash,
                    ethers.utils.joinSignature({
                        r: '0x' + attestation.slice(0, 64),
                        s: '0x' + attestation.slice(64, 128),
                        v: v
                    })
                ).toLowerCase();

                const validatorIndex = validatorMap.get(recoveredAddress);
                if (validatorIndex !== undefined) {
                    signatureMap.set(validatorIndex, {
                        v: v,
                        r: '0x' + attestation.slice(0, 64),
                        s: '0x' + attestation.slice(64, 128)
                    });
                    break;
                }
            }
        }

        // Convert signature map to array
        const signatures = Array(validatorSet.length).fill(null).map((_, i) => {
            const sig = signatureMap.get(i);
            if (!sig) {
                return {
                    v: 0,
                    r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    s: "0x0000000000000000000000000000000000000000000000000000000000000000"
                };
            }
            return sig;
        });

        // Process attestations using deriveSignatures with lastSnapshot as checkpoint
        const derivedSignatures = this.deriveSignatures(
            attestationsResult.attestations,
            validatorSet,
            lastSnapshot  // Use lastSnapshot instead of rawAttestationData.checkpoint
        );

        // Format the attestation data according to the contract's expected structure
        const formattedAttestationData = {
            queryId: ethers.utils.arrayify(this.ensureHexPrefix(rawAttestationData.query_id)),
            report: {
                value: ethers.utils.arrayify(this.ensureHexPrefix(rawAttestationData.aggregate_value)),
                timestamp: parseInt(rawAttestationData.timestamp),
                aggregatePower: parseInt(rawAttestationData.aggregate_power),
                previousTimestamp: parseInt(rawAttestationData.previous_report_timestamp),
                nextTimestamp: parseInt(rawAttestationData.next_report_timestamp),
                lastConsensusTimestamp: parseInt(rawAttestationData.last_consensus_timestamp)
            },
            attestationTimestamp: parseInt(rawAttestationData.attestation_timestamp)
        };

        // Format the validator set according to the contract's expected structure
        const formattedValidatorSet = validatorSet.map(validator => ({
            addr: validator.ethereumAddress,
            power: parseInt(validator.power)
        }));

        return {
            attestationData: formattedAttestationData,
            validatorSet: formattedValidatorSet,
            signatures: derivedSignatures,
            powerThreshold: powerThreshold,
            checkpoint: rawAttestationData.checkpoint,
            rawAttestationData: rawAttestationData  // Include raw data for debugging
        };
    } catch (error) {
        // console.error(...);
        throw error;
    }
  },

  deriveSignatures: function(signatures, validatorSet, checkpoint) {
    console.log("Deriving signatures with:", {
        signatureCount: signatures.length,
        validatorCount: validatorSet.length,
        checkpoint
    });

    const derivedSignatures = [];
    // Ensure checkpoint has 0x prefix
    const checkpointHex = checkpoint.startsWith('0x') ? checkpoint : '0x' + checkpoint;
    
    // Get message hash using ethers - this matches Python's sha256(data).digest()
    const messageHash = ethers.utils.sha256(ethers.utils.arrayify(checkpointHex));
    // console.log(...);
    
    const zeroBytes = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    // Create a map of validator addresses to their indices for faster lookup
    const validatorMap = new Map();
    validatorSet.forEach((validator, index) => {
        validatorMap.set(validator.ethereumAddress.toLowerCase(), index);
    });
    
    for (let i = 0; i < signatures.length; i++) {
        const signature = signatures[i];
        const validator = validatorSet[i];
        
        if (!signature || signature.length === 0) {
            derivedSignatures.push({
                v: 0,
                r: zeroBytes,
                s: zeroBytes
            });
            continue;
        }

        if (signature.length !== 128) {
            // console.error(...);
            derivedSignatures.push({
                v: 0,
                r: zeroBytes,
                s: zeroBytes
            });
            continue;
        }

        const r = '0x' + signature.slice(0, 64);
        const s = '0x' + signature.slice(64, 128);
        let foundValidSignature = false;
        
        // Try both v values (27 and 28)
        for (const v of [27, 28]) {
            try {
                const recoveredAddress = ethers.utils.recoverAddress(
                    messageHash,
                    { r, s, v }
                ).toLowerCase();

                if (recoveredAddress === validator.ethereumAddress.toLowerCase()) {
                    derivedSignatures.push({ v, r, s });
                    foundValidSignature = true;
                    break;
                }
            } catch (error) {
                // console.error(...);
            }
        }

        if (!foundValidSignature) {
            derivedSignatures.push({
                v: 0,
                r: zeroBytes,
                s: zeroBytes
            });
        }
    }
    
    return derivedSignatures;
  },

  showErrorPopup: function(message) {
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
    popup.style.fontSize = "15px";
    popup.style.width = '300px';
    popup.style.textAlign = 'center';
    popup.style.lineHeight = '1.4';
  
    // Use innerHTML to allow for the Etherscan link
    popup.innerHTML = message;
  
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

    noStakeReportBtn.addEventListener('click', () => {
        if (this.currentBridgeDirection !== 'noStakeReport') {
            this.switchBridgeDirection('noStakeReport');
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
    
    if (isEthereumConnected && isCosmosConnected) {
      const ethTruncatedAddress = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
      const cosmosTruncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
      walletManagerText.textContent = `Ethereum: ${ethTruncatedAddress} | Cosmos: ${cosmosTruncatedAddress}`;
    } else if (isEthereumConnected) {
      const truncatedAddress = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
      walletManagerText.textContent = `Ethereum: ${truncatedAddress} | Cosmos: Not Connected`;
    } else if (isCosmosConnected) {
      const truncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
      walletManagerText.textContent = `Ethereum: Not Connected | Cosmos: ${truncatedAddress}`;
    } else {
      walletManagerText.textContent = 'Connect Wallets';
    }
  },

  keepWalletDropdownOpen: function() {
    const walletManagerDropdown = document.querySelector('.wallet-manager-dropdown');
    if (walletManagerDropdown) {
      // Ensure dropdown stays open after wallet operations
      // Use a small delay to ensure it works after any UI updates
      setTimeout(() => {
        if (!walletManagerDropdown.classList.contains('open')) {
          walletManagerDropdown.classList.add('open');
        }
      }, 100);
    }
  },

  switchBridgeDirection: function(direction) {
    if (direction !== 'layer' && direction !== 'ethereum' && direction !== 'delegate' && direction !== 'noStakeReport') {
        // console.error(...);
        return;
    }

    const bridgeToggle = document.getElementById('bridgeDirectionToggle');
    const bridgeSection = document.getElementById('bridgeSection');
    const bridgeToTellorContent = document.getElementById('bridgeToTellorContent');
    const bridgeToEthereumContent = document.getElementById('bridgeToEthereumContent');
    const delegateBtn = document.getElementById('delegateBtn');
    const noStakeReportBtn = document.getElementById('noStakeReportBtn');
    const delegateSection = document.getElementById('delegateSection');
    const noStakeReportSection = document.getElementById('noStakeReportSection');
    const transactionsContainer = document.getElementById('bridgeTransactionsContainer');
    const boxWrapper = document.querySelector('.box-wrapper');

    if (!bridgeSection || !bridgeToTellorContent || !bridgeToEthereumContent || !delegateBtn || !delegateSection) {
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
        noStakeReportSection.classList.remove('active');
    } else {
        bridgeToTellorContent.style.display = 'none';
        bridgeToEthereumContent.style.display = 'none';
        bridgeSection.classList.remove('active');
        delegateSection.classList.toggle('active', direction === 'delegate');
        noStakeReportSection.classList.toggle('active', direction === 'noStakeReport');
    }
    
    // Update box wrapper classes for animation
    if (boxWrapper) {
        boxWrapper.classList.remove('layer-direction', 'ethereum-direction', 'delegate-direction', 'noStakeReport-direction');
        if (direction === 'layer') {
            boxWrapper.classList.add('layer-direction');
        } else if (direction === 'ethereum') {
            boxWrapper.classList.add('ethereum-direction');
        } else if (direction === 'delegate') {
            boxWrapper.classList.add('delegate-direction');
        } else if (direction === 'noStakeReport') {
            boxWrapper.classList.add('noStakeReport-direction');
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
    
    console.log('Network Status:', status);
    
    // Check button states
    const withdrawButton = document.getElementById('withdrawButton');
    if (withdrawButton) {
      console.log('Withdrawal Button State:', {
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
        console.log('✅ Networks are compatible - withdrawals should work');
      } else {
        console.log('❌ Networks are incompatible - withdrawals will fail');
        console.log('Ethereum:', isEthereumMainnet ? 'Mainnet' : 'Testnet');
        console.log('Cosmos:', isCosmosMainnet ? 'Mainnet' : 'Testnet');
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
      
      // Sort reporters by address for consistent ordering
      const sortedReporters = data.reporters.sort((a, b) => {
        return a.address.localeCompare(b.address);
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
      console.log('Fetching current reporter from:', endpoint);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No reporter selected for address:', selectorAddress);
          return null; // No reporter selected
        }
        
        // Handle 500 errors that might indicate "not found" on mainnet
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('not found')) {
              console.log('No reporter selected (500 error format):', selectorAddress);
              return null;
            }
          } catch (e) {
            // If we can't parse the error response, continue with the original error
          }
        }
        
        throw new Error(`Failed to fetch current reporter: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Current reporter data:', data);
      
      // Handle mainnet-specific error format
      if (data.code && data.message && data.message.includes('not found')) {
        console.log('No reporter selected (mainnet format):', selectorAddress);
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
      console.log('Delegations data:', data);
      
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

  // Add function to display current reporter status
  displayCurrentReporterStatus: async function(selectorAddress) {
    const statusElement = document.getElementById('currentReporterStatus');
    if (!statusElement) return;

    try {
      statusElement.innerHTML = '<div class="status-loading">Loading...</div>';
      
      const reporterData = await this.fetchCurrentReporter(selectorAddress);
      
      if (!reporterData) {
        statusElement.innerHTML = '<div class="status-empty">No reporter selected</div>';
        return;
      }

      // Display reporter address with copy tooltip
      const reporterAddress = reporterData.reporter || 'Unknown';
      statusElement.innerHTML = `
        <div class="status-item">
          <span class="status-address">${reporterAddress}</span>
          <button class="copy-btn" onclick="App.copyToClipboard('${reporterAddress}')" data-tooltip="Copy address">⧉</button>
        </div>
      `;
    } catch (error) {
      console.error('Error displaying reporter status:', error);
      statusElement.innerHTML = '<div class="status-empty">Error loading reporter status</div>';
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
    if (!statusElement) return;

    try {
      statusElement.innerHTML = '<div class="status-loading">Loading...</div>';
      
      const delegations = await this.fetchCurrentDelegations(delegatorAddress);
      
      if (!delegations || delegations.length === 0) {
        statusElement.innerHTML = '<div class="status-empty">No delegations found</div>';
        return;
      }

      // Calculate total delegation
      let totalDelegated = 0;
      delegations.forEach(delegation => {
        if (delegation.denom === 'loya') {
          totalDelegated += parseInt(delegation.amount);
        }
      });

      const totalTRB = (totalDelegated / 1000000).toFixed(6);

      // Display total in distinct container with dropdown arrow
      statusElement.innerHTML = `
        <div class="status-total-container" onclick="App.toggleDelegationsDropdown()">
          <div class="status-total-content">
            <span class="status-label">Total:</span>
            <span class="status-amount">${totalTRB} TRB</span>
          </div>
          <span class="dropdown-arrow" id="delegationsDropdownArrow">▼</span>
        </div>
      `;

      // Populate dropdown with detailed delegations
      const dropdownContent = document.getElementById('delegationsDropdownContent');
      if (dropdownContent) {
        let dropdownHtml = '';
        for (const delegation of delegations) {
          const amountTRB = (parseInt(delegation.amount) / 1000000).toFixed(6);
          // Truncate validator address for display
          const validatorDisplay = delegation.validatorAddress.length > 20 
            ? delegation.validatorAddress.substring(0, 17) + '...'
            : delegation.validatorAddress;
          
          dropdownHtml += `
            <div class="status-item status-delegation">
              <div class="address-with-copy">
                <span class="status-address">${validatorDisplay}</span>
                <button class="copy-btn" onclick="App.copyToClipboard('${delegation.validatorAddress}')" data-tooltip="Copy full address">⧉</button>
              </div>
              <span class="status-amount">${amountTRB} TRB</span>
            </div>
          `;
        }
        dropdownContent.innerHTML = dropdownHtml;
        console.log('Dropdown HTML set:', dropdownHtml);
      }
    } catch (error) {
      console.error('Error displaying delegations status:', error);
      statusElement.innerHTML = '<div class="status-empty">Error loading delegations</div>';
    }
  },

  // Add function to refresh all status
  refreshCurrentStatus: async function() {
    if (!App.isKeplrConnected || !App.keplrAddress) {
      return;
    }

    try {
      await Promise.all([
        this.displayCurrentReporterStatus(App.keplrAddress),
        this.displayCurrentDelegationsStatus(App.keplrAddress)
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
                        const networkName = App.cosmosChainId === 'tellor-1' ? 'MN' : 'TN';
                        option.textContent = `${displayMoniker} (${votingPower} TRB, ${commission}%) [${networkName}]`;
                        option.title = `${validator.moniker} (${votingPower} TRB, ${commission}% commission) - ${networkName === 'MN' ? 'Mainnet' : 'Testnet'}`; // Full name in tooltip
                        dropdown.appendChild(option);
                    }
                });
      
      dropdown.disabled = false;
      

      
    } catch (error) {
      console.error('Error populating validator dropdown:', error);
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
          const networkName = App.cosmosChainId === 'tellor-1' ? 'MN' : 'TN';
          // Extract power and commission from description
          const powerMatch = reporter.description.match(/Power: (\d+)/);
          const commissionMatch = reporter.description.match(/Commission: ([\d.]+)%/);
          const power = powerMatch ? powerMatch[1] : '0';
          const commission = commissionMatch ? commissionMatch[1] : '0';
          
          option.textContent = `${displayName} (${power} power, ${commission}%) [${networkName}]`;
          option.title = `${reporter.name} - ${reporter.description} - ${networkName === 'MN' ? 'Mainnet' : 'Testnet'}`;
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

  // No-Stake Reporting Functions
  initNoStakeReporting: async function() {
    try {
      // Initialize the no-stake reporter
      if (window.noStakeReporter) {
        await window.noStakeReporter.init();
      } else {
        console.error('NoStakeReporter not found');
      }
    } catch (error) {
      console.error('Failed to initialize no-stake reporting:', error);
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

  // Check wallet connection status for no-stake reporting
  checkNoStakeWalletStatus: async function() {
    try {
      if (!window.noStakeReporter) {
        throw new Error('NoStakeReporter not initialized');
      }

      const walletStatus = await window.noStakeReporter.getWalletStatus();
      return walletStatus;
    } catch (error) {
      console.error('Failed to check no-stake wallet status:', error);
      return { isConnected: false, address: null, walletType: null };
    }
  },

  // Update wallet info display
  updateNoStakeWalletInfo: function(address) {
    // You can add wallet info display here if needed
    console.log('No-stake wallet connected:', address);
  },

  // Submit a no-stake report
  submitNoStakeReport: async function() {
    try {
      if (!window.noStakeReporter) {
        throw new Error('NoStakeReporter not initialized');
      }

      // Get form values
      const queryData = document.getElementById('noStakeQueryData').value.trim();
      const value = document.getElementById('noStakeValue').value.trim();

      // Validate inputs
      if (!queryData) {
        throw new Error('Please enter query data');
      }
      if (!value) {
        throw new Error('Please enter a value');
      }
      if (!window.noStakeReporter.validateQueryData(queryData)) {
        throw new Error('Invalid query data format. Must be a valid hex string.');
      }
      if (!window.noStakeReporter.validateValue(value)) {
        throw new Error('Invalid value format. Must be a valid hex string.');
      }

      // Show pending popup
      App.showPendingPopup("Submitting no-stake report...");

      // Submit the report (network is automatically detected from wallet manager)
      const result = await window.noStakeReporter.submitNoStakeReport(queryData, value);
      
      // Hide pending popup
      App.hidePendingPopup();
      
      if (result.success) {
        // Show success popup with transaction hash and block explorer link
        App.showSuccessPopup("No-stake report submitted successfully!", result.transactionHash, 'cosmos');
        
        // Clear form
        document.getElementById('noStakeQueryData').value = '';
        document.getElementById('noStakeValue').value = '';
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Failed to submit no-stake report:', error);
      App.hidePendingPopup();
      App.showErrorPopup(error.message || 'Failed to submit no-stake report');
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
    
    // Always check voting power when wallet connects
    setTimeout(() => {
      if (window.App && window.App.checkVotingPower) {
        window.App.checkVotingPower();
      }
    }, 600);
  },

      // Check and display voting power status
    checkVotingPower: async function() {
        try {
            if (!walletStatus.isConnected) {
                return;
            }

            const votingPowerCheck = await disputeProposer.checkVotingPower();
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
                App.displayDisputesTable(result.disputes, result.pagination, walletStatus.network);
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

    // Display disputes in a table format
    displayDisputesTable: function(disputes, pagination, network) {
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

        // Add rows for each dispute
        disputes.forEach(dispute => {
            const row = document.createElement('tr');
            const data = dispute.displayData;
            
            // Format status with color coding
            const statusClass = App.getStatusClass(data.disputeStatus);
            const openBadge = data.isOpen ? '<span class="badge badge-success">Open</span>' : '<span class="badge badge-secondary">Closed</span>';
            
            // Format dates
            const startDate = data.startTime ? new Date(data.startTime).toLocaleDateString() : 'N/A';
            const endDate = data.endTime ? new Date(data.endTime).toLocaleDateString() : 'N/A';
            
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
                    ${data.disputeStatus === 'DISPUTE_STATUS_VOTING' ? 
                        `<button class="btn-small btn-vote" onclick="App.navigateToVoting('${data.disputeId}')">Vote</button>` : 
                        data.disputeStatus === 'DISPUTE_STATUS_PREVOTE' ?
                        `<button class="btn-small btn-add-fee" onclick="App.navigateToAddFee('${data.disputeId}')">Add Fee</button>` :
                        `<span class="status-text">${App.formatStatus(data.disputeStatus)}</span>`
                    }
                </td>
            `;
            
            tableBody.appendChild(row);
        });
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
            console.log('Navigating to add fee tab for dispute:', disputeId);
            
            // Switch to the add fee tab
            if (window.switchDisputeTab) {
                window.switchDisputeTab('addFeeDisputeTab');
            }
            
            // Wait a moment for the tab to load, then populate the dispute ID
            setTimeout(() => {
                const disputeIdInput = document.getElementById('addFeeDisputeId');
                if (disputeIdInput) {
                    disputeIdInput.value = disputeId;
                    console.log(`Dispute ID #${disputeId} populated in add fee tab`);
                    
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
            console.log('Navigating to voting tab for dispute:', disputeId);
            
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
                        console.log(`Dispute #${disputeId} selected in voting tab`);
                    } else {
                        // If dispute not in dropdown, try to refresh the list first
                        console.log(`Dispute #${disputeId} not found in dropdown, refreshing list...`);
                        if (window.App && window.App.loadOpenDisputes) {
                            await window.App.loadOpenDisputes();
                            
                            // Try again after refresh
                            setTimeout(() => {
                                const refreshedOption = disputeSelect.querySelector(`option[value="${disputeId}"]`);
                                if (refreshedOption) {
                                    disputeSelect.value = disputeId;
                                    console.log(`Dispute #${disputeId} selected after refresh`);
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
window.App.requestAttestation = App.requestAttestation;  // Also explicitly expose requestAttestation
window.App.submitNoStakeReport = App.submitNoStakeReport;  // Expose no-stake report function
window.App.checkNoStakeWalletStatus = App.checkNoStakeWalletStatus;  // Expose wallet status check
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