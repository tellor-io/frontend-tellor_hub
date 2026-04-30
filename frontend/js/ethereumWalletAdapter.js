/**
 * Ethereum Wallet Adapter
 * Supports multiple Ethereum wallets with a unified interface
 */

class EthereumWalletAdapter {
    constructor() {
        this.currentProvider = null;
        this.currentWallet = null;
        this.walletConnectProvider = null;
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        this.web3 = null;
        this.ethers = null;
        this.debug = typeof window !== 'undefined' &&
            window.localStorage &&
            window.localStorage.getItem('tellor_debug_wallets') === '1';

        // Keep stable listener references so removeListener works correctly.
        this.boundHandleAccountsChanged = this.handleAccountsChanged.bind(this);
        this.boundHandleChainChanged = this.handleChainChanged.bind(this);
        this.boundHandleDisconnect = this.handleDisconnect.bind(this);
        
        // Supported wallet types
        this.supportedWallets = {
            'metamask': {
                name: 'MetaMask',
                priority: 1,
                check: () => !!this.getInjectedProviderForType('metamask'),
                connect: this.connectMetaMask.bind(this)
            },
            'walletconnect': {
                name: 'WalletConnect',
                priority: 2,
                check: () => typeof window.WalletConnectProvider !== 'undefined',
                connect: this.connectWalletConnect.bind(this)
            },
            'coinbase': {
                name: 'Coinbase Wallet',
                priority: 3,
                check: () => !!this.getInjectedProviderForType('coinbase'),
                connect: this.connectCoinbase.bind(this)
            },
            'trust': {
                name: 'Trust Wallet',
                priority: 4,
                check: () => !!this.getInjectedProviderForType('trust'),
                connect: this.connectTrust.bind(this)
            },
            'rainbow': {
                name: 'Rainbow',
                priority: 5,
                check: () => !!this.getInjectedProviderForType('rainbow'),
                connect: this.connectRainbow.bind(this)
            }
        };
    }

    debugLog(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }

    getInjectedProviders() {
        if (typeof window.ethereum === 'undefined') {
            return [];
        }
        if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
            return window.ethereum.providers;
        }
        return [window.ethereum];
    }

    getInjectedProviderForType(type) {
        const providers = this.getInjectedProviders();
        if (providers.length === 0) return null;

        const matchers = {
            metamask: (provider) => provider && provider.isMetaMask,
            coinbase: (provider) => provider && provider.isCoinbaseWallet,
            trust: (provider) => provider && provider.isTrust,
            rainbow: (provider) => provider && provider.isRainbow,
            generic: (provider) => provider && typeof provider.request === 'function'
        };
        const matcher = matchers[type] || matchers.generic;
        return providers.find(matcher) || null;
    }

    // Detect available wallets
    detectWallets() {
        const availableWallets = [];
        
        
        for (const [type, wallet] of Object.entries(this.supportedWallets)) {
            try {
                if (wallet.check()) {
                    availableWallets.push({
                        type: type,
                        name: wallet.name,
                        priority: wallet.priority,
                        provider: this.getProviderForType(type)
                    });
                }
            } catch (error) {
                console.warn(`Error detecting ${wallet.name}:`, error);
            }
        }
        
        // Also check for generic ethereum provider
        if (typeof window.ethereum !== 'undefined' && availableWallets.length === 0) {
            availableWallets.push({
                type: 'generic',
                name: 'Ethereum Provider',
                priority: 10,
                provider: window.ethereum
            });
        }
        
        return availableWallets.sort((a, b) => a.priority - b.priority);
    }

    // Get provider for wallet type
    getProviderForType(type) {
        switch (type) {
            case 'metamask':
            case 'coinbase':
            case 'trust':
            case 'rainbow':
                return this.getInjectedProviderForType(type);
            case 'walletconnect':
                return this.walletConnectProvider;
            case 'generic':
                return this.getInjectedProviderForType('generic');
            default:
                return null;
        }
    }

    // Create WalletConnect provider
    createWalletConnectProvider() {
        if (typeof window.WalletConnectProvider === 'undefined') {
            throw new Error('WalletConnect not available');
        }
        
        return new window.WalletConnectProvider({
            infuraId: '52474cef7b964b4fbf8e954a5dfa481b', // Use existing Infura ID
            rpc: {
                1: 'https://mainnet.infura.io/v3/52474cef7b964b4fbf8e954a5dfa481b',
                11155111: 'https://sepolia.infura.io/v3/52474cef7b964b4fbf8e954a5dfa481b'
            }
        });
    }

    // Connect to a specific wallet
    async connectToWallet(walletType = null) {
        const availableWallets = this.detectWallets();
        
        if (availableWallets.length === 0) {
            throw new Error('No Ethereum wallets detected. Please install MetaMask, WalletConnect, or another compatible wallet.');
        }
        
        // If no specific wallet type requested, use the first available
        const walletToUse = walletType 
            ? availableWallets.find(w => w.type === walletType)
            : availableWallets[0];
            
        if (!walletToUse) {
            throw new Error(`Wallet type '${walletType}' not found. Available wallets: ${availableWallets.map(w => w.name).join(', ')}`);
        }
        
        this.debugLog(`Connecting to ${walletToUse.name}...`);
        
        // Connect using the appropriate method
        const connectionResult = await this.supportedWallets[walletToUse.type]?.connect() || 
                                this.connectGeneric(walletToUse.provider);
        
        // Set wallet state
        this.currentWallet = walletToUse;
        this.currentProvider = connectionResult.provider || walletToUse.provider;
        this.isConnected = true;
        this.account = connectionResult.account;
        this.chainId = connectionResult.chainId;
        this.web3 = connectionResult.web3;
        this.ethers = connectionResult.ethers;
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.debugLog(`Connected to ${walletToUse.name}: ${this.account}`);
        
        return {
            walletName: walletToUse.name,
            walletType: walletToUse.type,
            account: this.account,
            chainId: this.chainId,
            provider: this.currentProvider,
            web3: this.web3,
            ethers: this.ethers
        };
    }

    // Connect to MetaMask
    async connectMetaMask() {
        const provider = this.getInjectedProviderForType('metamask');
        if (!provider) {
            throw new Error('MetaMask not available');
        }

        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in MetaMask');
            }

            const chainId = await this.getChainId(provider);
            const web3 = new Web3(provider);
            const ethers = window.ethers;

            return {
                account: accounts[0],
                chainId: chainId,
                web3: web3,
                ethers: ethers,
                provider: provider
            };
        } catch (error) {
            // Handle Chrome extension errors gracefully
            if (error.message && error.message.includes('chrome.runtime.sendMessage')) {
                console.warn('Chrome extension error detected, this is normal for wallet integration');
                // Continue with the connection as the error is just a warning
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in wallet');
                }

                const chainId = await this.getChainId(provider);
                const web3 = new Web3(provider);
                const ethers = window.ethers;

                return {
                    account: accounts[0],
                    chainId: chainId,
                    web3: web3,
                    ethers: ethers,
                    provider: provider
                };
            }
            throw error;
        }
    }

    // Connect to WalletConnect
    async connectWalletConnect() {
        if (!this.walletConnectProvider) {
            this.walletConnectProvider = this.createWalletConnectProvider();
        }
        const provider = this.walletConnectProvider;
        
        try {
            await provider.enable();
            const web3 = new Web3(provider);
            const accounts = await web3.eth.getAccounts();
            const chainId = await web3.eth.getChainId();
            const ethers = window.ethers;

            return {
                account: accounts[0],
                chainId: chainId,
                web3: web3,
                ethers: ethers,
                provider: provider
            };
        } catch (error) {
            throw new Error(`WalletConnect connection failed: ${error.message}`);
        }
    }

    // Connect to Coinbase Wallet
    async connectCoinbase() {
        const provider = this.getInjectedProviderForType('coinbase');
        if (!provider) {
            throw new Error('Coinbase Wallet not available');
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found in Coinbase Wallet');
        }

        const chainId = await this.getChainId(provider);
        const web3 = new Web3(provider);
        const ethers = window.ethers;

        return {
            account: accounts[0],
            chainId: chainId,
            web3: web3,
            ethers: ethers,
            provider: provider
        };
    }

    // Connect to Trust Wallet
    async connectTrust() {
        const provider = this.getInjectedProviderForType('trust');
        if (!provider) {
            throw new Error('Trust Wallet not available');
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found in Trust Wallet');
        }

        const chainId = await this.getChainId(provider);
        const web3 = new Web3(provider);
        const ethers = window.ethers;

        return {
            account: accounts[0],
            chainId: chainId,
            web3: web3,
            ethers: ethers,
            provider: provider
        };
    }

    // Connect to Rainbow
    async connectRainbow() {
        const provider = this.getInjectedProviderForType('rainbow');
        if (!provider) {
            throw new Error('Rainbow not available');
        }

        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in Rainbow');
            }

            const chainId = await this.getChainId(provider);
            const web3 = new Web3(provider);
            const ethers = window.ethers;

            return {
                account: accounts[0],
                chainId: chainId,
                web3: web3,
                ethers: ethers,
                provider: provider
            };
        } catch (error) {
            // Handle Chrome extension errors gracefully
            if (error.message && error.message.includes('chrome.runtime.sendMessage')) {
                console.warn('Chrome extension error detected, this is normal for wallet integration');
                // Continue with the connection as the error is just a warning
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in wallet');
                }

                const chainId = await this.getChainId(provider);
                const web3 = new Web3(provider);
                const ethers = window.ethers;

                return {
                    account: accounts[0],
                    chainId: chainId,
                    web3: web3,
                    ethers: ethers,
                    provider: provider
                };
            }
            throw error;
        }
    }

    // Connect to generic provider
    async connectGeneric(provider) {
        if (!provider) {
            throw new Error('No provider available');
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
        }

        const chainId = await this.getChainId(provider);
        const web3 = new Web3(provider);
        const ethers = window.ethers;

        return {
            account: accounts[0],
            chainId: chainId,
            web3: web3,
            ethers: ethers,
            provider: provider
        };
    }

    // Get chain ID from provider
    async getChainId(provider) {
        try {
            const chainId = await provider.request({ method: 'eth_chainId' });
            return typeof chainId === 'string' && chainId.startsWith('0x') 
                ? parseInt(chainId, 16) 
                : parseInt(chainId);
        } catch (error) {
            // Handle Chrome extension errors gracefully
            if (error.message && error.message.includes('chrome.runtime.sendMessage')) {
                console.warn('Chrome extension error in getChainId, this is normal for MetaMask');
                // Try alternative method
                try {
                    const web3 = new Web3(provider);
                    return await web3.eth.getChainId();
                } catch (web3Error) {
                    console.warn('Failed to get chain ID via Web3 fallback:', web3Error);
                    return null;
                }
            }
            console.warn('Failed to get chain ID from provider:', error);
            return null;
        }
    }

    // Switch to specific chain
    async switchChain(chainId) {
        if (!this.currentProvider) {
            throw new Error('No wallet connected');
        }

        const chainIdHex = '0x' + chainId.toString(16);
        
        try {
            await this.currentProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }]
            });
            
            // Update our chain ID
            this.chainId = chainId;
            return true;
        } catch (error) {
            if (error.code === 4902) {
                // Chain not added, try to add it
                return await this.addChain(chainId);
            }
            throw error;
        }
    }

    // Add chain to wallet
    async addChain(chainId) {
        const chainConfigs = {
            1: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://mainnet.infura.io/v3/52474cef7b964b4fbf8e954a5dfa481b'],
                blockExplorerUrls: ['https://etherscan.io']
            },
            11155111: {
                chainId: '0xaa36a7',
                chainName: 'Sepolia',
                nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://sepolia.infura.io/v3/52474cef7b964b4fbf8e954a5dfa481b'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
            }
        };

        const config = chainConfigs[chainId];
        if (!config) {
            throw new Error(`Chain configuration not found for chain ID: ${chainId}`);
        }

        try {
            await this.currentProvider.request({
                method: 'wallet_addEthereumChain',
                params: [config]
            });
            
            this.chainId = chainId;
            return true;
        } catch (error) {
            throw new Error(`Failed to add chain: ${error.message}`);
        }
    }

    // Set up event listeners
    setupEventListeners() {
        if (!this.currentProvider) return;

        // Remove existing listeners
        this.removeEventListeners();

        // Add new listeners
        this.currentProvider.on('accountsChanged', this.boundHandleAccountsChanged);
        this.currentProvider.on('chainChanged', this.boundHandleChainChanged);
        this.currentProvider.on('disconnect', this.boundHandleDisconnect);
    }

    // Remove event listeners
    removeEventListeners() {
        if (!this.currentProvider) return;

        try {
            this.currentProvider.removeListener('accountsChanged', this.boundHandleAccountsChanged);
            this.currentProvider.removeListener('chainChanged', this.boundHandleChainChanged);
            this.currentProvider.removeListener('disconnect', this.boundHandleDisconnect);
        } catch (error) {
            console.warn('Error removing event listeners:', error);
        }
    }

    // Handle account changes
    handleAccountsChanged(accounts) {
        if (!accounts || accounts.length === 0) {
            this.disconnect();
        } else {
            this.account = accounts[0];
            this.debugLog('Account changed to:', this.account);
        }
    }

    // Handle chain changes
    handleChainChanged(chainId) {
        this.chainId = typeof chainId === 'string' && chainId.startsWith('0x') 
            ? parseInt(chainId, 16) 
            : parseInt(chainId);
        this.debugLog('Chain changed to:', this.chainId);
    }

    // Handle disconnect
    handleDisconnect() {
        this.debugLog('Wallet disconnected');
        this.disconnect();
    }

    // Disconnect wallet
    disconnect() {
        this.removeEventListeners();
        
        // Disconnect WalletConnect if used
        if (this.currentProvider && this.currentProvider.disconnect) {
            try {
                this.currentProvider.disconnect();
            } catch (error) {
                console.warn('Error disconnecting provider:', error);
            }
        }

        // Reset state
        this.currentProvider = null;
        this.currentWallet = null;
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        this.web3 = null;
        this.ethers = null;
        this.walletConnectProvider = null;

        this.debugLog('Wallet disconnected successfully');
    }

    // Get current connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            walletName: this.currentWallet?.name || null,
            walletType: this.currentWallet?.type || null,
            account: this.account,
            chainId: this.chainId
        };
    }

    // Check if wallet is connected
    isWalletConnected() {
        return this.isConnected && this.account && this.currentProvider;
    }

    // Test function to verify connection
    async testConnection() {
        this.debugLog('=== Ethereum Wallet Adapter Test ===');
        this.debugLog('Current state:', {
            isConnected: this.isConnected,
            account: this.account,
            chainId: this.chainId,
            currentWallet: this.currentWallet?.name,
            currentProvider: !!this.currentProvider
        });
        
        if (this.isConnected) {
            try {
                const balance = await this.web3.eth.getBalance(this.account);
                this.debugLog('Account balance:', this.web3.utils.fromWei(balance, 'ether'), 'ETH');
                return true;
            } catch (error) {
                console.error('Error getting balance:', error);
                return false;
            }
        } else {
            this.debugLog('No wallet connected');
            return false;
        }
    }
}

// Create global instance
window.ethereumWalletAdapter = new EthereumWalletAdapter(); 