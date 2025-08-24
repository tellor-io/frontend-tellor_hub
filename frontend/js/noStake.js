// No-Stake Reporting Module for Layer Blockchain
// Handles submission of no-stake reports to the oracle module

class NoStakeReporter {
    constructor() {
        this.isConnected = false;
        this.currentAddress = null;
        this.currentNetwork = null;
    }

    // Initialize the no-stake reporter
    async init() {
        try {
            // Check if required dependencies are loaded
            if (!window.cosmjs || !window.cosmjs.stargate) {
                throw new Error('CosmJS not loaded. Please ensure the application is properly initialized.');
            }

            if (!window.layerProto) {
                throw new Error('Layer protobuf definitions not loaded.');
            }

            console.log('NoStakeReporter initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize NoStakeReporter:', error);
            throw error;
        }
    }

    // Get wallet connection status from existing wallet manager
    async getWalletStatus() {
        try {
            // Check if Keplr is connected via the main wallet manager
            if (window.App && window.App.isKeplrConnected && window.App.keplrAddress) {
                this.currentAddress = window.App.keplrAddress;
                this.isConnected = true;
                return {
                    isConnected: true,
                    address: this.currentAddress,
                    walletType: 'keplr'
                };
            }
            
            // Check if Cosmos wallet adapter is connected
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                const accounts = await window.cosmosWalletAdapter.getOfflineSigner().getAccounts();
                if (accounts.length > 0) {
                    this.currentAddress = accounts[0].address;
                    this.isConnected = true;
                    return {
                        isConnected: true,
                        address: this.currentAddress,
                        walletType: 'cosmosWalletAdapter'
                    };
                }
            }
            
            return {
                isConnected: false,
                address: null,
                walletType: null
            };
        } catch (error) {
            console.error('Failed to get wallet status:', error);
            return {
                isConnected: false,
                address: null,
                walletType: null
            };
        }
    }

    // Disconnect from wallet
    disconnectWallet() {
        this.isConnected = false;
        this.currentAddress = null;
        console.log('NoStakeReporter disconnected from wallet');
    }

    // Submit a no-stake report
    async submitNoStakeReport(queryData, value, network = 'testnet') {
        try {
            // Check wallet status from existing wallet manager
            const walletStatus = await this.getWalletStatus();
            if (!walletStatus.isConnected || !walletStatus.address) {
                throw new Error('Wallet not connected. Please use the wallet manager above to connect your Cosmos wallet.');
            }
            
            this.currentAddress = walletStatus.address;
            this.isConnected = true;

            if (!queryData || !value) {
                throw new Error('Query data and value are required.');
            }

            // Validate query data format
            let queryDataBytes;
            if (typeof queryData === 'string') {
                // Convert hex string to bytes
                if (queryData.startsWith('0x')) {
                    queryData = queryData.slice(2);
                }
                queryDataBytes = new Uint8Array(queryData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            } else if (queryData instanceof Uint8Array) {
                queryDataBytes = queryData;
            } else {
                throw new Error('Query data must be a hex string or Uint8Array.');
            }

            // Validate value format
            if (typeof value !== 'string') {
                throw new Error('Value must be a string.');
            }

            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            // Get offline signer
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.keplr) {
                offlineSigner = window.keplr.getOfflineSigner('layertest-4');
            } else {
                throw new Error('No wallet connected.');
            }

            // Create Stargate client
            const client = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Create the no-stake report message
            const msg = {
                typeUrl: '/layer.oracle.MsgNoStakeReport',
                value: {
                    creator: this.currentAddress,
                    query_data: queryDataBytes,
                    value: value
                }
            };

            console.log('Submitting no-stake report:', {
                creator: msg.value.creator,
                query_data_length: queryDataBytes.length,
                value: msg.value.value
            });

            console.log('Using gas limit:', '1000000', 'and fee:', '15000 loya');

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcastDirect(
                this.currentAddress,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '15000' }], // Increased gas fee further
                    gas: '1000000' // Increased gas limit to 1M for complex oracle transactions
                },
                'Submit No-Stake Report'
            );

            if (result && result.code === 0) {
                // Debug: Log the full result to see the structure
                console.log('Transaction result:', result);
                
                // Try different possible hash field names
                const txHash = result.transactionHash || 
                              result.txhash || 
                              result.hash || 
                              result.tx_response?.txhash ||
                              result.tx_response?.hash;
                
                console.log('Extracted transaction hash:', txHash);
                
                return {
                    success: true,
                    transactionHash: txHash,
                    height: result.height || result.tx_response?.height,
                    gasUsed: result.gasUsed || result.tx_response?.gas_used,
                    gasWanted: result.gasWanted || result.tx_response?.gas_wanted
                };
            } else {
                throw new Error(`Transaction failed with code: ${result.code}`);
            }
        } catch (error) {
            console.error('Failed to submit no-stake report:', error);
            throw error;
        }
    }

    // Get current account balance
    async getBalance() {
        try {
            if (!this.isConnected || !this.currentAddress) {
                throw new Error('Wallet not connected.');
            }

            // Use the existing balance fetching logic
            const response = await fetch(`https://node-palmito.tellorlayer.com/cosmos/bank/v1beta1/balances/${this.currentAddress}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch balance: ${response.status}`);
            }

            const data = await response.json();
            const trbBalance = data.balances.find(balance => balance.denom === 'loya');
            
            return trbBalance ? parseFloat(trbBalance.amount) / 1000000 : 0; // Convert from micro units
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    // Validate query data format
    validateQueryData(queryData) {
        if (typeof queryData === 'string') {
            // Check if it's a valid hex string
            return /^[0-9a-fA-F]+$/.test(queryData.replace('0x', ''));
        } else if (queryData instanceof Uint8Array) {
            return queryData.length > 0;
        }
        return false;
    }

    // Validate value format
    validateValue(value) {
        if (typeof value !== 'string') {
            return false;
        }
        // Check if it's a valid hex string
        return /^[0-9a-fA-F]+$/.test(value.replace('0x', ''));
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            address: this.currentAddress,
            network: this.currentNetwork
        };
    }
}

// Export the class for use in other modules
window.NoStakeReporter = NoStakeReporter;

// Create a global instance
window.noStakeReporter = new NoStakeReporter();

console.log('NoStakeReporter module loaded successfully');
