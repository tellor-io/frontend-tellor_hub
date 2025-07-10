import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';
import { 
    generateWithdrawalQueryId, 
    generateDepositQueryId,
    isWithdrawClaimed,
    Deposit
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

  _depositLimit: function() {
    return App.depositLimit;
  },

  init: function () {
    return new Promise((resolve, reject) => {
      try {
        // Initialize ethers
        App.ethers = ethers;
        
        // Wait for CosmJS to be loaded
        if (!window.cosmjsLoaded) {
          throw new Error('CosmJS not loaded yet');
        }

        // Verify CosmJS is available
        if (typeof window.cosmjs === 'undefined' || typeof window.cosmjs.stargate === 'undefined') {
          throw new Error('CosmJS not properly loaded');
        }

        App.initWeb3()
          .then(() => {
            App.initInputValidation();
            App.initBridgeDirectionUI(); // Initialize bridge direction UI
            
            // Remove any existing event listeners
            const walletButton = document.getElementById('walletButton');
            const metamaskButton = document.getElementById('metamaskButton');
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
                        console.error('MetaMask operation failed:', error);
                        App.handleError(error);
                    }
                });
            }

            if (metamaskButton) {
                const newMetamaskButton = metamaskButton.cloneNode(true);
                metamaskButton.parentNode.replaceChild(newMetamaskButton, metamaskButton);
                newMetamaskButton.addEventListener('click', async () => {
                    try {
                        if (App.isConnected) {
                            await App.disconnectMetaMask();
                        } else {
                            await App.connectMetaMask();
                        }
                    } catch (error) {
                        console.error('MetaMask operation failed:', error);
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
                        }
                    } catch (error) {
                        console.error('Keplr operation failed:', error);
                        App.handleError(error);
                    }
                });
            }

            // Handle delegate Keplr button
            const delegateKeplrButton = document.getElementById('delegateKeplrButton');
            if (delegateKeplrButton) {
                const newDelegateKeplrButton = delegateKeplrButton.cloneNode(true);
                delegateKeplrButton.parentNode.replaceChild(newDelegateKeplrButton, delegateKeplrButton);
                newDelegateKeplrButton.addEventListener('click', async () => {
                    try {
                        if (App.isKeplrConnected) {
                            await App.disconnectKeplr();
                        } else {
                            await App.connectKeplr();
                        }
                    } catch (error) {
                        console.error('Keplr operation failed:', error);
                        App.handleError(error);
                    }
                });
            }

            resolve();
          })
          .catch(error => {
            console.error("Error initializing app:", error);
            reject(error);
          });
      } catch (error) {
        console.error("Initialization error:", error);
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
            const metamaskButton = document.getElementById("metamaskButton");
            
            if (walletButton) {
              walletButton.disabled = false;
              walletButton.innerHTML = 'Connect Ethereum Wallet';
            }
            if (metamaskButton) {
              metamaskButton.disabled = false;
              metamaskButton.innerHTML = 'Connect Ethereum Wallet';
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
              window.location.reload();
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
            const metamaskButton = document.getElementById("metamaskButton");
            if (walletButton) walletButton.disabled = false;
            if (metamaskButton) metamaskButton.disabled = false;
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
          const delegateKeplrButton = document.getElementById("delegateKeplrButton");
          if (keplrButton) {
            keplrButton.disabled = false;
            // Update button text to be more generic
            keplrButton.innerHTML = 'Connect Cosmos Wallet';
          }
          if (delegateKeplrButton) {
            delegateKeplrButton.disabled = false;
            // Update button text to be more generic
            delegateKeplrButton.innerHTML = 'Connect Cosmos Wallet';
          }
        }
        
        resolve();
      } catch (error) {
        console.error("Error in initWeb3:", error);
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
        console.error("Error connecting Ethereum wallet:", error);
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
        
        // Switch to Sepolia if needed
        if (App.chainId !== 11155111) {
            console.log('Not on Sepolia, attempting to switch...');
            try {
                await window.ethereumWalletAdapter.switchChain(11155111);
                App.chainId = 11155111;
                console.log('Switched to Sepolia');
            } catch (switchError) {
                console.error('Failed to switch to Sepolia:', switchError);
                alert('Please manually switch to Sepolia testnet in your wallet and try again.');
                throw new Error('Failed to switch to Sepolia network');
            }
        }
        
        // Validate chain ID
        try {
            validateChainId(App.chainId);
        } catch (error) {
            console.error('Chain validation error:', error);
            alert('Please connect to Sepolia (chain ID: 11155111). Mainnet support coming soon.');
            throw error;
        }
        
        // Initialize contracts
        await App.initBridgeContract();
        await App.initTokenContract();
        
        // Update wallet buttons
        const truncatedAddress = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
        
        const walletButton = document.getElementById('walletButton');
        const metamaskButton = document.getElementById('metamaskButton');
        
        if (walletButton) {
            walletButton.innerHTML = `Disconnect Ethereum Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        if (metamaskButton) {
            metamaskButton.innerHTML = `Disconnect Ethereum Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update balances and limits
        await Promise.all([
            App.updateBalance(),
            App.fetchDepositLimit()
        ]);
        
        App.setPageParams();
        
        return connectionResult;
        
    } catch (error) {
        console.error("Error connecting Ethereum wallet:", error);
        App.handleError(error);
        throw error;
    }
  },

  // Test function to verify Ethereum wallet connection
  testEthereumConnection: async function() {
    console.log('=== App Ethereum Connection Test ===');
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
        console.log('App account balance:', this.web3.utils.fromWei(balance, 'ether'), 'ETH');
        
        // Test token balance if contracts are initialized
        if (this.contracts.Token) {
          const tokenBalance = await this.contracts.Token.methods.balanceOf(this.account).call();
          console.log('Token balance:', this.web3.utils.fromWei(tokenBalance, 'ether'), 'TRB');
        }
        
        return true;
      } catch (error) {
        console.error('Error in app connection test:', error);
        return false;
      }
    } else {
      console.log('App not connected or Web3 not available');
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
        console.log('Current chain ID:', chainId);
        
        // If not on Sepolia, try to switch to it
        if (chainId !== 11155111) {
            console.log('Not on Sepolia, attempting to switch...');
            try {
                // Try to switch to Sepolia
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
                console.log('Switched to chain ID:', chainId);
                
            } catch (switchError) {
                console.log('Switch error:', switchError);
                
                // If the network doesn't exist (error code 4902), add it
                if (switchError.code === 4902) {
                    try {
                        console.log('Adding Sepolia network...');
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
                        console.log('Added and switched to chain ID:', chainId);
                        
                    } catch (addError) {
                        console.error('Failed to add Sepolia network:', addError);
                        alert('Please manually add Sepolia testnet to MetaMask and try again.');
                        throw new Error('Failed to add Sepolia network to MetaMask');
                    }
                } else {
                    console.error('Failed to switch to Sepolia:', switchError);
                    alert('Please manually switch to Sepolia testnet in MetaMask and try again.');
                    throw new Error('Failed to switch to Sepolia network');
                }
            }
        }
        
        // Validate chain ID
        try {
            validateChainId(chainId);
        } catch (error) {
            console.error('Chain validation error:', error);
            console.error('Current chain ID:', chainId, 'Type:', typeof chainId);
            console.error('Supported chain IDs:', Object.keys(SUPPORTED_CHAIN_IDS));
            alert('Please connect to Sepolia (chain ID: 11155111). Mainnet support coming soon.');
            throw error;
        }
        
        // Set account and connection state
        App.account = accounts[0];
        App.isConnected = true;
        
        // Initialize contracts
        await App.initBridgeContract();
        await App.initTokenContract();
        
        // Update both MetaMask buttons regardless of current direction
        const truncatedAddress = `${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)}`;
        const walletButton = document.getElementById('walletButton');
        const metamaskButton = document.getElementById('metamaskButton');
        
        if (walletButton) {
            walletButton.innerHTML = `Disconnect Ethereum Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        if (metamaskButton) {
            metamaskButton.innerHTML = `Disconnect Ethereum Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update balances and limits
        await Promise.all([
            App.updateBalance(),
            App.fetchDepositLimit()
        ]);
        
        App.setPageParams();
    } catch (error) {
        console.error("Error connecting MetaMask:", error);
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
        console.error("Error connecting Cosmos wallet:", error);
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

        // Connect to the selected wallet
        const connectionResult = await window.cosmosWalletAdapter.connectToWallet(walletType);
        
        // Set wallet state
        App.keplrAddress = connectionResult.address;
        App.isKeplrConnected = true;
        App.connectedWallet = connectionResult.walletName;
        
        // Update button text with wallet name and address
        const truncatedAddress = `${App.keplrAddress.substring(0, 6)}...${App.keplrAddress.substring(App.keplrAddress.length - 4)}`;
        
        const keplrButton = document.getElementById('keplrButton');
        const delegateKeplrButton = document.getElementById('delegateKeplrButton');
        
        if (keplrButton) {
            keplrButton.innerHTML = `Disconnect Cosmos Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        if (delegateKeplrButton) {
            delegateKeplrButton.innerHTML = `Disconnect Cosmos Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update balance immediately after connection
        await App.updateKeplrBalance();
        
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
        
        App.setPageParams();
        return connectionResult;
    } catch (error) {
        // Clear connection state on error
        App.keplrAddress = null;
        App.isKeplrConnected = false;
        App.connectedWallet = null;
        
        throw error;
    }
  },

  connectKeplrLegacy: async function() {
    try {
        if (!window.keplr) {
            throw new Error('Keplr not installed');
        }
        
        // First try to disable any existing connection
        try {
            if (typeof window.keplr.disable === 'function') {
                await window.keplr.disable('layertest-4');
            }
        } catch (error) {
            console.warn('Could not disable existing chain connection:', error);
        }

        // Suggest the chain to the user
        await window.keplr.experimentalSuggestChain({
            chainId: "layertest-4",
            chainName: "Layer",
            rpc: "https://node-palmito.tellorlayer.com/rpc",
            rest: "https://node-palmito.tellorlayer.com/rpc",
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
        await window.keplr.enable('layertest-4');
        
        // Get the offline signer
        const offlineSigner = window.keplr.getOfflineSigner('layertest-4');
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
        const delegateKeplrButton = document.getElementById('delegateKeplrButton');
        if (keplrButton) {
            keplrButton.innerHTML = `Disconnect Cosmos Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        if (delegateKeplrButton) {
            delegateKeplrButton.innerHTML = `Disconnect Cosmos Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        // Update balance immediately after connection
        await App.updateKeplrBalance();
        
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
        
        App.setPageParams();
    } catch (error) {
        // Clear connection state on error
        App.keplrAddress = null;
        App.isKeplrConnected = false;
        App.connectedWallet = null;
        
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
        
        // Update both wallet buttons (main and MetaMask-specific)
        const walletButton = document.getElementById('walletButton');
        const metamaskButton = document.getElementById('metamaskButton');
        
        if (walletButton) {
            walletButton.innerHTML = 'Connect Ethereum Wallet';
        }
        
        if (metamaskButton) {
            metamaskButton.innerHTML = 'Connect Ethereum Wallet';
        }

        // Update balances
        const currentBalance = document.getElementById('currentBalance');
        const ethMetaMaskBalance = document.getElementById('ethMetaMaskBalance');
        
        if (currentBalance) {
            currentBalance.textContent = '0 TRB';
        }
        if (ethMetaMaskBalance) {
            ethMetaMaskBalance.textContent = '0 TRB';
        }

        // Disable action buttons
        const approveButton = document.getElementById('approveButton');
        const depositButton = document.getElementById('depositButton');
        
        if (approveButton) approveButton.disabled = true;
        if (depositButton) depositButton.disabled = true;

        // Update page parameters
        App.setPageParams();
        console.log('Ethereum wallet disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting Ethereum wallet:', error);
        App.handleError(error);
    }
  },

  disconnectKeplr: async function() {
    try {
        console.log('Disconnecting Cosmos wallet...');
        if (!App.isKeplrConnected) {
            console.log('Cosmos wallet already disconnected');
            return;
        }

        // Use wallet adapter if available, otherwise use legacy method
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            await window.cosmosWalletAdapter.disconnect();
        } else {
            // Legacy Keplr disconnect
            try {
                if (window.keplr && typeof window.keplr.disable === 'function') {
                    await window.keplr.disable('layertest-4');
                }
            } catch (error) {
                console.warn('Could not disable chain in Keplr:', error);
            }
        }

        // Clear wallet state
        App.keplrAddress = null;
        App.isKeplrConnected = false;
        App.connectedWallet = null;

        // Update wallet buttons with generic text
        const keplrButton = document.getElementById('keplrButton');
        const delegateKeplrButton = document.getElementById('delegateKeplrButton');
        if (keplrButton) {
            keplrButton.innerHTML = 'Connect Cosmos Wallet';
            console.log('Updated Cosmos wallet button');
        }
        if (delegateKeplrButton) {
            delegateKeplrButton.innerHTML = 'Connect Cosmos Wallet';
            console.log('Updated delegate Cosmos wallet button');
        }

        // Update balances
        const ethKeplrBalance = document.getElementById('ethKeplrBalance');
        const delegateKeplrBalance = document.getElementById('delegateKeplrBalance');
        if (ethKeplrBalance) {
            ethKeplrBalance.textContent = '0 TRB';
        }
        if (delegateKeplrBalance) {
            delegateKeplrBalance.textContent = '0 TRB';
        }

        // Disable action buttons
        const withdrawButton = document.getElementById('withdrawButton');
        const delegateButton = document.getElementById('delegateButton');
        if (withdrawButton) {
            withdrawButton.disabled = true;
        }
        if (delegateButton) {
            delegateButton.disabled = true;
        }

        // Update withdrawal history to reflect wallet disconnection
        await this.updateWithdrawalHistory();

        // Update page parameters
        App.setPageParams();
        console.log('Cosmos wallet disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting Cosmos wallet:', error);
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
        
        // Update the appropriate wallet button based on current direction
        if (this.currentBridgeDirection === 'layer') {
            document.getElementById('walletButton').innerHTML = `Disconnect Ethereum Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        } else {
            document.getElementById('metamaskButton').innerHTML = `Disconnect Ethereum Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        }
        
        App.setPageParams();
        this.updateUIForCurrentDirection();
    } catch (error) {
        console.error('Error in handleAccountsChanged:', error);
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
        
        // Clear any pending transactions or subscriptions
        if(App.web3 && App.web3.eth) {
            await App.web3.eth.clearSubscriptions();
        }
    } catch (error) {
        console.error('Error during wallet disconnection:', error);
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
    console.error("An error occurred:", error);
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
            11155111: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2", // Sepolia
            421613: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444",   // Arbitrum Goerli
            1: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",        // Mainnet
            137: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",      // Polygon
            80001: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",    // Mumbai
            100: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",      // Gnosis
            10200: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",    // Chiado
            10: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",       // Optimism
            420: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",      // Optimism Goerli
            42161: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",    // Arbitrum
            421613: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444",   // Arbitrum Goerli
            3141: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2"      // Filecoin
        };

        const address = contractAddresses[App.chainId];
        if (!address) {
            throw new Error(`No contract address for chainId: ${App.chainId}`);
        }

        App.contracts.Bridge.options.address = address;
        return true;
    } catch (error) {
        console.error("Bridge contract initialization error:", error);
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
          console.error("Token contract initialization error:", error);
          reject(error);
        }
      }).fail(function(error) {
        console.error("Failed to load Token ABI:", error);
        reject(error);
      });
    });
  },

  fetchDepositLimit: async function() {
    try {
        if (!App.contracts.Bridge || !App.contracts.Bridge.methods) {
            throw new Error("Bridge contract not properly initialized");
        }

        if (!App.contracts.Bridge.methods.depositLimit) {
            throw new Error("depositLimit method not found");
        }

        const result = await App.contracts.Bridge.methods.depositLimit().call();
        App.depositLimit = result;
        
        const readableLimit = App.web3.utils.fromWei(App.depositLimit, 'ether');
        const depositLimitElement = document.getElementById("depositLimit");
        
        if (depositLimitElement) {
            depositLimitElement.textContent = readableLimit + ' TRB';
        } else {
            console.warn("depositLimit element not found in DOM");
        }

        return readableLimit;
    } catch (error) {
        console.error("Failed to fetch DepositLimit:", error);
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
          console.error("Error fetching deposit limit:", error);
        });
      }
      // Update MetaMask balance if connected
      if (App.isConnected) {
        App.updateBalance().catch(error => {
          console.error("Error updating MetaMask balance:", error);
        });
      }
    } else {
      // For Ethereum section
      if (App.isConnected) {
        // Update MetaMask balance
        App.updateBalance().catch(error => {
          console.error("Error updating MetaMask balance:", error);
        });
      }
      if (App.isKeplrConnected) {
        // Update Keplr balance
        App.updateKeplrBalance().catch(error => {
          console.error("Error updating Keplr balance:", error);
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
            offlineSigner = window.keplr.getOfflineSigner('layertest-4');
        }

        const signingClient = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            'https://node-palmito.tellorlayer.com/rpc',
            offlineSigner
        );

        const balance = await signingClient.getBalance(App.keplrAddress, "loya");

        if (!balance || !balance.amount) {
            throw new Error('Invalid balance response from chain');
        }

        const balanceAmount = parseInt(balance.amount);
        // Format balance to 6 decimal places consistently
        const readableBalance = (balanceAmount / 1000000).toFixed(6);

        // Update Cosmos wallet balance displays for Ethereum and Delegate sections only
        // (currentBalance in Bridge to Tellor section is for MetaMask only)
        const ethKeplrBalanceElement = document.getElementById("ethKeplrBalance");
        const delegateKeplrBalanceElement = document.getElementById("delegateKeplrBalance");
        
        if (ethKeplrBalanceElement) {
            ethKeplrBalanceElement.textContent = `${readableBalance} TRB`;
        }
        if (delegateKeplrBalanceElement) {
            delegateKeplrBalanceElement.textContent = `${readableBalance} TRB`;
        }
    } catch (error) {
        console.error("Error fetching Cosmos wallet balance:", error);
        // Set Cosmos wallet balances to 0 on error (excluding currentBalance which is for MetaMask)
        const ethKeplrBalanceElement = document.getElementById("ethKeplrBalance");
        const delegateKeplrBalanceElement = document.getElementById("delegateKeplrBalance");
        
        if (ethKeplrBalanceElement) ethKeplrBalanceElement.textContent = "0.000000 TRB";
        if (delegateKeplrBalanceElement) delegateKeplrBalanceElement.textContent = "0.000000 TRB";
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

    App.showPendingPopup("Approval transaction pending...");
    App.contracts.Token.methods.approve(App.contracts.Bridge.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        App.hidePendingPopup();
        document.getElementById('depositButton').disabled = false;
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in approval", error);
        alert("Error in approval. Please try again.");
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
            alert('Recipient address cannot be empty');
            return;
        }
        
        if (!recipient.startsWith('tellor1')) {
            alert('Recipient address must start with "tellor1..."');
            return;
        }

        if (recipient.length !== 45) {
            alert('Recipient address must be exactly 45 characters long');
            return;
        }

        const amountToSend = App.web3.utils.toWei(amount, 'ether');
        
        const balance = await App.contracts.Token.methods.balanceOf(App.account).call();

        const balanceBN = new App.web3.utils.BN(balance);
        const amountBN = new App.web3.utils.BN(amountToSend);

        if (balanceBN.lt(amountBN)) {
            const errorMsg = `Insufficient token balance. You have ${App.web3.utils.fromWei(balance, 'ether')} TRB but trying to deposit ${amount} TRB`;
            alert(errorMsg);
            return;
        }

        // Only reach here if balance is sufficient
        App.showPendingPopup("Deposit transaction pending...");
        const tipToSend = App.web3.utils.toWei(tip, 'ether');
        const tx = await App.contracts.Bridge.methods.depositToLayer(amountToSend, tipToSend, recipient)
            .send({ from: App.account });
        
        App.hidePendingPopup();
        await App.updateBalance();
        const txHash = tx.transactionHash;
        App.showSuccessPopup("Deposit to layer successful! You will need to wait 12 hours before you can claim your tokens on Tellor Layer.", txHash, 'ethereum');
    } catch (error) {
        App.hidePendingPopup();
        console.error("Error in depositing to layer:", error);
        alert(error.message || "Error in depositing to layer. Please try again.");
    }
  },

  initInputValidation: function() {
    const depositButton = document.getElementById('depositButton');
    const stakeAmountInput = document.getElementById('stakeAmount');
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    
    // Preserve the original input widths
    const originalWidth = stakeAmountInput.offsetWidth;
    stakeAmountInput.style.width = originalWidth + 'px';
    if (ethStakeAmountInput) {
        ethStakeAmountInput.style.width = originalWidth + 'px';
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.display = 'none';
    tooltip.style.position = 'fixed';
    tooltip.style.backgroundColor = '#d4d8e3';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.border = '1px solid black';
    tooltip.style.fontSize = '14px';
    tooltip.style.color = '#083b44';
    tooltip.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    tooltip.style.zIndex = '1000';
    tooltip.style.whiteSpace = 'nowrap';
    document.body.appendChild(tooltip);

    // Position tooltip relative to the active input field
    function positionTooltip() {
        const activeInput = App.currentBridgeDirection === 'layer' ? stakeAmountInput : ethStakeAmountInput;
        if (!activeInput) return;

        const inputRect = activeInput.getBoundingClientRect();
        tooltip.style.left = (inputRect.right + 10) + 'px';
        tooltip.style.top = (inputRect.top + (inputRect.height / 2)) + 'px';
        tooltip.style.transform = 'translateY(-50%)';
    }

    let trbPrice = 0;
    // Fetch TRB price from CoinGecko API
    async function updateTrbPrice() {
      try {
        const response = await fetch('https://node-palmito.tellorlayer.com/tellor-io/layer/oracle/get_current_aggregate_report/5c13cd9c97dbb98f2429c101a2a8150e6c7a0ddaff6124ee176a3a411067ded0', {
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
        console.warn('Error fetching TRB price from Tellor Layer:', error);
        trbPrice = 0.5; // Default value in USD
      }
    }

    // Update tooltip with USD value
    async function updateTooltip(event) {
        const activeInput = App.currentBridgeDirection === 'layer' ? stakeAmountInput : ethStakeAmountInput;
        if (!activeInput) return;

        const amount = parseFloat(activeInput.value) || 0;
        if (amount > 0) {
            if (trbPrice === 0) {
                await updateTrbPrice();
            }
            if (trbPrice > 0) {
                const usdValue = (amount * trbPrice).toFixed(2);
                tooltip.textContent = `≈ $${usdValue} USD`;
            } else {
                tooltip.textContent = 'Price data unavailable';
            }
            tooltip.style.display = 'block';
            requestAnimationFrame(positionTooltip);
        } else {
            tooltip.style.display = 'none';
        }
    }

    // Update price every 60 seconds, but only if the page is visible
    let priceUpdateInterval;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(priceUpdateInterval);
      } else {
    updateTrbPrice();
        priceUpdateInterval = setInterval(updateTrbPrice, 60000);
      }
    });

    // Initial price fetch
    updateTrbPrice().catch(error => {
      console.warn('Initial TRB price fetch failed:', error);
    });
    priceUpdateInterval = setInterval(updateTrbPrice, 60000);

    // Add event listeners to both input fields
    stakeAmountInput.addEventListener('input', updateTooltip);
    stakeAmountInput.addEventListener('focus', updateTooltip);
    if (ethStakeAmountInput) {
        ethStakeAmountInput.addEventListener('input', updateTooltip);
        ethStakeAmountInput.addEventListener('focus', updateTooltip);
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
      console.error('Wallet not connected or contracts not initialized');
      return '0';
    }

    try {
      const allowance = await App.contracts.Token.methods.allowance(
        App.account,
        App.contracts.Bridge.options.address
      ).call();
      return allowance;
    } catch (error) {
      console.error('Error fetching allowance:', error);
      return '0';
    }
  },

  updateBalance: async function() {
    if (!App.contracts.Token || !App.account) return;
    
    try {
        const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
        const readableBalance = App.web3.utils.fromWei(balance, 'ether');
        const formattedBalance = parseFloat(readableBalance).toFixed(6);
        
        // Update both balance displays regardless of current direction
        const layerBalanceElement = document.getElementById("currentBalance");
        const ethBalanceElement = document.getElementById("ethMetaMaskBalance");
        
        if (layerBalanceElement) {
            layerBalanceElement.textContent = `${formattedBalance} TRB`;
        }
        if (ethBalanceElement) {
            ethBalanceElement.textContent = `${formattedBalance} TRB`;
        }
    } catch (error) {
        console.error("Error fetching balance:", error);
        // Set both balances to 0 on error
        const layerBalanceElement = document.getElementById("currentBalance");
        const ethBalanceElement = document.getElementById("ethMetaMaskBalance");
        
        if (layerBalanceElement) layerBalanceElement.textContent = "0.000000 TRB";
        if (ethBalanceElement) ethBalanceElement.textContent = "0.000000 TRB";
    }
  },

  withdrawFromLayer: async function() {
    try {
        if (!App.isKeplrConnected) {
            alert('Please connect your Keplr wallet first');
            return;
        }

        const amount = document.getElementById('ethStakeAmount').value;
        const ethereumAddress = document.getElementById('ethQueryId').value;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!ethereumAddress || !ethereumAddress.startsWith('0x')) {
            alert('Please enter a valid Ethereum address');
            return;
        }

        // Convert amount to micro units (1 TRB = 1,000,000 micro units)
        const amountInMicroUnits = Math.floor(parseFloat(amount) * 1000000).toString();
        
        // Validate amount is positive and reasonable
        if (parseInt(amountInMicroUnits) <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        // Get offline signer from wallet adapter or Keplr
        let offlineSigner;
        if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
            offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
        } else {
            offlineSigner = window.keplr.getOfflineSigner('layertest-4');
        }

        // Create the client using the stargate implementation
        const client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            'https://node-palmito.tellorlayer.com',
            offlineSigner
        );

        console.log('Created stargate client with RPC URL:', client.rpcUrl);

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
        console.log('About to sign and broadcast with message:', msg);
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

        console.log('Withdrawal result:', result);
        console.log('Result type:', typeof result);
        console.log('Result keys:', Object.keys(result));

        console.log('Hiding pending popup');
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
                console.error('No transaction hash found in result:', result);
                App.showErrorPopup("Transaction successful but no hash found. Please check your wallet.");
                return result;
            }
            
            console.log('Transaction hash:', txHash);
            console.log('Full result object:', result);
            
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
            
            console.log('Hash formats to try:', hashFormats);
            console.log('Explorer URLs to try:', explorerUrls.map(base => hashFormats.map(h => base + h)).flat());
            
            // Wait a moment for transaction to be indexed
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify transaction exists on blockchain
            let transactionConfirmed = false;
            try {
                const verifyResponse = await fetch(`https://node-palmito.tellorlayer.com/cosmos/tx/v1beta1/txs/${txHash}`);
                if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    console.log('Transaction verification:', verifyData);
                    if (verifyData.tx_response && verifyData.tx_response.code === 0) {
                        console.log('Transaction confirmed on blockchain');
                        transactionConfirmed = true;
                        
                        // Check for withdrawal-specific events
                        const events = verifyData.tx_response.events || [];
                        const withdrawEvent = events.find(event => event.type === 'tokens_withdrawn');
                        if (withdrawEvent) {
                            console.log('Withdrawal event found:', withdrawEvent);
                        } else {
                            console.warn('No withdrawal event found in successful transaction');
                        }
                    } else {
                        console.log('Transaction verification failed - checking alternative endpoints');
                        console.warn('Transaction not found or failed on blockchain');
                        console.log('Transaction error details:', {
                            code: verifyData.tx_response?.code,
                            raw_log: verifyData.tx_response?.raw_log,
                            events: verifyData.tx_response?.events
                        });
                        
                        // Try alternative endpoints
                        const altEndpoints = [
                            `https://node-palmito.tellorlayer.com/rpc/tx?hash=0x${txHash}&prove=false`,
                            `https://node-palmito.tellorlayer.com/cosmos/tx/v1beta1/txs/${txHash.toUpperCase()}`,
                            `https://node-palmito.tellorlayer.com/cosmos/tx/v1beta1/txs/${txHash.toLowerCase()}`
                        ];
                        
                        for (const endpoint of altEndpoints) {
                            try {
                                const altResponse = await fetch(endpoint);
                                if (altResponse.ok) {
                                    const altData = await altResponse.json();
                                    console.log(`Alternative endpoint ${endpoint} result:`, altData);
                                    if (altData.tx_response && altData.tx_response.code === 0) {
                                        transactionConfirmed = true;
                                        console.log('Transaction confirmed via alternative endpoint');
                                    }
                                    break;
                                }
                            } catch (altError) {
                                console.warn(`Alternative endpoint ${endpoint} failed:`, altError);
                            }
                        }
                    }
                } else {
                    console.warn('Could not verify transaction on blockchain');
                }
            } catch (error) {
                console.warn('Error verifying transaction:', error);
            }
            
            console.log('Transaction verification completed. transactionConfirmed:', transactionConfirmed);
        
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
        console.error('Withdrawal error:', error);
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
        const baseEndpoint = 'https://node-palmito.tellorlayer.com';
        
        // Get last withdrawal ID with proper error handling
        const response = await fetch(`${baseEndpoint}/layer/bridge/get_last_withdrawal_id`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch last withdrawal ID:', response.status);
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
        console.error('Error in getWithdrawalHistory:', error);
        return [];
    }
  },

  fetchWithdrawalData: async function(queryId, retryCount = 0) {
    try {
        const endpoint = `https://node-palmito.tellorlayer.com/tellor-io/layer/oracle/get_current_aggregate_report/${queryId}`;
        
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
        console.error('Error in fetchWithdrawalData:', error);
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
        console.error('Error parsing withdrawal data:', error);
        return null;
    }
  },

  // Function to update withdrawal history UI
  updateWithdrawalHistory: async function() {
    try {
        const transactions = await this.getWithdrawalHistory();

        const tableBody = document.querySelector('#withdrawal-history tbody');
        if (!tableBody) {
            console.error('Transaction history table body not found');
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
                    <td colspan="7" style="padding: 40px 20px; text-align: center; border: none;">
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">
                                Connect MetaMask to View Withdrawals
                            </h4>
                            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">
                                Please connect your MetaMask wallet to view and manage your withdrawal transactions.
                            </p>
                            <p style="margin: 0; color: #718096; font-size: 14px;">
                                Note: You need MetaMask connected to claim your withdrawals on Ethereum.
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
                                <span>2. Request</span><span>Attestation</span>
                            </button>
                            <button class="claim-button" onclick="App.claimWithdrawal(${tx.id})" 
                                style="background-color: #38a169; color: #eefffb; border: none;">
                                <span>3. Claim</span><span>Withdrawal</span>
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
                console.error('Error formatting transaction:', tx, error);
            }
        }
    } catch (error) {
        console.error('Error updating transaction history:', error);
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
    const popup = document.createElement('div');
    popup.id = 'balanceErrorPopup';
    popup.className = 'balance-error-popup';
    popup.textContent = message;
    
    document.body.appendChild(popup);
    
    // Remove the popup after 3 seconds
    setTimeout(() => {
      const popup = document.getElementById('balanceErrorPopup');
      if (popup) {
        popup.remove();
      }
    }, 3000);
  },

  hideBalanceErrorPopup: function() {
    const popup = document.getElementById('balanceErrorPopup');
    if (popup) {
      popup.remove();
    }
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
                await window.keplr.enable('layertest-4');
            } else {
                throw new Error('No wallet available');
            }
        } catch (error) {
            console.error('Wallet not enabled for chain:', error);
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
            alert('Please enter a valid amount');
            return;
        }

        if (!validatorAddress || !validatorAddress.trim()) {
            alert('Please select a validator from the dropdown');
            return;
        }

        // Validate validator address format (should start with tellorvaloper)
        if (!validatorAddress.startsWith('tellorvaloper')) {
            alert('Please select a valid validator from the dropdown');
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
            offlineSigner = window.keplr.getOfflineSigner('layertest-4');
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
        } else {
            throw new Error(result?.rawLog || "Delegation failed");
        }
    } catch (error) {
        console.error('Error delegating tokens:', error);
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
                await window.keplr.enable('layertest-4');
            } else {
                throw new Error('No wallet available');
            }
        } catch (error) {
            console.error('Wallet not enabled for chain:', error);
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
        const response = await fetch(`https://node-palmito.tellorlayer.com/tellor-io/layer/oracle/get_current_aggregate_report/${queryId}`);
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
            offlineSigner = window.keplr.getOfflineSigner('layertest-4');
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
        console.error('Error requesting attestation:', error);
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
                    console.error('Invalid validator structure:', validator);
                    throw new Error(`Invalid validator at index ${i}: missing required fields`);
                }

                // Validate address format
                try {
                    ethers.utils.getAddress(validator.addr);
                } catch (e) {
                    console.error('Invalid validator address:', validator.addr);
                    throw new Error(`Invalid validator at index ${i}: invalid address format`);
                }

                // Validate power is a positive number
                if (!ethers.BigNumber.from(validator.power).gt(0)) {
                    console.error('Invalid validator power:', validator.power);
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
            console.error('Validation error:', error);
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
        console.log('Withdrawal timestamp:', withdrawalTimestamp);

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
        console.log('Withdrawal claim transaction:', tx);
        App.showSuccessPopup("Withdrawal claimed successfully!", txHash, 'ethereum');
        await this.updateWithdrawalHistory();
        return tx;

    } catch (error) {
        console.error('Error claiming withdrawal:', error);
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
        const baseEndpoint = 'https://node-palmito.tellorlayer.com';
        
        // Step 1: Get snapshots for this report
        const snapshotsResponse = await fetch(
            `${baseEndpoint}/layer/bridge/get_snapshots_by_report/${apiQueryId}/${timestamp}`
        );

        if (!snapshotsResponse.ok) {
            const errorText = await snapshotsResponse.text();
            console.error('Snapshots response error:', { status: snapshotsResponse.status, text: errorText });
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
        console.error('Error in fetchAttestationData:', error);
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
    console.log('Message hash for signature recovery:', messageHash);
    
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
            console.error(`Invalid signature length at index ${i}:`, signature.length);
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
                console.error(`Error recovering address for v=${v}:`, error);
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
    const bridgeToLayerBtn = document.getElementById('bridgeToLayerBtn');
    const bridgeToEthBtn = document.getElementById('bridgeToEthBtn');
    const delegateBtn = document.getElementById('delegateBtn');
    const bridgeToLayerSection = document.getElementById('bridgeToLayerSection');
    const bridgeToEthSection = document.getElementById('bridgeToEthSection');
    const delegateSection = document.getElementById('delegateSection');
    const transactionsContainer = document.getElementById('bridgeTransactionsContainer');

    if (!bridgeToLayerBtn || !bridgeToEthBtn || !delegateBtn || !bridgeToLayerSection || !bridgeToEthSection || !delegateSection) {
        console.error('Bridge direction UI elements not found');
        return;
    }

    // Set initial state
    this.currentBridgeDirection = 'layer';
    bridgeToLayerBtn.classList.add('active');
    bridgeToLayerSection.classList.add('active');
    bridgeToEthSection.classList.remove('active');
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

    // Add click event listeners
    bridgeToLayerBtn.addEventListener('click', () => {
        if (this.currentBridgeDirection !== 'layer') {
            this.switchBridgeDirection('layer');
        }
    });

    bridgeToEthBtn.addEventListener('click', () => {
        if (this.currentBridgeDirection !== 'ethereum') {
            this.switchBridgeDirection('ethereum');
        }
    });

    delegateBtn.addEventListener('click', () => {
        if (this.currentBridgeDirection !== 'delegate') {
            this.switchBridgeDirection('delegate');
        }
    });
  },

  switchBridgeDirection: function(direction) {
    if (direction !== 'layer' && direction !== 'ethereum' && direction !== 'delegate') {
        console.error('Invalid bridge direction:', direction);
        return;
    }

    const bridgeToLayerBtn = document.getElementById('bridgeToLayerBtn');
    const bridgeToEthBtn = document.getElementById('bridgeToEthBtn');
    const delegateBtn = document.getElementById('delegateBtn');
    const bridgeToLayerSection = document.getElementById('bridgeToLayerSection');
    const bridgeToEthSection = document.getElementById('bridgeToEthSection');
    const delegateSection = document.getElementById('delegateSection');
    const transactionsContainer = document.getElementById('bridgeTransactionsContainer');
    const boxWrapper = document.querySelector('.box-wrapper');

    if (!bridgeToLayerBtn || !bridgeToEthBtn || !delegateBtn || !bridgeToLayerSection || !bridgeToEthSection || !delegateSection) {
        console.error('Bridge direction UI elements not found');
        return;
    }

    // Update active states
    bridgeToLayerBtn.classList.toggle('active', direction === 'layer');
    bridgeToEthBtn.classList.toggle('active', direction === 'ethereum');
    delegateBtn.classList.toggle('active', direction === 'delegate');
    bridgeToLayerSection.classList.toggle('active', direction === 'layer');
    bridgeToEthSection.classList.toggle('active', direction === 'ethereum');
    delegateSection.classList.toggle('active', direction === 'delegate');
    
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
    
    // Update balances when switching directions
    if (App.isConnected) {
        App.updateBalance().catch(error => {
            console.error("Error updating MetaMask balance:", error);
        });
    }
    if (App.isKeplrConnected) {
        App.updateKeplrBalance().catch(error => {
            console.error("Error updating Keplr balance:", error);
        });
    }
    
    // Populate validator dropdown when switching to delegate section
    if (direction === 'delegate') {
        this.populateValidatorDropdown();
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
        
        if (App.isKeplrConnected) {
            if (withdrawButton) withdrawButton.disabled = false;
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

  // Add new function to fetch validators from Layer network
  fetchValidators: async function() {
    try {
      const response = await fetch('https://node-palmito.tellorlayer.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1000');
      
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

  // Add function to populate validator dropdown
  populateValidatorDropdown: async function() {
    try {
      const dropdown = document.getElementById('delegateValidatorDropdown');
      if (!dropdown) {
        console.error('Validator dropdown not found');
        return;
      }
      
      // Show loading state
      dropdown.innerHTML = '<option value="">Loading validators...</option>';
      dropdown.disabled = true;
      
      const validators = await this.fetchValidators();
      
      // Clear loading state and populate dropdown
      dropdown.innerHTML = '<option value="">Select a validator...</option>';
      
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
                        option.textContent = `${displayMoniker} (${votingPower} TRB, ${commission}%)`;
                        option.title = `${validator.moniker} (${votingPower} TRB, ${commission}% commission)`; // Full name in tooltip
                        dropdown.appendChild(option);
                    }
                });
      
      dropdown.disabled = false;
      
      // Add change event listener to update the hidden input
      dropdown.addEventListener('change', function() {
        const hiddenInput = document.getElementById('delegateValidatorAddress');
        if (hiddenInput) {
          hiddenInput.value = this.value;
        }
      });
      
      // Add refresh button event listener
      const refreshBtn = document.getElementById('refreshValidatorsBtn');
      if (refreshBtn) {
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
      
    } catch (error) {
      console.error('Error populating validator dropdown:', error);
      const dropdown = document.getElementById('delegateValidatorDropdown');
      if (dropdown) {
        dropdown.innerHTML = '<option value="">Error loading validators</option>';
        dropdown.disabled = true;
      }
    }
  },
};

// Export App to window object for global access
window.App = App;
window.App.claimWithdrawal = App.claimWithdrawal;  // Explicitly expose claimWithdrawal
window.App.requestAttestation = App.requestAttestation;  // Also explicitly expose requestAttestation

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
                console.error('Failed to initialize app:', error);
                App.handleError(error);
            });
        } catch (error) {
            console.error('App initialization failed:', error);
            // Show user-friendly error message but keep button enabled
            const walletButton = document.getElementById("walletButton");
            if (walletButton) {
                walletButton.textContent = 'Connect Wallet';
                walletButton.disabled = false;
            }
        }
    });
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
    console.error("Error checking balance:", error);
    return false;
  }
}

const SUPPORTED_CHAIN_IDS = {
    11155111: 'Sepolia'  // Only Sepolia is supported for now
};

function validateChainId(chainId) {
    if (!chainId || !SUPPORTED_CHAIN_IDS[chainId]) {
        throw new Error(`Please connect to Sepolia (chain ID: 11155111). Mainnet support coming soon.`);
    }
    return true;
}