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
        // EIP-6963 announcements, keyed by uuid. The first announcement for a
        // uuid wins so a later injector cannot replace the provider the user pinned.
        this.announcedByUuid = new Map();
        this.pinnedIdentity = null;
        this.requestEip6963Providers();
        
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

    // Official rdns values from the wallets. isMetaMask is not an identity:
    // Rabby, Brave, Phantom, and a malicious injector all set that flag.
    rdnsForType(type) {
        const rdns = {
            metamask: ['io.metamask', 'io.metamask.flask'],
            coinbase: ['com.coinbase.wallet'],
            trust: ['com.trustwallet.app'],
            rainbow: ['me.rainbow']
        };
        return rdns[type] || null;
    }

    typeForRdns(rdns) {
        const types = this.rdnsForType.bind(this);
        for (const type of ['metamask', 'coinbase', 'trust', 'rainbow']) {
            if (types(type).includes(rdns)) return type;
        }
        return null;
    }

    requestEip6963Providers() {
        if (typeof window === 'undefined') return;
        if (!this._eip6963Listening) {
            this._eip6963Listening = true;
            window.addEventListener('eip6963:announceProvider', (event) => {
                this.rememberAnnouncement(event && event.detail);
            });
        }
        window.dispatchEvent(new Event('eip6963:requestProvider'));
    }

    rememberAnnouncement(detail) {
        if (!detail || !detail.info || !detail.provider || typeof detail.provider.request !== 'function') return;
        const uuid = String(detail.info.uuid || '');
        const rdns = String(detail.info.rdns || '');
        if (!uuid || !rdns) return;
        if (this.announcedByUuid.has(uuid)) return;
        this.announcedByUuid.set(uuid, detail);
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

    isAnnouncedProvider(provider) {
        for (const detail of this.announcedByUuid.values()) {
            if (detail.provider === provider) return true;
        }
        return false;
    }

    // Legacy fallback for a page with one injected wallet and no EIP-6963 event.
    // A second provider that only sets isMetaMask is not a match.
    legacyType(provider) {
        if (!provider || typeof provider.request !== 'function') return null;
        if (provider.isCoinbaseWallet) return 'coinbase';
        if (provider.isTrust || provider.isTrustWallet) return 'trust';
        if (provider.isRainbow) return 'rainbow';
        if (provider.isRabby || provider.isBraveWallet || provider.isPhantom || provider.isOkxWallet) return null;
        if (provider.isMetaMask) return 'metamask';
        return null;
    }

    getLegacyProviderForType(type) {
        const providers = this.getInjectedProviders().filter((provider) => !this.isAnnouncedProvider(provider));
        if (type === 'generic') {
            return providers.length === 1 ? providers[0] : null;
        }
        const matches = providers.filter((provider) => this.legacyType(provider) === type);
        return matches.length === 1 ? matches[0] : null;
    }

    getInjectedProviderForType(type) {
        const rdnsList = this.rdnsForType(type);
        if (rdnsList) {
            const matches = [...this.announcedByUuid.values()].filter((detail) => rdnsList.includes(detail.info.rdns));
            if (matches.length === 1) return matches[0].provider;
        }
        return this.getLegacyProviderForType(type);
    }

    selectWalletEntry(availableWallets, walletType, pin) {
        if (pin && pin.uuid) {
            return availableWallets.find((wallet) => wallet.uuid === pin.uuid) || null;
        }
        if (pin && pin.rdns) {
            const byRdns = availableWallets.filter((wallet) => wallet.rdns === pin.rdns);
            return byRdns.length === 1 ? byRdns[0] : null;
        }
        if (!walletType) return availableWallets[0] || null;

        const byUuid = availableWallets.find((wallet) => wallet.uuid === walletType);
        if (byUuid) return byUuid;

        const byRdns = availableWallets.filter((wallet) => wallet.rdns === walletType);
        if (byRdns.length === 1) return byRdns[0];

        const byType = availableWallets.filter((wallet) => wallet.type === walletType);
        if (byType.length === 1) return byType[0];
        const preferred = this.rdnsForType(walletType);
        if (preferred && byType.length > 1) {
            const preferredMatches = byType.filter((wallet) => wallet.rdns === preferred[0]);
            if (preferredMatches.length === 1) return preferredMatches[0];
        }
        return null;
    }

    // Detect available wallets. Each EIP-6963 announcement is its own row.
    // Legacy isMetaMask matching is only used when that wallet did not announce
    // and it is the only provider of its type.
    detectWallets() {
        this.requestEip6963Providers();
        const availableWallets = [];
        const coveredTypes = new Set();

        for (const detail of this.announcedByUuid.values()) {
            const rdns = String(detail.info.rdns);
            const type = this.typeForRdns(rdns) || rdns;
            const known = this.supportedWallets[type];
            availableWallets.push({
                type: type,
                name: detail.info.name || (known && known.name) || 'Ethereum Wallet',
                priority: known ? known.priority : 20,
                provider: detail.provider,
                rdns: rdns,
                uuid: String(detail.info.uuid),
                icon: detail.info.icon || null
            });
            if (known) coveredTypes.add(type);
        }

        for (const [type, wallet] of Object.entries(this.supportedWallets)) {
            if (type === 'walletconnect') {
                try {
                    if (wallet.check()) {
                        availableWallets.push({
                            type: type,
                            name: wallet.name,
                            priority: wallet.priority,
                            provider: null,
                            rdns: null,
                            uuid: null,
                            icon: null
                        });
                    }
                } catch (error) {
                    console.warn(`Error detecting ${wallet.name}:`, error);
                }
                continue;
            }
            if (coveredTypes.has(type)) continue;
            try {
                const provider = this.getLegacyProviderForType(type);
                if (provider) {
                    availableWallets.push({
                        type: type,
                        name: wallet.name,
                        priority: wallet.priority,
                        provider: provider,
                        rdns: null,
                        uuid: null,
                        icon: null
                    });
                }
            } catch (error) {
                console.warn(`Error detecting ${wallet.name}:`, error);
            }
        }

        const injectedListed = availableWallets.some((wallet) => wallet.type !== 'walletconnect');
        if (!injectedListed && typeof window.ethereum !== 'undefined') {
            const provider = this.getLegacyProviderForType('generic') || (this.getInjectedProviders().length === 1 ? window.ethereum : null);
            if (provider) {
                availableWallets.push({
                    type: 'generic',
                    name: 'Ethereum Provider',
                    priority: 10,
                    provider: provider,
                    rdns: null,
                    uuid: null,
                    icon: null
                });
            }
        }

        return availableWallets.sort((a, b) => a.priority - b.priority || String(a.name).localeCompare(String(b.name)));
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

    providerReady() {
        return this.announcedByUuid.size > 0 || (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined');
    }

    pinnedAnnouncementReady(pin) {
        if (!pin) return false;
        if (pin.uuid && this.announcedByUuid.has(pin.uuid)) return true;
        if (pin.rdns) {
            for (const detail of this.announcedByUuid.values()) {
                if (detail.info.rdns === pin.rdns) return true;
            }
        }
        return false;
    }

    // MetaMask (and other extensions) can inject after the button handler runs.
    async waitForInjectedProvider(timeoutMs = 2000) {
        this.requestEip6963Providers();
        if (this.providerReady()) return;
        const started = Date.now();
        await new Promise((resolve) => {
            const timer = setInterval(() => {
                if (this.providerReady() || Date.now() - started >= timeoutMs) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }

    async waitForPinnedAnnouncement(pin, timeoutMs = 2000) {
        if (!pin || (!pin.uuid && !pin.rdns)) return;
        this.requestEip6963Providers();
        if (this.pinnedAnnouncementReady(pin)) return;
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            this.requestEip6963Providers();
            if (this.pinnedAnnouncementReady(pin)) return;
        }
    }

    // Connect to a specific wallet. pin is the uuid/rdns saved from the user's pick.
    // A saved uuid that is not announced is a failed reconnect, not a reason to
    // take whichever provider currently has isMetaMask set.
    async connectToWallet(walletType = null, pin = null) {
        const needsInjected = walletType !== 'walletconnect';
        if (needsInjected) {
            await this.waitForInjectedProvider();
            if (pin && (pin.uuid || pin.rdns)) {
                await this.waitForPinnedAnnouncement(pin);
            }
        }
        const availableWallets = this.detectWallets();
        
        if (availableWallets.length === 0) {
            throw new Error('No Ethereum wallets detected. Please install MetaMask, WalletConnect, or another compatible wallet.');
        }
        
        const walletToUse = this.selectWalletEntry(availableWallets, walletType, pin);
            
        if (!walletToUse) {
            const saved = pin && (pin.uuid || pin.rdns);
            throw new Error(saved
                ? 'The Ethereum wallet you connected last time is not available. Connect it again.'
                : `Wallet '${walletType || 'default'}' not found. Available wallets: ${availableWallets.map(w => w.name).join(', ')}`);
        }
        
        this.debugLog(`Connecting to ${walletToUse.name}...`);
        
        // Use the provider on this row. Do not look the wallet up again by isMetaMask.
        const connectionResult = walletToUse.type === 'walletconnect'
            ? await this.connectWalletConnect()
            : await this.connectGeneric(walletToUse.provider);
        
        // Set wallet state
        this.currentWallet = walletToUse;
        this.currentProvider = connectionResult.provider || walletToUse.provider;
        this.pinnedIdentity = {
            uuid: walletToUse.uuid || null,
            rdns: walletToUse.rdns || null
        };
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
            rdns: this.pinnedIdentity.rdns,
            uuid: this.pinnedIdentity.uuid,
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
        
        // Disconnect WalletConnect if used. Injected providers stay installed.
        if (this.currentWallet && this.currentWallet.type === 'walletconnect' && this.currentProvider && this.currentProvider.disconnect) {
            try {
                this.currentProvider.disconnect();
            } catch (error) {
                console.warn('Error disconnecting provider:', error);
            }
        }

        // Reset state
        this.currentProvider = null;
        this.currentWallet = null;
        this.pinnedIdentity = null;
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
            rdns: this.pinnedIdentity?.rdns || null,
            uuid: this.pinnedIdentity?.uuid || null,
            account: this.account,
            chainId: this.chainId
        };
    }

    // Check if wallet is connected
    isWalletConnected() {
        return this.isConnected && this.account && this.currentProvider;
    }

    _errorText(error) {
        if (!error) return '';
        const parts = [error.message, error.reason];
        if (error.code != null) parts.push(String(error.code));
        if (error.data && typeof error.data === 'string') parts.push(error.data);
        return parts.filter(Boolean).join(' ');
    }

    // MetaMask does not expose keyring type. These strings come back from the
    // Ledger Ethereum app after eth_sendTransaction, which is the only signing
    // method a Ledger account can complete (no eth_sign / eth_signTypedData).
    ledgerDeviceHint(error) {
        const text = this._errorText(error).toLowerCase();
        if (!text) return null;
        const fromDevice = text.includes('ledger')
            || text.includes('0x6a80')
            || text.includes('0x6d00')
            || text.includes('0x6e00')
            || text.includes('0x6985')
            || text.includes('0x6b0c')
            || text.includes('0x5515')
            || text.includes('blind sign')
            || text.includes('contract data')
            || text.includes('hardware wallet');
        if (!fromDevice) return null;

        if (text.includes('locked') || text.includes('0x6b0c') || text.includes('0x5515')) {
            return 'Unlock your Ledger and open the Ethereum app, then confirm the transaction on the device.';
        }
        if (text.includes('0x6e00') || text.includes('cla_not_supported') || text.includes('0x6d00') || text.includes('ins_not_supported')) {
            return 'Open the Ethereum app on your Ledger. The Cosmos app cannot sign Ethereum transactions.';
        }
        if (text.includes('blind') || text.includes('contract data') || text.includes('0x6985')) {
            return 'The Ledger Ethereum app rejected this contract call. Confirm it on the device. If nothing shows, unlock the device, open the Ethereum app, and enable Blind signing. Approve, deposit, and claim are contract calls and will not sign with Blind signing off.';
        }
        return 'Ledger could not sign this transaction. Unlock the device, open the Ethereum app (not the Cosmos app), and enable Blind signing, then try again.';
    }

    attachLedgerHint(error) {
        const hint = this.ledgerDeviceHint(error);
        if (hint && error && typeof error === 'object') {
            error.ledgerHint = hint;
        }
        return error;
    }

    // Old Ethereum apps reject EIP-1559 (type 2) with INS_NOT_SUPPORTED / 0x6d00.
    // A user reject or a contract revert must not be retried.
    shouldRetryAsLegacy(error) {
        if (!error || error.transactionHash || error.receipt) return false;
        if (error.code === 4001) return false;
        const text = this._errorText(error).toLowerCase();
        if (!text) return false;
        if (text.includes('user rejected') || text.includes('user denied') || text.includes('4001')) return false;
        if (text.includes('execution reverted') || text.includes('insufficient')) return false;
        if (text.includes('blind') || text.includes('contract data') || text.includes('0x6985')) return false;
        return text.includes('0x6d00')
            || text.includes('ins_not_supported')
            || text.includes('unsupported transaction type')
            || text.includes('eip-1559')
            || text.includes('eip1559')
            || text.includes('unknown error while signing transaction');
    }

    _hexQuantity(web3, value) {
        if (typeof value === 'string' && value.startsWith('0x')) return value;
        return web3.utils.numberToHex(value);
    }

    async _waitForReceipt(web3, txHash, timeoutMs = 180000) {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            const receipt = await web3.eth.getTransactionReceipt(txHash);
            if (receipt) {
                const failed = receipt.status === false || receipt.status === '0x0' || receipt.status === 0;
                if (failed) {
                    const err = new Error('Transaction failed');
                    err.receipt = receipt;
                    err.transactionHash = txHash;
                    throw err;
                }
                return receipt;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        const err = new Error('Transaction was submitted but was not confirmed in time.');
        err.transactionHash = txHash;
        throw err;
    }

    // Contract sends stay on eth_sendTransaction so MetaMask can hand them to
    // the Ledger. If the device rejects a type-2 tx, resubmit once as legacy
    // (gasPrice, type 0x0) which every Ethereum app can sign.
    async sendContractCall(contractMethod, sendOptions = {}) {
        try {
            return await contractMethod.send(sendOptions);
        } catch (error) {
            const web3 = this.web3;
            const provider = this.currentProvider;
            const canRetry = this.shouldRetryAsLegacy(error)
                && web3
                && provider
                && typeof provider.request === 'function'
                && contractMethod
                && typeof contractMethod.encodeABI === 'function'
                && contractMethod._parent
                && contractMethod._parent.options
                && contractMethod._parent.options.address;
            if (!canRetry) {
                throw this.attachLedgerHint(error);
            }

            try {
                const from = sendOptions.from;
                let gas = sendOptions.gas;
                if (gas == null) {
                    gas = await contractMethod.estimateGas({ from });
                }
                const gasPrice = await web3.eth.getGasPrice();
                const txHash = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from,
                        to: contractMethod._parent.options.address,
                        data: contractMethod.encodeABI(),
                        gas: this._hexQuantity(web3, gas),
                        gasPrice: this._hexQuantity(web3, gasPrice),
                        type: '0x0'
                    }]
                });
                return await this._waitForReceipt(web3, txHash);
            } catch (legacyError) {
                throw this.attachLedgerHint(legacyError);
            }
        }
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