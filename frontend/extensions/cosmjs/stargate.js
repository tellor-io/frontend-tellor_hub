// @cosmjs/stargate v0.28.11
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cosmjs = global.cosmjs || {}, global.cosmjs.stargate = {}));
}(this, (function (exports) {
    'use strict';

    // Stargate client implementation
    class SigningStargateClient {
        constructor(rpcUrl, signer) {
            // Remove any trailing slashes and ensure we don't have /rpc in the base URL
            this.rpcUrl = (rpcUrl || "https://node-palmito.tellorlayer.com").replace(/\/+$/, '').replace(/\/rpc$/, '');
            this.signer = signer;
        }

        static async connectWithSigner(rpcUrl, signer) {
            return new SigningStargateClient(rpcUrl, signer);
        }

        async getAccount(address) {
            try {
                // Use the correct REST API endpoint
                const accountUrl = `${this.rpcUrl}/cosmos/auth/v1beta1/accounts/${address}`;
                
                const response = await fetch(accountUrl);

                if (!response.ok) {
                    if (response.status === 404) {
                        // If account is new, return default values
                        return {
                            account_number: "0",
                            sequence: "0"
                        };
                    }
                    const errorText = await response.text();
                    console.error('Account fetch error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.account) {
                    console.error('Invalid account response format:', data);
                    throw new Error('Invalid response format');
                }

                // Extract account number and sequence
                return {
                    account_number: data.account.account_number || "0",
                    sequence: data.account.sequence || "0"
                };
            } catch (error) {
                console.error('Error in getAccount:', error);
                throw error;
            }
        }

        async getBalance(address, searchDenom) {
            try {
                // Use the offline signer to get the account
                const accounts = await this.signer.getAccounts();
                const account = accounts.find(acc => acc.address === address);
                
                if (!account) {
                    console.error('Account not found in signer');
                    throw new Error('Account not found');
                }

                // Use the correct REST API endpoint
                const baseUrl = window.App && window.App.getCosmosApiEndpoint ? window.App.getCosmosApiEndpoint() : 'https://node-palmito.tellorlayer.com';
                const balanceUrl = `${baseUrl}/cosmos/bank/v1beta1/balances/${address}`;
                
                const response = await fetch(balanceUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        return {
                            amount: "0",
                            denom: searchDenom
                        };
                    }
                    const errorText = await response.text();
                    console.error('Balance fetch error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || !data.balances) {
                    console.error('Invalid balance response format:', data);
                    throw new Error('Invalid response format');
                }

                // Find the balance with the matching denom
                const balance = data.balances.find(b => b.denom === searchDenom);
                if (balance) {
                    return balance;
                }

                // If no matching balance found, return default
                return {
                    amount: "0",
                    denom: searchDenom
                };
            } catch (error) {
                console.error('Error in getBalance:', error);
                return {
                    amount: "0",
                    denom: searchDenom
                };
            }
        }

        // Unified direct signing method for all message types
        async signAndBroadcastDirect(signerAddress, messages, fee, memo = "") {
            try {
                // Get account info
                const accountInfo = await this.getAccount(signerAddress);

                if (!accountInfo) {
                    throw new Error('Account not found');
                }

                // Get the appropriate signer for direct signing
                let offlineSigner;
                if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                    // Use wallet adapter if available
                    offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
                } else if (window.getOfflineSignerAuto) {
                    // Fallback to legacy methods
                    offlineSigner = await window.getOfflineSignerAuto('layertest-4');
                } else if (window.getOfflineSignerDirect) {
                    offlineSigner = window.getOfflineSignerDirect('layertest-4');
                } else if (window.getOfflineSigner) {
                    // Use the current chain ID from the app
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'layertest-4';
                offlineSigner = window.getOfflineSigner(chainId);
                } else {
                    throw new Error('No offline signer available');
                }

                // Create protobuf types
                const root = new protobuf.Root();
                
                // Define Coin type
                const Coin = new protobuf.Type("Coin")
                    .add(new protobuf.Field("denom", 1, "string"))
                    .add(new protobuf.Field("amount", 2, "string"));
                
                // Define Any type
                const Any = new protobuf.Type("Any")
                    .add(new protobuf.Field("typeUrl", 1, "string"))
                    .add(new protobuf.Field("value", 2, "bytes"));
                
                // Define PubKey type for secp256k1
                const PubKey = new protobuf.Type("PubKey")
                    .add(new protobuf.Field("key", 1, "bytes"));
                
                // Define TxBody type
                const TxBody = new protobuf.Type("TxBody")
                    .add(new protobuf.Field("messages", 1, "Any", "repeated"))
                    .add(new protobuf.Field("memo", 2, "string"))
                    .add(new protobuf.Field("timeoutHeight", 3, "uint64"))
                    .add(new protobuf.Field("extensionOptions", 1023, "Any", "repeated"))
                    .add(new protobuf.Field("nonCriticalExtensionOptions", 2047, "Any", "repeated"));
                
                // Define SignMode enum
                const SignMode = new protobuf.Enum("SignMode")
                    .add("SIGN_MODE_UNSPECIFIED", 0)
                    .add("SIGN_MODE_DIRECT", 1)
                    .add("SIGN_MODE_TEXTUAL", 2)
                    .add("SIGN_MODE_LEGACY_AMINO_JSON", 127);
                
                // Define Single type
                const Single = new protobuf.Type("Single")
                    .add(new protobuf.Field("mode", 1, "SignMode"));
                
                // Define ModeInfo type
                const ModeInfo = new protobuf.Type("ModeInfo")
                    .add(new protobuf.Field("single", 1, "Single"));
                
                // Define SignerInfo type
                const SignerInfo = new protobuf.Type("SignerInfo")
                    .add(new protobuf.Field("publicKey", 1, "Any"))
                    .add(new protobuf.Field("modeInfo", 2, "ModeInfo"))
                    .add(new protobuf.Field("sequence", 3, "uint64"));
                
                // Define Fee type
                const Fee = new protobuf.Type("Fee")
                    .add(new protobuf.Field("amount", 1, "Coin", "repeated"))
                    .add(new protobuf.Field("gasLimit", 2, "uint64"))
                    .add(new protobuf.Field("payer", 3, "string"))
                    .add(new protobuf.Field("granter", 4, "string"));
                
                // Define AuthInfo type
                const AuthInfo = new protobuf.Type("AuthInfo")
                    .add(new protobuf.Field("signerInfos", 1, "SignerInfo", "repeated"))
                    .add(new protobuf.Field("fee", 2, "Fee"));
                
                // Define Tx type
                const Tx = new protobuf.Type("Tx")
                    .add(new protobuf.Field("body", 1, "TxBody"))
                    .add(new protobuf.Field("authInfo", 2, "AuthInfo"))
                    .add(new protobuf.Field("signatures", 3, "bytes", "repeated"));

                // Add types to root
                root.add(Coin);
                root.add(Any);
                root.add(PubKey);
                root.add(TxBody);
                root.add(SignMode);
                root.add(Single);
                root.add(ModeInfo);
                root.add(SignerInfo);
                root.add(Fee);
                root.add(AuthInfo);
                root.add(Tx);

                // Get the types
                const TxType = root.lookupType("Tx");
                const AnyType = root.lookupType("Any");
                const TxBodyType = root.lookupType("TxBody");
                const AuthInfoType = root.lookupType("AuthInfo");
                const PubKeyType = root.lookupType("PubKey");

                // Encode messages based on their type
                const encodedMessages = [];
                for (const message of messages) {
                    let encodedMessage;
                    
                    if (message.typeUrl === '/layer.bridge.MsgWithdrawTokens') {
                        // Encode withdrawal message using the same approach as the original Amino method
                        const MsgWithdrawTokens = new protobuf.Type("MsgWithdrawTokens")
                            .add(new protobuf.Field("creator", 1, "string"))
                            .add(new protobuf.Field("recipient", 2, "string"))
                            .add(new protobuf.Field("amount", 3, "Coin"));
                        
                        root.add(MsgWithdrawTokens);
                        const MsgType = root.lookupType("MsgWithdrawTokens");
                        
                        const msgValue = {
                            creator: message.value.creator,
                            recipient: message.value.recipient.toLowerCase().replace('0x', ''), // Remove 0x prefix for Layer chain
                            amount: {
                                denom: message.value.amount.denom,
                                amount: message.value.amount.amount.toString()
                            }
                        };
                        
                        console.log('Encoding MsgWithdrawTokens:', msgValue);
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/layer.bridge.MsgRequestAttestations') {
                        // Encode attestation request message using the same approach as the original Amino method
                        const MsgRequestAttestations = new protobuf.Type("MsgRequestAttestations")
                            .add(new protobuf.Field("creator", 1, "string"))
                            .add(new protobuf.Field("query_id", 2, "string"))
                            .add(new protobuf.Field("timestamp", 3, "string"));
                        
                        root.add(MsgRequestAttestations);
                        const MsgType = root.lookupType("MsgRequestAttestations");
                        
                        const msgValue = {
                            creator: message.value.creator,
                            query_id: message.value.query_id,
                            timestamp: message.value.timestamp.toString()
                        };
                        
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/cosmos.staking.v1beta1.MsgDelegate') {
                        // Encode delegation message
                        const MsgDelegate = new protobuf.Type("MsgDelegate")
                            .add(new protobuf.Field("delegatorAddress", 1, "string"))
                            .add(new protobuf.Field("validatorAddress", 2, "string"))
                            .add(new protobuf.Field("amount", 3, "Coin"));
                        
                        root.add(MsgDelegate);
                        const MsgType = root.lookupType("MsgDelegate");
                        const msgValue = {
                            delegatorAddress: message.value.delegatorAddress,
                            validatorAddress: message.value.validatorAddress,
                            amount: {
                                denom: message.value.amount.denom,
                                amount: message.value.amount.amount.toString()
                            }
                        };
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/layer.oracle.MsgNoStakeReport') {
                        // Encode no-stake report message
                        const MsgNoStakeReport = new protobuf.Type("MsgNoStakeReport")
                            .add(new protobuf.Field("creator", 1, "string"))
                            .add(new protobuf.Field("query_data", 2, "bytes"))
                            .add(new protobuf.Field("value", 3, "string"));
                        
                        root.add(MsgNoStakeReport);
                        const MsgType = root.lookupType("MsgNoStakeReport");
                        
                        const msgValue = {
                            creator: message.value.creator,
                            query_data: message.value.query_data,
                            value: message.value.value
                        };
                        
                        console.log('Encoding MsgNoStakeReport:', msgValue);
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/layer.dispute.MsgProposeDispute') {
                        // Encode dispute proposal message
                        const MsgProposeDispute = new protobuf.Type("MsgProposeDispute")
                            .add(new protobuf.Field("creator", 1, "string"))
                            .add(new protobuf.Field("disputedReporter", 2, "string"))
                            .add(new protobuf.Field("reportMetaId", 3, "uint64"))
                            .add(new protobuf.Field("reportQueryId", 4, "string"))
                            .add(new protobuf.Field("disputeCategory", 5, "uint32"))
                            .add(new protobuf.Field("fee", 6, "Coin"))
                            .add(new protobuf.Field("payFromBond", 7, "bool"));
                        
                        root.add(MsgProposeDispute);
                        const MsgType = root.lookupType("MsgProposeDispute");
                        
                        const msgValue = {
                            creator: message.value.creator,
                            disputedReporter: message.value.disputedReporter,
                            reportMetaId: message.value.reportMetaId,
                            reportQueryId: message.value.reportQueryId,
                            disputeCategory: message.value.disputeCategory,
                            fee: message.value.fee,
                            payFromBond: message.value.payFromBond
                        };
                        
                        console.log('Encoding MsgProposeDispute:', msgValue);
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/layer.dispute.MsgVote') {
                        // Encode dispute vote message
                        const MsgVote = new protobuf.Type("MsgVote")
                            .add(new protobuf.Field("voter", 1, "string"))
                            .add(new protobuf.Field("id", 2, "uint64"))
                            .add(new protobuf.Field("vote", 3, "uint32"));  // Changed from "string" to "uint32"
                        
                        root.add(MsgVote);
                        const MsgType = root.lookupType("MsgVote");
                        
                        const msgValue = {
                            voter: message.value.voter,
                            id: message.value.id,
                            vote: message.value.vote
                        };
                        
                        console.log('Encoding MsgVote:', msgValue);
                        console.log('Vote field type:', typeof msgValue.vote, 'Value:', msgValue.vote);
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/layer.dispute.MsgAddFeeToDispute') {
                        // Encode dispute add fee message
                        const MsgAddFeeToDispute = new protobuf.Type("MsgAddFeeToDispute")
                            .add(new protobuf.Field("creator", 1, "string"))
                            .add(new protobuf.Field("disputeId", 2, "uint64"))
                            .add(new protobuf.Field("amount", 3, "Coin"))
                            .add(new protobuf.Field("payFromBond", 4, "bool"));
                        
                        root.add(MsgAddFeeToDispute);
                        const MsgType = root.lookupType("MsgAddFeeToDispute");
                        
                        const msgValue = {
                            creator: message.value.creator,
                            disputeId: message.value.disputeId,
                            amount: message.value.amount,
                            payFromBond: message.value.payFromBond
                        };
                        
                        console.log('Encoding MsgAddFeeToDispute:', msgValue);
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else if (message.typeUrl === '/layer.reporter.MsgSelectReporter') {
                        // Encode reporter selection message
                        const MsgSelectReporter = new protobuf.Type("MsgSelectReporter")
                            .add(new protobuf.Field("selectorAddress", 1, "string"))
                            .add(new protobuf.Field("reporterAddress", 2, "string"))
                            .add(new protobuf.Field("stakeAmount", 3, "string"));
                        
                        root.add(MsgSelectReporter);
                        const MsgType = root.lookupType("MsgSelectReporter");
                        
                        const msgValue = {
                            selectorAddress: message.value.selectorAddress,
                            reporterAddress: message.value.reporterAddress,
                            stakeAmount: message.value.stakeAmount || '0'
                        };
                        
                        console.log('Encoding MsgSelectReporter:', msgValue);
                        encodedMessage = MsgType.encode(MsgType.create(msgValue)).finish();
                    } else {
                        throw new Error(`Unsupported message type: ${message.typeUrl}`);
                    }

                    // Create message Any
                    const messageAny = {
                        typeUrl: message.typeUrl,
                        value: encodedMessage
                    };
                    encodedMessages.push(messageAny);
                }

                // Create the TxBody
                const txBody = {
                    messages: encodedMessages,
                    memo: memo,
                    timeoutHeight: 0,
                    extensionOptions: [],
                    nonCriticalExtensionOptions: []
                };

                // Encode TxBody
                const encodedTxBody = TxBodyType.encode(TxBodyType.create(txBody)).finish();

                // Get accounts from signer
                const accounts = await offlineSigner.getAccounts();
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in signer');
                }
                const signerAccount = accounts[0];

                // Create the AuthInfo
                const authInfo = {
                    signerInfos: [{
                        publicKey: {
                            typeUrl: "/cosmos.crypto.secp256k1.PubKey",
                            value: PubKeyType.encode({ key: signerAccount.pubkey }).finish()
                        },
                        modeInfo: {
                            single: {
                                mode: 1 // SIGN_MODE_DIRECT
                            }
                        },
                        sequence: parseInt(accountInfo.sequence)
                    }],
                    fee: {
                        amount: fee.amount,
                        gasLimit: parseInt(fee.gas),
                        payer: "",
                        granter: ""
                    }
                };

                // Encode AuthInfo
                const encodedAuthInfo = AuthInfoType.encode(AuthInfoType.create(authInfo)).finish();

                // Create the sign doc for direct signing
                const signDoc = {
                    bodyBytes: encodedTxBody,
                    authInfoBytes: encodedAuthInfo,
                    chainId: 'layertest-4',
                    accountNumber: parseInt(accountInfo.account_number)
                };

                // Sign the transaction using signDirect
                const signResult = await offlineSigner.signDirect(signerAddress, signDoc);

                // Create the final transaction
                const finalTx = {
                    body: TxBodyType.decode(signResult.signed.bodyBytes),
                    authInfo: AuthInfoType.decode(signResult.signed.authInfoBytes),
                    signatures: [signResult.signature.signature]
                };

                // Encode the final transaction
                const txObj = TxType.create(finalTx);
                const encodedTx = TxType.encode(txObj).finish();
                const base64Tx = btoa(String.fromCharCode.apply(null, encodedTx));

                // Broadcast the transaction
                const response = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tx_bytes: base64Tx,
                        mode: "BROADCAST_MODE_SYNC"
                    })
                });

                const result = await response.json();

                if (result.tx_response?.code !== 0) {
                    console.error('Transaction error details:', {
                        code: result.tx_response?.code,
                        message: result.tx_response?.raw_log,
                        txHash: result.tx_response?.txhash,
                        height: result.tx_response?.height
                    });
                    throw new Error(result.tx_response?.raw_log || 'Transaction failed');
                }

                // Poll for transaction status
                const txHash = result.tx_response.txhash;
                let attempts = 0;
                const maxAttempts = 10;
                const pollInterval = 2000; // 2 seconds

                while (attempts < maxAttempts) {
                    attempts++;
                    
                    try {
                        const statusResponse = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs/${txHash}`);
                        const statusData = await statusResponse.json();
                        
                        if (statusResponse.ok && statusData.tx_response) {
                            const txResponse = statusData.tx_response;
                            
                            if (txResponse.height !== "0") {
                                // Transaction has been included in a block
                                if (txResponse.code === 0) {
                                    return txResponse;
                                } else {
                                    throw new Error(txResponse.raw_log || 'Transaction failed');
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error polling transaction status:', error);
                    }
                    
                    // Wait before next attempt
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }

                // If we get here, the transaction hasn't been included in a block
                return result.tx_response;
            } catch (error) {
                console.error('Error in signAndBroadcastDirect:', error);
                throw error;
            }
        }

        // Legacy method for backward compatibility (deprecated)
        async signAndBroadcast(signerAddress, messages, fee, memo = "") {
            console.warn('signAndBroadcast is deprecated. Use signAndBroadcastDirect instead.');
            return this.signAndBroadcastDirect(signerAddress, messages, fee, memo);
        }
    }

    // Helper function to poll transaction status
    async function pollTransactionStatus(txHash) {
        try {
            // Format the hash to match the expected format (remove '0x' if present and ensure uppercase)
            const formattedHash = txHash.replace('0x', '').toUpperCase();
            const baseUrl = window.App && window.App.getCosmosApiEndpoint ? window.App.getCosmosApiEndpoint() : 'https://node-palmito.tellorlayer.com';
            
            // Try both endpoints
            const endpoints = [
                `${baseUrl}/rpc/tx?hash=0x${formattedHash}&prove=false`,
                `${baseUrl}/cosmos/tx/v1beta1/txs/${formattedHash}`
            ];
            
            // Try the first endpoint
            let response = await fetch(endpoints[0]);
            let data;
            
            if (!response.ok) {
                // Try the second endpoint
                response = await fetch(endpoints[1]);
                if (!response.ok) {
                    throw new Error(`Failed to fetch transaction status: ${response.status}`);
                }
            }
            
            data = await response.json();
            
            // Handle both response formats
            let txResult;
            if (data.result && data.result.tx_result) {
                // First endpoint format
                txResult = data.result.tx_result;
            } else if (data.tx_response) {
                // Second endpoint format
                txResult = data.tx_response;
            } else {
                throw new Error('Unexpected response format');
            }
            
            // Check if transaction was successful
            if (txResult.code === 0) {
                // Look for the tokens_withdrawn event
                const events = txResult.events || [];
                const withdrawEvent = events.find(event => event.type === 'tokens_withdrawn');
                
                return {
                    success: true,
                    height: data.result?.height || data.tx_response?.height,
                    gasUsed: txResult.gas_used,
                    gasWanted: txResult.gas_wanted,
                    events: events
                };
            } else {
                console.error('Transaction failed:', txResult.log);
                return {
                    success: false,
                    error: txResult.log
                };
            }
        } catch (error) {
            console.error('Error polling transaction status:', error);
            // Don't throw the error, just return a failure status
            return {
                success: false,
                error: error.message,
                retryable: true // Indicate that this error might be temporary
            };
        }
    }

    // Updated withdrawal function using direct signing
    async function withdrawFromLayer(amount, ethereumAddress, account) {
        try {
            const amountInMicroUnits = (parseFloat(amount) * 1000000).toString();

            // Get offline signer from wallet adapter or fallback to legacy method
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.getOfflineSigner) {
                // Use the current chain ID from the app
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'layertest-4';
                offlineSigner = window.getOfflineSigner(chainId);
            } else {
                throw new Error('No offline signer available');
            }

            // Use the current RPC endpoint from the app
            const rpcEndpoint = window.App && window.App.getCosmosRpcEndpoint ? window.App.getCosmosRpcEndpoint() : 'https://node-palmito.tellorlayer.com/rpc';
            const client = await SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Create the message
            const msg = {
                typeUrl: '/layer.bridge.MsgWithdrawTokens',
                value: {
                    creator: account,
                    recipient: ethereumAddress,
                    amount: {
                        amount: amountInMicroUnits,
                        denom: 'loya'
                    }
                }
            };

            // Show pending popup
            showPendingPopup();

            // Sign and broadcast using direct signing
            const result = await client.signAndBroadcastDirect(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Withdraw TRB to Ethereum'
            );

            hidePendingPopup();
            showSuccessPopup();
            return result;
        } catch (error) {
            console.error('Transaction error:', error);
            hidePendingPopup();
            showErrorPopup(error.message);
            throw error;
        }
    }

    // Updated attestation request function using direct signing
    async function requestAttestations(account, queryId, timestamp) {
        try {
            // Get offline signer from wallet adapter or fallback to legacy method
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.getOfflineSigner) {
                // Use the current chain ID from the app
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'layertest-4';
                offlineSigner = window.getOfflineSigner(chainId);
            } else {
                throw new Error('No offline signer available');
            }

            // Use the current RPC endpoint from the app
            const rpcEndpoint = window.App && window.App.getCosmosRpcEndpoint ? window.App.getCosmosRpcEndpoint() : 'https://node-palmito.tellorlayer.com/rpc';
            const client = await SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Create the message
            const msg = {
                typeUrl: '/layer.bridge.MsgRequestAttestations',
                value: {
                    creator: account,
                    query_id: queryId,
                    timestamp: timestamp.toString()
                }
            };

            // Sign and broadcast using direct signing
            const result = await client.signAndBroadcastDirect(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Request attestations for withdrawal'
            );

            return result;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }

    // Updated delegation function using direct signing
    async function delegateTokens(account, validatorAddress, amount) {
        try {
            // Get offline signer from wallet adapter or fallback to legacy method
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.getOfflineSigner) {
                // Use the current chain ID from the app
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'layertest-4';
                offlineSigner = window.getOfflineSigner(chainId);
            } else {
                throw new Error('No offline signer available');
            }

            // Use the current RPC endpoint from the app
            const rpcEndpoint = window.App && window.App.getCosmosRpcEndpoint ? window.App.getCosmosRpcEndpoint() : 'https://node-palmito.tellorlayer.com/rpc';
            const client = await SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Convert amount to micro units (1 TRB = 1,000,000 micro units)
            const amountInMicroUnits = Math.floor(parseFloat(amount) * 1000000).toString();

            // Create the message
            const msg = {
                typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
                value: {
                    delegatorAddress: account,
                    validatorAddress: validatorAddress,
                    amount: {
                        denom: 'loya',
                        amount: amountInMicroUnits
                    }
                }
            };

            // Sign and broadcast using direct signing
            const result = await client.signAndBroadcastDirect(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Delegate tokens to validator'
            );

            return result;
        } catch (error) {
            console.error('Delegation error:', error);
            throw error;
        }
    }

    // Function to select a reporter
    async function selectReporter(account, reporterAddress, stakeAmount = null) {
        try {
            // Get offline signer from wallet adapter or fallback to legacy method
            let offlineSigner;
            if (window.cosmosWalletAdapter && window.cosmosWalletAdapter.isConnected()) {
                offlineSigner = window.cosmosWalletAdapter.getOfflineSigner();
            } else if (window.getOfflineSigner) {
                // Use the current chain ID from the app
                const chainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'layertest-4';
                offlineSigner = window.getOfflineSigner(chainId);
            } else {
                throw new Error('No offline signer available');
            }

            // Use the current RPC endpoint from the app
            const rpcEndpoint = window.App && window.App.getCosmosRpcEndpoint ? window.App.getCosmosRpcEndpoint() : 'https://node-palmito.tellorlayer.com/rpc';
            const client = await SigningStargateClient.connectWithSigner(
                rpcEndpoint,
                offlineSigner
            );

            // Create the MsgSelectReporter message
            const msg = {
                typeUrl: '/layer.reporter.MsgSelectReporter',
                value: {
                    selectorAddress: account,
                    reporterAddress: reporterAddress,
                    stakeAmount: stakeAmount || '0'
                }
            };

            // Sign and broadcast using direct signing
            const result = await client.signAndBroadcastDirect(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Select reporter for data submissions'
            );

            return result;
        } catch (error) {
            console.error('Reporter selection error:', error);
            throw error;
        }
    }

    // Export to both module and global scope
    exports.SigningStargateClient = SigningStargateClient;
    exports.withdrawFromLayer = withdrawFromLayer;
    exports.requestAttestations = requestAttestations;
    exports.delegateTokens = delegateTokens;
    exports.selectReporter = selectReporter;
    exports.pollTransactionStatus = pollTransactionStatus;

    // Ensure cosmjs object exists
    window.cosmjs = window.cosmjs || {};
    window.cosmjs.stargate = window.cosmjs.stargate || {};

    // Export to both locations
    window.cosmjs.stargate.SigningStargateClient = SigningStargateClient;
    window.cosmjs.stargate.withdrawFromLayer = withdrawFromLayer;
    window.cosmjs.stargate.requestAttestations = requestAttestations;
    window.cosmjs.stargate.delegateTokens = delegateTokens;
    window.cosmjs.stargate.selectReporter = selectReporter;
    window.cosmjs.stargate.pollTransactionStatus = pollTransactionStatus;
    
    window.cosmjsStargate = {
        SigningStargateClient: SigningStargateClient,
        withdrawFromLayer: withdrawFromLayer,
        requestAttestations: requestAttestations,
        delegateTokens: delegateTokens,
        selectReporter: selectReporter,
        pollTransactionStatus: pollTransactionStatus
    };
}))); 