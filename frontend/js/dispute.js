// Dispute Module for Layer Blockchain
// Handles submission of dispute proposals to the dispute module

class DisputeProposer {
    constructor() {
        this.isConnected = false;
        this.currentAddress = null;
        this.currentNetwork = null;
    }

    // Initialize the dispute proposer
    async init() {
        try {
            // Check if required dependencies are loaded
            if (!window.cosmjs || !window.cosmjs.stargate) {
                throw new Error('CosmJS not loaded. Please ensure the application is properly initialized.');
            }

            if (!window.layerProto || !window.layerProto.createMsgProposeDispute || !window.layerProto.createMsgVote) {
                throw new Error('Layer protobuf definitions not loaded. Please ensure the application is properly initialized.');
            }

            console.log('DisputeProposer initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize DisputeProposer:', error);
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
        console.log('DisputeProposer disconnected from wallet');
    }

    // Submit a dispute proposal
    async proposeDispute(disputedReporter, reportMetaId, reportQueryId, disputeCategory, fee, payFromBond = false) {
        try {
            // Check wallet status from existing wallet manager
            const walletStatus = await this.getWalletStatus();
            if (!walletStatus.isConnected || !walletStatus.address) {
                throw new Error('Wallet not connected. Please use the wallet manager above to connect your Cosmos wallet.');
            }
            
            this.currentAddress = walletStatus.address;
            this.isConnected = true;

            // Validate inputs
            if (!disputedReporter || !reportMetaId || !reportQueryId || !disputeCategory || !fee) {
                throw new Error('All dispute parameters are required.');
            }

            // Convert reportMetaId to number if it's a string
            const numericReportMetaId = parseInt(reportMetaId);
            if (isNaN(numericReportMetaId) || numericReportMetaId <= 0) {
                throw new Error('Report Meta ID must be a valid positive number.');
            }

            // Convert dispute category to enum value
            // Based on Layer blockchain protobuf: disputeCategory is uint32 enum
            // Trying enum mapping: Warning=1, Minor=2, Major=3 (common protobuf pattern)
            const disputeCategoryLower = disputeCategory.toLowerCase();
            
            let disputeCategoryEnum;
            if (disputeCategoryLower === 'warning') {
                disputeCategoryEnum = 1;
            } else if (disputeCategoryLower === 'minor') {
                disputeCategoryEnum = 2; 
            } else if (disputeCategoryLower === 'major') {
                disputeCategoryEnum = 3;
            } else {
                throw new Error('Invalid dispute category. Must be warning, minor, or major.');
            }

            // Validate fee format (should be in loya)
            if (typeof fee !== 'string' || parseFloat(fee) <= 0) {
                throw new Error('Fee must be a positive number in loya.');
            }

            // Clean fee input - remove 'loya' suffix if present
            const cleanFee = fee.replace(/loya$/i, '').trim();
            if (parseFloat(cleanFee) <= 0) {
                throw new Error('Fee must be a positive number.');
            }

            // Convert TRB to micro units (1 TRB = 1,000,000 micro TRB)
            const feeInMicroUnits = this.convertTrbToMicroUnits(cleanFee);

            // Validate addresses
            if (!this.isValidAddress(disputedReporter)) {
                throw new Error('Invalid disputed reporter address.');
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

            // Create the dispute proposal message using the protobuf definitions
            if (!window.layerProto || !window.layerProto.createMsgProposeDispute) {
                throw new Error('Layer protobuf definitions not loaded. Please ensure the application is properly initialized.');
            }

            const msg = window.layerProto.createMsgProposeDispute(
                this.currentAddress,
                disputedReporter,
                numericReportMetaId,
                reportQueryId,
                disputeCategoryEnum,
                {
                    denom: 'loya',
                    amount: feeInMicroUnits
                },
                payFromBond
            );

            console.log('Submitting dispute proposal:', {
                creator: msg.value.creator,
                disputedReporter: msg.value.disputedReporter,
                reportMetaId: msg.value.reportMetaId,
                reportQueryId: msg.value.reportQueryId,
                disputeCategory: msg.value.disputeCategory,
                fee: msg.value.fee,
                payFromBond: msg.value.payFromBond,
                originalFee: fee,
                cleanedFee: cleanFee,
                feeInMicroUnits: feeInMicroUnits,
                originalReportMetaId: reportMetaId,
                numericReportMetaId: numericReportMetaId,
                originalDisputeCategory: disputeCategory,
                disputeCategoryEnum: disputeCategoryEnum
            });

            console.log('Full message object:', msg);
            console.log('Message typeUrl:', msg.typeUrl);
            console.log('Message value:', msg.value);
            console.log('Field types check:', {
                creator: typeof msg.value.creator,
                disputedReporter: typeof msg.value.disputedReporter,
                reportMetaId: typeof msg.value.reportMetaId,
                reportQueryId: typeof msg.value.reportQueryId,
                disputeCategory: typeof msg.value.disputeCategory,
                fee: typeof msg.value.fee,
                payFromBond: typeof msg.value.payFromBond
            });
            console.log('Raw input values:', {
                disputedReporter,
                reportMetaId,
                reportQueryId,
                disputeCategory,
                fee,
                payFromBond
            });
            console.log('Processed values:', {
                numericReportMetaId,
                disputeCategoryEnum,
                cleanFee
            });

            console.log('Using gas limit:', '1000000', 'and fee:', '15000 loya');

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcastDirect(
                this.currentAddress,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '15000' }],
                    gas: '1000000'
                },
                'Propose Dispute'
            );

            if (result && result.code === 0) {
                console.log('Transaction result:', result);
                
                // Extract transaction hash
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
            console.error('Failed to propose dispute:', error);
            throw error;
        }
    }

    // Get current account balance
    async getBalance() {
        try {
            if (!this.isConnected || !this.currentAddress) {
                throw new Error('Wallet not connected.');
            }

            // Use the same network logic as proposeDispute
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            const response = await fetch(`${rpcEndpoint}/cosmos/bank/v1beta1/balances/${this.currentAddress}`);
            
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

    // Validate address format
    isValidAddress(address) {
        try {
            // Basic validation for Cosmos addresses
            if (typeof address !== 'string') return false;
            if (!address.startsWith('tellor1') && !address.startsWith('layer1')) return false;
            if (address.length < 20 || address.length > 50) return false;
            return true;
        } catch (error) {
            return false;
        }
    }

    // Validate report meta ID
    validateReportMetaId(reportMetaId) {
        if (typeof reportMetaId !== 'string') return false;
        if (reportMetaId.trim() === '') return false;
        return true;
    }

    // Validate report query ID
    validateReportQueryId(reportQueryId) {
        if (typeof reportQueryId !== 'string') return false;
        if (reportQueryId.trim() === '') return false;
        return true;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            address: this.currentAddress,
            network: this.currentNetwork
        };
    }

    // Vote on a dispute
    async voteOnDispute(disputeId, voteChoice) {
        try {
            // Check wallet status from existing wallet manager
            const walletStatus = await this.getWalletStatus();
            if (!walletStatus.isConnected || !walletStatus.address) {
                throw new Error('Wallet not connected. Please use the wallet manager above to connect your Cosmos wallet.');
            }
            
            this.currentAddress = walletStatus.address;
            this.isConnected = true;

            // Validate inputs
            if (!disputeId || disputeId <= 0) {
                throw new Error('Valid dispute ID is required.');
            }

            // Validate vote choice
            const validVoteChoices = ['vote-support', 'vote-against', 'vote-invalid'];
            if (!validVoteChoices.includes(voteChoice)) {
                throw new Error('Vote choice must be vote-support, vote-against, or vote-invalid.');
            }

            // Check voting power before attempting to vote
            console.log('Checking voting power before voting...');
            const votingPowerCheck = await this.checkVotingPower();
            
            if (!votingPowerCheck.hasVotingPower) {
                throw new Error(`Cannot vote: ${votingPowerCheck.details}`);
            }

            console.log('Voting power check passed:', votingPowerCheck);

            // Get dispute info to check status
            const disputeInfo = await this.getDisputeInfo(disputeId);
            console.log('Dispute info for voting:', disputeInfo);

            if (disputeInfo.disputeStatus !== 'DISPUTE_STATUS_VOTING') {
                const feeRequired = disputeInfo.slashAmount || 'unknown';
                const feePaid = disputeInfo.feeTotal || '0';
                const feeRemaining = feeRequired !== 'unknown' ? 
                    (parseInt(feeRequired) - parseInt(feePaid)) / 1000000 : 'unknown';
                
                throw new Error(`Dispute is not in voting state. Current status: ${disputeInfo.disputeStatus}. ` +
                    `Fee required: ${feeRequired !== 'unknown' ? feeRequired / 1000000 + ' TRB' : 'unknown'}, ` +
                    `Fee paid: ${feePaid / 1000000} TRB, ` +
                    `Fee remaining: ${feeRemaining !== 'unknown' ? feeRemaining + ' TRB' : 'unknown'}. ` +
                    `Please add the remaining fee to proceed to voting.`);
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

            // Create the vote message using the protobuf definitions
            if (!window.layerProto || !window.layerProto.createMsgVote) {
                throw new Error('Layer protobuf definitions not loaded. Please ensure the application is properly initialized.');
            }

            const msg = window.layerProto.createMsgVote(
                this.currentAddress,
                disputeId,
                voteChoice
            );

            console.log('Submitting vote on dispute:', {
                voter: msg.value.voter,
                disputeId: msg.value.id,
                vote: msg.value.vote,
                originalVoteChoice: voteChoice,
                voteEnum: window.layerProto.convertVoteChoiceToEnum(voteChoice)
            });

            console.log('Full vote message object:', msg);
            console.log('Vote message typeUrl:', msg.typeUrl);
            console.log('Vote message value:', msg.value);

            console.log('Using gas limit:', '1000000', 'and fee:', '15000 loya');

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcastDirect(
                this.currentAddress,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '15000' }],
                    gas: '1000000'
                },
                'Vote on Dispute'
            );

            if (result && result.code === 0) {
                console.log('Transaction result:', result);
                
                // Extract transaction hash
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
            console.error('Failed to vote on dispute:', error);
            throw error;
        }
    }

    // Get dispute information
    async getDisputeInfo(disputeId) {
        try {
            if (!disputeId || disputeId <= 0) {
                throw new Error('Valid dispute ID is required.');
            }

            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            // Query all disputes and filter for the specific one
            const response = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/disputes`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch disputes: ${response.status}`);
            }

            const data = await response.json();
            const disputes = data.disputes || [];
            
            // Find the specific dispute
            const dispute = disputes.find(d => d.disputeId === disputeId.toString());
            
            if (!dispute) {
                throw new Error(`Dispute #${disputeId} not found`);
            }

            return dispute;
        } catch (error) {
            console.error('Failed to get dispute info:', error);
            throw error;
        }
    }

    // Add fee to dispute
    async addFeeToDispute(disputeId, amount, payFromBond = false) {
        try {
            // Check wallet status from existing wallet manager
            const walletStatus = await this.getWalletStatus();
            if (!walletStatus.isConnected || !walletStatus.address) {
                throw new Error('Wallet not connected. Please use the wallet manager above to connect your Cosmos wallet.');
            }
            
            this.currentAddress = walletStatus.address;
            this.isConnected = true;

            // Validate inputs
            if (!disputeId || disputeId <= 0) {
                throw new Error('Valid dispute ID is required.');
            }

            if (!amount || parseFloat(amount) <= 0) {
                throw new Error('Amount must be a positive number.');
            }

            // Clean amount input - remove 'loya' suffix if present
            const cleanAmount = amount.toString().replace(/loya$/i, '').trim();
            if (parseFloat(cleanAmount) <= 0) {
                throw new Error('Amount must be a positive number.');
            }

            // Convert TRB to micro units (1 TRB = 1,000,000 micro TRB)
            const amountInMicroUnits = this.convertTrbToMicroUnits(cleanAmount);

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

            // Create the add fee message using the protobuf definitions
            if (!window.layerProto || !window.layerProto.createMsgAddFeeToDispute) {
                throw new Error('Layer protobuf definitions not loaded. Please ensure the application is properly initialized.');
            }

            const msg = window.layerProto.createMsgAddFeeToDispute(
                this.currentAddress,
                disputeId,
                {
                    denom: 'loya',
                    amount: amountInMicroUnits
                },
                payFromBond
            );

            console.log('Adding fee to dispute:', {
                creator: msg.value.creator,
                disputeId: msg.value.disputeId,
                amount: msg.value.amount,
                payFromBond: msg.value.payFromBond,
                originalAmount: amount,
                cleanedAmount: cleanAmount,
                amountInMicroUnits: amountInMicroUnits
            });

            console.log('Using gas limit:', '1000000', 'and fee:', '15000 loya');

            // Sign and broadcast the transaction
            const result = await client.signAndBroadcastDirect(
                this.currentAddress,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '15000' }],
                    gas: '1000000'
                },
                'Add Fee to Dispute'
            );

            if (result && result.code === 0) {
                console.log('Transaction result:', result);
                
                // Extract transaction hash
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
            console.error('Failed to add fee to dispute:', error);
            throw error;
        }
    }

    // Get voting information for a dispute
    async getVotingInfo(disputeId) {
        try {
            if (!disputeId || disputeId <= 0) {
                throw new Error('Valid dispute ID is required.');
            }

            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            // Query voting information - this endpoint might not exist, so we'll return basic info
            try {
                const response = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/votes/${disputeId}`);
                
                if (response.ok) {
                    const data = await response.json();
                    return data.vote || data;
                } else {
                    // If endpoint doesn't exist, return basic voting info from dispute data
                    const disputeInfo = await this.getDisputeInfo(disputeId);
            return {
                    disputeId: disputeId,
                        status: disputeInfo.metadata?.dispute_status,
                        endTime: disputeInfo.metadata?.dispute_end_time,
                        message: 'Detailed voting info not available'
                    };
                }
            } catch (error) {
                // Fallback to basic dispute info
                const disputeInfo = await this.getDisputeInfo(disputeId);
                return {
                    disputeId: disputeId,
                    status: disputeInfo.metadata?.dispute_status,
                    endTime: disputeInfo.metadata?.dispute_end_time,
                    message: 'Detailed voting info not available'
                };
            }
        } catch (error) {
            console.error('Failed to get voting info:', error);
            throw error;
        }
    }

    // Check if user has already voted on a dispute
    async hasVoted(disputeId) {
        try {
            if (!this.currentAddress) {
                throw new Error('Wallet not connected.');
            }

            if (!disputeId || disputeId <= 0) {
                throw new Error('Valid dispute ID is required.');
            }

            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            // Query voter information - this endpoint might not exist
            try {
                const response = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/voters/${disputeId}/${this.currentAddress}`);
                
                if (response.ok) {
                    const data = await response.json();
                    return { 
                        hasVoted: true, 
                        vote: data.voter?.vote || data.vote,
                        voterPower: data.voter?.voterPower || data.voterPower
                    };
                } else if (response.status === 404) {
                    return { hasVoted: false, vote: null };
                } else {
                    throw new Error(`Failed to fetch voter info: ${response.status}`);
                }
            } catch (error) {
                // If endpoint doesn't exist, return not voted
                console.warn('Voter endpoint not available, assuming not voted:', error);
                return { hasVoted: false, vote: null, message: 'Voter info not available' };
            }
        } catch (error) {
            console.error('Failed to check voting status:', error);
            throw error;
        }
    }

    // Validate dispute ID
    validateDisputeId(disputeId) {
        if (typeof disputeId !== 'number' && typeof disputeId !== 'string') return false;
        const id = parseInt(disputeId);
        return !isNaN(id) && id > 0;
    }

    // Validate vote choice
    validateVoteChoice(voteChoice) {
        const validChoices = ['vote-support', 'vote-against', 'vote-invalid'];
        return validChoices.includes(voteChoice);
    }

    // Get all disputes with status information
    async getAllDisputes() {
        try {
            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            // Query all disputes
            const response = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/disputes`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch disputes: ${response.status}`);
            }

            const data = await response.json();
            return data.disputes || [];
        } catch (error) {
            console.error('Failed to get disputes:', error);
            throw error;
        }
    }

    // Convert TRB to micro units (1 TRB = 1,000,000 micro TRB)
    convertTrbToMicroUnits(trbAmount) {
        return Math.floor(parseFloat(trbAmount) * 1000000).toString();
    }

    // Convert micro units to TRB
    convertMicroUnitsToTrb(microUnits) {
        return (parseInt(microUnits) / 1000000).toFixed(6);
    }

    // Check if the connected wallet has voting power
    async checkVotingPower() {
        try {
            if (!this.currentAddress) {
                return {
                    hasVotingPower: false,
                    reason: 'No wallet connected',
                    details: 'Please connect your wallet to check voting power'
                };
            }

            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            console.log('Checking voting power for address:', this.currentAddress);

            // Check condition 1: Is team address
            try {
                const teamResponse = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/team-address`);
                if (teamResponse.ok) {
                    const teamData = await teamResponse.json();
                    if (teamData.team_address === this.currentAddress) {
                        console.log('User is team address - has voting power');
                        return {
                            hasVotingPower: true,
                            reason: 'team_address',
                            details: 'Connected wallet is the team address'
                        };
                    }
                }
        } catch (error) {
                console.warn('Failed to check team address:', error);
            }

            // Check condition 2: Has sufficient tips (>= 10,000 loya)
            try {
                const tipsResponse = await fetch(`${rpcEndpoint}/tellor-io/layer/oracle/get_user_tip_total/${this.currentAddress}`);
                if (tipsResponse.ok) {
                    const tipsData = await tipsResponse.json();
                    const totalTips = parseInt(tipsData.total_tips || '0');
                    if (totalTips >= 10000) {
                        console.log('User has sufficient tips - has voting power:', totalTips);
                        return {
                            hasVotingPower: true,
                            reason: 'sufficient_tips',
                            details: `Has ${this.convertMicroUnitsToTrb(totalTips)} TRB in tips (minimum: 0.01 TRB)`
                        };
                    }
                }
            } catch (error) {
                console.warn('Failed to check user tips:', error);
            }

            // Check condition 3: Is unjailed reporter with power >= 1
            try {
                const reportersResponse = await fetch(`${rpcEndpoint}/tellor-io/layer/reporter/reporters`);
                if (reportersResponse.ok) {
                    const reportersData = await reportersResponse.json();
                    const reporter = reportersData.reporters?.find(r => r.address === this.currentAddress);
                    
                    if (reporter) {
                        const power = parseInt(reporter.power || '0');
                        const isJailed = reporter.metadata?.jailed === true;
                        
                        if (!isJailed && power >= 1) {
                            console.log('User is unjailed reporter with sufficient power - has voting power:', power);
                            return {
                                hasVotingPower: true,
                                reason: 'reporter_power',
                                details: `Unjailed reporter with power: ${power}`
                            };
                        } else if (isJailed) {
                            console.log('User is jailed reporter - no voting power');
                            return {
                                hasVotingPower: false,
                                reason: 'jailed_reporter',
                                details: 'Reporter is jailed and cannot vote'
                            };
                        } else {
                            console.log('User is reporter but insufficient power:', power);
                            return {
                                hasVotingPower: false,
                                reason: 'insufficient_reporter_power',
                                details: `Reporter power: ${power} (minimum: 1)`
                            };
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to check reporter status:', error);
            }

            // No voting power found
            console.log('User has no voting power');
            return {
                hasVotingPower: false,
                reason: 'no_voting_power',
                details: 'Address does not meet any voting power requirements (team address, sufficient tips, or unjailed reporter)'
            };

        } catch (error) {
            console.error('Failed to check voting power:', error);
            return {
                hasVotingPower: false,
                reason: 'check_failed',
                details: `Failed to check voting power: ${error.message}`
            };
        }
    }

    // Get all disputes for query tab
    async getAllDisputesForQuery() {
        try {
            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            console.log('Fetching all disputes from:', `${rpcEndpoint}/tellor-io/layer/dispute/disputes`);

            const response = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/disputes`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch disputes: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('All disputes data:', data);

            if (!data.disputes || !Array.isArray(data.disputes)) {
                console.warn('No disputes found in response');
                return {
                    disputes: [],
                    pagination: data.pagination || { total: "0" }
                };
            }

            // Process disputes to add computed fields
            const processedDisputes = data.disputes.map(dispute => {
                const metadata = dispute.metadata || {};
                
                // Convert micro units to TRB for display
                const disputeFee = metadata.dispute_fee ? this.convertMicroUnitsToTrb(metadata.dispute_fee) : '0';
                const feeTotal = metadata.fee_total ? this.convertMicroUnitsToTrb(metadata.fee_total) : '0';
                const slashAmount = metadata.slash_amount ? this.convertMicroUnitsToTrb(metadata.slash_amount) : '0';
                const burnAmount = metadata.burn_amount ? this.convertMicroUnitsToTrb(metadata.burn_amount) : '0';
                
                // Calculate fee remaining
                const feeRequired = parseInt(metadata.slash_amount || '0');
                const feePaid = parseInt(metadata.fee_total || '0');
                const feeRemaining = Math.max(0, feeRequired - feePaid);
                const feeRemainingTrb = this.convertMicroUnitsToTrb(feeRemaining.toString());
                
                return {
                    ...dispute,
                    displayData: {
                        disputeId: dispute.disputeId || metadata.dispute_id,
                        disputeCategory: metadata.dispute_category,
                        disputeStatus: metadata.dispute_status,
                        disputeFee: disputeFee,
                        feeTotal: feeTotal,
                        feeRemaining: feeRemainingTrb,
                        slashAmount: slashAmount,
                        burnAmount: burnAmount,
                        reporter: metadata.initial_evidence?.reporter || 'Unknown',
                        queryId: metadata.initial_evidence?.query_id || 'Unknown',
                        startTime: metadata.dispute_start_time,
                        endTime: metadata.dispute_end_time,
                        blockNumber: metadata.block_number,
                        isOpen: metadata.open,
                        pendingExecution: metadata.pending_execution,
                        voterReward: metadata.voter_reward ? this.convertMicroUnitsToTrb(metadata.voter_reward) : '0'
                    }
                };
            });

            return {
                disputes: processedDisputes,
                pagination: data.pagination || { total: processedDisputes.length.toString() }
            };

        } catch (error) {
            console.error('Failed to fetch all disputes:', error);
            throw error;
        }
    }

    // Get open disputes for dropdown
    async getOpenDisputes() {
        try {
            // Determine RPC endpoint based on wallet manager's network
            let rpcEndpoint;
            if (window.App && window.App.cosmosChainId === 'tellor-1') {
                rpcEndpoint = 'https://mainnet.tellorlayer.com';
            } else {
                rpcEndpoint = 'https://node-palmito.tellorlayer.com';
            }

            // Query all disputes to get status information
            const response = await fetch(`${rpcEndpoint}/tellor-io/layer/dispute/disputes`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch disputes: ${response.status}`);
            }

            const data = await response.json();
            const disputes = data.disputes || [];
            
            // Filter for disputes that are open (regardless of status)
            const openDisputes = disputes.filter(dispute => {
                const metadata = dispute.metadata;
                return metadata && metadata.open === true;
            });
            
            return openDisputes.map(dispute => ({
                id: dispute.disputeId,
                status: dispute.metadata.dispute_status,
                feeRequired: dispute.metadata.dispute_fee,
                feePaid: dispute.metadata.fee_total,
                feeRemaining: parseInt(dispute.metadata.dispute_fee) - parseInt(dispute.metadata.fee_total),
                canVote: dispute.metadata.dispute_status === 'DISPUTE_STATUS_VOTING'
            }));
        } catch (error) {
            console.error('Failed to get open disputes:', error);
            throw error;
        }
    }
}

// Export the class for use in other modules
window.DisputeProposer = DisputeProposer;

// Create a global instance
window.disputeProposer = new DisputeProposer();

console.log('DisputeProposer module loaded successfully');
