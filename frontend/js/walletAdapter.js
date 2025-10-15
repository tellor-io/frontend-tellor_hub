// Wallet Adapter for Cosmos Wallets
// Supports multiple wallet providers while maintaining backward compatibility

class CosmosWalletAdapter {
    constructor() {
        this.currentWallet = null;
        this.walletType = null;
        this.chainId = 'tellor-1';
        this.rpcUrl = 'https://mainnet.tellorlayer.com/rpc';
        this.restUrl = 'https://mainnet.tellorlayer.com/rpc';
        
        // Chain configurations for both networks
        this.chainConfigs = {
            'layertest-4': {
                chainId: "layertest-4",
                chainName: "Layer Testnet",
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
            },
            'tellor-1': {
                chainId: "tellor-1",
                chainName: "Tellor Layer Mainnet",
                rpc: "https://mainnet.tellorlayer.com/rpc",
                rest: "https://mainnet.tellorlayer.com/rpc",
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
            }
        };
        
        // Default to mainnet configuration
        this.chainConfig = this.chainConfigs['tellor-1'];
    }

    // Detect available wallets
    detectWallets() {
        const availableWallets = [];
        
        console.log('Detecting available wallets...');
        console.log('window.keplr:', typeof window.keplr !== 'undefined' ? 'Available' : 'Not available');
        console.log('window.cosmostation:', typeof window.cosmostation !== 'undefined' ? 'Available' : 'Not available');
        console.log('window.leap:', typeof window.leap !== 'undefined' ? 'Available' : 'Not available');
        console.log('window.leapWallet:', typeof window.leapWallet !== 'undefined' ? 'Available' : 'Not available');
        console.log('window.station:', typeof window.station !== 'undefined' ? 'Available' : 'Not available');
        console.log('window.walletConnect:', typeof window.walletConnect !== 'undefined' ? 'Available' : 'Not available');
        
        // Check for Keplr
        if (typeof window.keplr !== 'undefined') {
            availableWallets.push({
                name: 'Keplr',
                type: 'keplr',
                provider: window.keplr,
                priority: 1
            });
        }
        
        // Check for Cosmostation
        if (typeof window.cosmostation !== 'undefined') {
            availableWallets.push({
                name: 'Cosmostation',
                type: 'cosmostation',
                provider: window.cosmostation,
                priority: 2
            });
        }
        
        // Check for Leap
        if (typeof window.leap !== 'undefined') {
            availableWallets.push({
                name: 'Leap',
                type: 'leap',
                provider: window.leap,
                priority: 3
            });
        }
        
        // Check for Leap with different possible global names
        if (typeof window.leapWallet !== 'undefined') {
            availableWallets.push({
                name: 'Leap Wallet',
                type: 'leap',
                provider: window.leapWallet,
                priority: 3
            });
        }
        
        // Check for Station (Terra)
        if (typeof window.station !== 'undefined') {
            availableWallets.push({
                name: 'Station',
                type: 'station',
                provider: window.station,
                priority: 4
            });
        }
        
        // Check for WalletConnect
        if (typeof window.walletConnect !== 'undefined') {
            availableWallets.push({
                name: 'WalletConnect',
                type: 'walletconnect',
                provider: window.walletConnect,
                priority: 5
            });
        }
        
        console.log('Detected wallets:', availableWallets.map(w => w.name));
        return availableWallets.sort((a, b) => a.priority - b.priority);
    }

    // Connect to a specific wallet
    async connectToWallet(walletType = null) {
        const availableWallets = this.detectWallets();
        
        if (availableWallets.length === 0) {
            throw new Error('No Cosmos wallets detected. Please install Keplr, Cosmostation, Leap, or another compatible wallet.');
        }
        
        // If no specific wallet type requested, use the first available
        const walletToUse = walletType 
            ? availableWallets.find(w => w.type === walletType)
            : availableWallets[0];
            
        if (!walletToUse) {
            throw new Error(`Wallet type '${walletType}' not found. Available wallets: ${availableWallets.map(w => w.name).join(', ')}`);
        }
        
        this.walletType = walletToUse.type;
        this.currentWallet = walletToUse.provider;
        
        // Check if we're switching networks (wallet already connected)
        const isNetworkSwitch = this.isConnected() && window.App && window.App.isNetworkSwitching;
        
        if (isNetworkSwitch) {
            // Switch to the correct chain for network switching
            await this.switchToChain();
        } else {
            // Configure chain based on wallet type (new connection)
            await this.configureChain();
            
            // Enable the chain
            await this.enableChain();
        }
        
        // Get offline signer
        const offlineSigner = this.getOfflineSigner();
        const accounts = await offlineSigner.getAccounts();
        
        if (!accounts || accounts.length === 0) {
            throw new Error(`No accounts found in ${walletToUse.name}`);
        }
        
        return {
            address: accounts[0].address,
            pubkey: accounts[0].pubkey,
            walletType: this.walletType,
            walletName: walletToUse.name,
            offlineSigner: offlineSigner
        };
    }

    // Update chain configuration based on current network
    updateChainConfig() {
        const currentChainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'tellor-1';
        
        if (this.chainConfigs[currentChainId]) {
            this.chainConfig = this.chainConfigs[currentChainId];
            this.chainId = currentChainId;
            this.rpcUrl = this.chainConfig.rpc;
            this.restUrl = this.chainConfig.rest;
            
            console.log('Updated chain configuration for:', currentChainId);
            console.log('RPC URL:', this.rpcUrl);
            console.log('REST URL:', this.restUrl);
        } else {
            console.warn('Unknown chain ID:', currentChainId, 'using default mainnet configuration');
        }
    }

    // Configure chain for the wallet
    async configureChain() {
        if (!this.currentWallet) {
            throw new Error('No wallet connected');
        }
        
        // Update chain configuration based on current network
        this.updateChainConfig();
        
        // Different wallets have different chain suggestion methods
        switch (this.walletType) {
            case 'keplr':
                if (this.currentWallet.experimentalSuggestChain) {
                    await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                }
                break;
                
            case 'cosmostation':
                if (this.currentWallet.providers.keplr) {
                    await this.currentWallet.providers.keplr.experimentalSuggestChain(this.chainConfig);
                }
                break;
                
            case 'leap':
                if (this.currentWallet.experimentalSuggestChain) {
                    await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                }
                break;
                
            case 'station':
                // Station might need different configuration
                console.log('Station wallet detected - chain configuration may need manual setup');
                break;
                
            default:
                // For other wallets, try the standard method
                if (this.currentWallet.experimentalSuggestChain) {
                    await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                }
                break;
        }
    }

    // Enable chain on the wallet
    async enableChain() {
        if (!this.currentWallet) {
            throw new Error('No wallet connected');
        }
        
        switch (this.walletType) {
            case 'keplr':
                await this.currentWallet.enable(this.chainId);
                break;
                
            case 'cosmostation':
                if (this.currentWallet.providers.keplr) {
                    await this.currentWallet.providers.keplr.enable(this.chainId);
                } else {
                    await this.currentWallet.enable(this.chainId);
                }
                break;
                
            case 'leap':
                await this.currentWallet.enable(this.chainId);
                break;
                
            case 'station':
                await this.currentWallet.enable(this.chainId);
                break;
                
            default:
                // Try standard enable method
                if (this.currentWallet.enable) {
                    await this.currentWallet.enable(this.chainId);
                }
                break;
        }
    }

    // Switch to the correct chain (for network switching)
    async switchToChain() {
        if (!this.currentWallet) {
            throw new Error('No wallet connected');
        }
        
        // Update chain configuration first
        this.updateChainConfig();
        
        try {
            switch (this.walletType) {
                case 'keplr':
                    // First suggest the chain (add it if not already added)
                    if (this.currentWallet.experimentalSuggestChain) {
                        await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                    }
                    // Then enable it
                    await this.currentWallet.enable(this.chainId);
                    break;
                    
                case 'cosmostation':
                    if (this.currentWallet.providers && this.currentWallet.providers.keplr) {
                        if (this.currentWallet.providers.keplr.experimentalSuggestChain) {
                            await this.currentWallet.providers.keplr.experimentalSuggestChain(this.chainConfig);
                        }
                        await this.currentWallet.providers.keplr.enable(this.chainId);
                    } else {
                        if (this.currentWallet.experimentalSuggestChain) {
                            await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                        }
                        await this.currentWallet.enable(this.chainId);
                    }
                    break;
                    
                case 'leap':
                    if (this.currentWallet.experimentalSuggestChain) {
                        await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                    }
                    await this.currentWallet.enable(this.chainId);
                    break;
                    
                case 'station':
                    if (this.currentWallet.experimentalSuggestChain) {
                        await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                    }
                    await this.currentWallet.enable(this.chainId);
                    break;
                    
                default:
                    // Try standard methods
                    if (this.currentWallet.experimentalSuggestChain) {
                        await this.currentWallet.experimentalSuggestChain(this.chainConfig);
                    }
                    if (this.currentWallet.enable) {
                        await this.currentWallet.enable(this.chainId);
                    }
                    break;
            }
        } catch (error) {
            console.warn('Could not switch to chain:', error);
            // Fall back to just enabling the chain
            await this.enableChain();
        }
    }

    // Get offline signer from the wallet
    getOfflineSigner() {
        if (!this.currentWallet) {
            throw new Error('No wallet connected');
        }
        
        // Use the current chain ID from the app instead of hardcoded value
        const currentChainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : this.chainId;
        
        console.log('Getting offline signer for wallet type:', this.walletType);
        console.log('Current wallet provider:', this.currentWallet);
        console.log('Using chain ID:', currentChainId);
        
        switch (this.walletType) {
            case 'keplr':
                if (!this.currentWallet.getOfflineSigner) {
                    throw new Error('Keplr wallet does not have getOfflineSigner method');
                }
                return this.currentWallet.getOfflineSigner(currentChainId);
                
            case 'cosmostation':
                if (this.currentWallet.providers && this.currentWallet.providers.keplr) {
                    return this.currentWallet.providers.keplr.getOfflineSigner(currentChainId);
                } else if (this.currentWallet.getOfflineSigner) {
                    return this.currentWallet.getOfflineSigner(currentChainId);
                } else {
                    throw new Error('Cosmostation wallet does not have getOfflineSigner method');
                }
                
            case 'leap':
                if (!this.currentWallet.getOfflineSigner) {
                    console.error('Leap wallet methods:', Object.getOwnPropertyNames(this.currentWallet));
                    throw new Error('Leap wallet does not have getOfflineSigner method');
                }
                return this.currentWallet.getOfflineSigner(currentChainId);
                
            case 'station':
                if (!this.currentWallet.getOfflineSigner) {
                    throw new Error('Station wallet does not have getOfflineSigner method');
                }
                return this.currentWallet.getOfflineSigner(currentChainId);
                
            default:
                // Try standard method
                if (this.currentWallet.getOfflineSigner) {
                    return this.currentWallet.getOfflineSigner(currentChainId);
                }
                console.error('Available methods on wallet:', Object.getOwnPropertyNames(this.currentWallet));
                throw new Error(`Unsupported wallet type: ${this.walletType}`);
        }
    }

    // Disconnect from wallet
    async disconnect() {
        if (!this.currentWallet) {
            return;
        }
        
        // Try to disable the chain if supported
        try {
            switch (this.walletType) {
                case 'keplr':
                    if (this.currentWallet.disable) {
                        await this.currentWallet.disable(this.chainId);
                    }
                    break;
                    
                case 'cosmostation':
                    if (this.currentWallet.providers.keplr && this.currentWallet.providers.keplr.disable) {
                        await this.currentWallet.providers.keplr.disable(this.chainId);
                    }
                    break;
                    
                case 'leap':
                    if (this.currentWallet.disable) {
                        await this.currentWallet.disable(this.chainId);
                    }
                    break;
                    
                default:
                    if (this.currentWallet.disable) {
                        await this.currentWallet.disable(this.chainId);
                    }
                    break;
            }
        } catch (error) {
            console.warn('Could not disable chain in wallet:', error);
        }
        
        this.currentWallet = null;
        this.walletType = null;
    }

    // Check if wallet is connected
    isConnected() {
        return this.currentWallet !== null;
    }

    // Get current wallet info
    getWalletInfo() {
        if (!this.isConnected()) {
            return null;
        }
        
        return {
            type: this.walletType,
            provider: this.currentWallet
        };
    }

    // Get available wallet options for UI
    getWalletOptions() {
        const availableWallets = this.detectWallets();
        return availableWallets.map(wallet => ({
            name: wallet.name,
            type: wallet.type,
            description: this.getWalletDescription(wallet.type)
        }));
    }

    // Get wallet description for UI
    getWalletDescription(walletType) {
        const descriptions = {
            'keplr': 'The most popular Cosmos wallet',
            'cosmostation': 'Mobile-first Cosmos wallet',
            'leap': 'Modern Cosmos wallet with advanced features',
            'station': 'Terra ecosystem wallet',
            'walletconnect': 'Connect any wallet via WalletConnect'
        };
        
        return descriptions[walletType] || 'Cosmos-compatible wallet';
    }

    // Get current chain ID
    async getChainId() {
        if (!this.currentWallet) {
            return this.chainId; // Return default chain ID if no wallet connected
        }
        
        try {
            switch (this.walletType) {
                case 'keplr':
                    if (this.currentWallet.getChainId) {
                        return await this.currentWallet.getChainId();
                    }
                    break;
                    
                case 'cosmostation':
                    if (this.currentWallet.providers && this.currentWallet.providers.keplr && this.currentWallet.providers.keplr.getChainId) {
                        return await this.currentWallet.providers.keplr.getChainId();
                    } else if (this.currentWallet.getChainId) {
                        return await this.currentWallet.getChainId();
                    }
                    break;
                    
                case 'leap':
                    if (this.currentWallet.getChainId) {
                        return await this.currentWallet.getChainId();
                    }
                    break;
                    
                case 'station':
                    if (this.currentWallet.getChainId) {
                        return await this.currentWallet.getChainId();
                    }
                    break;
                    
                default:
                    if (this.currentWallet.getChainId) {
                        return await this.currentWallet.getChainId();
                    }
                    break;
            }
        } catch (error) {
            console.warn('Could not get chain ID from wallet:', error);
        }
        
        // Fallback to current chain ID
        return this.chainId;
    }
}

// Create global instance
window.cosmosWalletAdapter = new CosmosWalletAdapter();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CosmosWalletAdapter;
} 