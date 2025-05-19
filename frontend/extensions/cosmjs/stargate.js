// @cosmjs/stargate v0.28.11
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cosmjs = global.cosmjs || {}, global.cosmjs.stargate = {}));
}(this, (function (exports) {
    'use strict';

    // Add registry for custom message types
    const customTypes = [
        ["/layer.bridge.MsgWithdrawTokens", {
            encode: (message) => {
                // Create a fresh message each time
                const msg = {
                    creator: message.creator,
                    recipient: message.recipient.toLowerCase(),
                    amount: {
                        denom: message.amount.denom,
                        amount: message.amount.amount.toString()
                    }
                };
                return window.layerProto.encodeMessage(msg);
            },
            decode: (binary) => {
                return window.layerProto.decodeMessage(binary);
            }
        }],
        ["/layer.bridge.MsgRequestAttestations", {
            encode: (message) => {
                // Create a fresh message each time
                const msg = {
                    creator: message.creator,
                    query_id: message.query_id,
                    timestamp: message.timestamp
                };
                return window.layerProto.encodeMessage(msg);
            },
            decode: (binary) => {
                return window.layerProto.decodeMessage(binary);
            }
        }]
    ];

    // Stargate client implementation
    class SigningStargateClient {
        constructor(rpcUrl, signer) {
            // Remove any trailing slashes and ensure we don't have /rpc in the base URL
            this.rpcUrl = (rpcUrl || "https://node-palmito.tellorlayer.com").replace(/\/+$/, '').replace(/\/rpc$/, '');
            this.signer = signer;
            this.registry = new Map(customTypes);
        }

        static async connectWithSigner(rpcUrl, signer) {
            return new SigningStargateClient(rpcUrl, signer);
        }

        async getAccount(address) {
            try {
                console.log('Fetching account info for:', address);
                
                // Use the correct REST API endpoint
                const accountUrl = `${this.rpcUrl}/cosmos/auth/v1beta1/accounts/${address}`;
                console.log('Fetching account from:', accountUrl);
                
                const response = await fetch(accountUrl);
                console.log('Account response status:', response.status);

                if (!response.ok) {
                    if (response.status === 404) {
                        // If account is new, return default values
                        console.log('Account not found on chain, using default values for new account');
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
                console.log('Account data:', data);

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
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                throw error;
            }
        }

        async getBalance(address, searchDenom) {
            try {
                console.log('Fetching balance for:', { address, searchDenom });
                
                // Use the offline signer to get the account
                const accounts = await this.signer.getAccounts();
                const account = accounts.find(acc => acc.address === address);
                
                if (!account) {
                    console.error('Account not found in signer');
                    throw new Error('Account not found');
                }

                console.log('Found account:', account);

                // Use the correct REST API endpoint
                const baseUrl = 'https://node-palmito.tellorlayer.com';
                const balanceUrl = `${baseUrl}/cosmos/bank/v1beta1/balances/${address}`;
                
                console.log('Fetching balance from:', balanceUrl);

                const response = await fetch(balanceUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Balance response status:', response.status);

                if (!response.ok) {
                    if (response.status === 404) {
                        console.log('No balances found for account');
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
                console.log('Full balance response data:', JSON.stringify(data, null, 2));

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
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                return {
                    amount: "0",
                    denom: searchDenom
                };
            }
        }

        async signAndBroadcast(signerAddress, messages, fee, memo = "") {
            console.log('Starting signAndBroadcast...');
            console.log('Signer address:', signerAddress);
            console.log('Messages:', messages);
            console.log('Fee:', fee);
            console.log('Memo:', memo);

            try {
                // Get account info
                const accountInfo = await this.getAccount(signerAddress);
                console.log('Account info:', accountInfo);

                if (!accountInfo) {
                    throw new Error('Account not found');
                }

                // Create the transaction to sign
                const txToSign = {
                    chain_id: 'layertest-4',
                    account_number: accountInfo.account_number,
                    sequence: accountInfo.sequence,
                    fee: {
                        amount: fee.amount,
                        gas: fee.gas
                    },
                    msgs: messages.map(msg => {
                        // If this is a withdrawal message, remove '0x' prefix from recipient
                        if (msg.typeUrl === '/layer.bridge.MsgWithdrawTokens' && msg.value.recipient) {
                            return {
                                type: msg.typeUrl,
                                value: {
                                    ...msg.value,
                                    recipient: msg.value.recipient.toLowerCase().replace('0x', '')
                                }
                            };
                        }
                        return {
                            type: msg.typeUrl,
                            value: msg.value
                        };
                    }),
                    memo: memo
                };

                console.log('Transaction to sign:', txToSign);

                // Sign the transaction
                console.log('Requesting signature from Keplr...');
                const signResult = await this.signer.signAmino(signerAddress, txToSign);
                console.log('Sign result:', signResult);

                // Store the signature and public key for broadcasting
                this.signature = signResult.signature.signature;
                this.publicKey = signResult.signature.pub_key.value;
                this.sequence = accountInfo.sequence;

                // Create a fresh message with the recipient address without '0x' prefix
                const messageToEncode = {
                    ...messages[0],
                    value: {
                        ...messages[0].value,
                        recipient: messages[0].value.recipient.toLowerCase().replace('0x', '')
                    }
                };

                // Encode the message
                const encodedMessage = window.layerProto.encodeMessage(messageToEncode.value);
                console.log('Encoded message:', encodedMessage);

                // Broadcast the transaction
                const result = await this.broadcastTransaction(encodedMessage);
                console.log('Broadcast result:', result);

                return result;
            } catch (error) {
                console.error('Error in signAndBroadcast:', error);
                throw error;
            }
        }

        // Helper method to handle transaction broadcasting
        async broadcastTransaction(txBytes, mode = "BROADCAST_MODE_SYNC") {
            console.log('Broadcasting transaction...');
            console.log('Transaction bytes:', txBytes);

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
                .add(new protobuf.Field("timeoutHeight", 3, "uint64"));
            
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

            try {
                // Get the account from the signer
                const accounts = await this.signer.getAccounts();
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found in signer');
                }
                const account = accounts[0];
                console.log('Using account:', account);

                // Create the message Any
                const messageAny = {
                    typeUrl: "/layer.bridge.MsgWithdrawTokens",
                    value: txBytes
                };
                console.log('Creating message Any:', messageAny);

                // Create the TxBody with the message
                const txBody = {
                    messages: [messageAny],
                    memo: "Withdraw TRB to Ethereum",
                    timeoutHeight: 0
                };
                console.log('Creating TxBody:', txBody);

                // Create the public key
                const pubKey = {
                    key: this.publicKey
                };
                console.log('Creating public key:', pubKey);
                const encodedPubKey = PubKeyType.encode(pubKey).finish();

                // Create the public key Any
                const pubKeyAny = {
                    typeUrl: "/cosmos.crypto.secp256k1.PubKey",
                    value: encodedPubKey
                };
                console.log('Creating public key Any:', pubKeyAny);

                // Create the AuthInfo
                const authInfo = {
                    signerInfos: [{
                        publicKey: pubKeyAny,
                        modeInfo: {
                            single: {
                                mode: 127 // SIGN_MODE_LEGACY_AMINO_JSON
                            }
                        },
                        sequence: parseInt(this.sequence)
                    }],
                    fee: {
                        amount: [{ denom: "loya", amount: "5000" }],
                        gasLimit: parseInt("200000"),
                        payer: "",
                        granter: ""
                    }
                };
                console.log('Creating AuthInfo:', authInfo);

                // Create the final transaction
                const tx = {
                    body: txBody,
                    authInfo: authInfo,
                    signatures: [this.signature]
                };
                console.log('Creating final transaction:', tx);

                // Create and encode the final transaction
                const txObj = TxType.create(tx);
                const encodedTx = TxType.encode(txObj).finish();
                console.log('Encoded final transaction:', encodedTx);

                // Convert to base64
                const base64Tx = btoa(String.fromCharCode.apply(null, encodedTx));

                // Log the transaction details for debugging
                console.log('Transaction details:', {
                    messageAny,
                    txBody,
                    pubKey,
                    pubKeyAny,
                    authInfo,
                    tx,
                    base64Tx,
                    encodedTxLength: encodedTx.length,
                    encodedPubKeyLength: encodedPubKey.length,
                    messageLength: txBytes.length
                });

                // Broadcast the transaction using the encoded bytes
                const response = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tx_bytes: base64Tx,
                        mode: mode
                    })
                });

                const result = await response.json();
                console.log('Broadcast result:', result);

                if (result.tx_response?.code !== 0) {
                    console.error('Transaction error details:', {
                        code: result.tx_response?.code,
                        message: result.tx_response?.raw_log,
                        tx_response: result.tx_response,
                        txHash: result.tx_response?.txhash,
                        height: result.tx_response?.height
                    });
                    throw new Error(result.tx_response?.raw_log || 'Transaction failed');
                }

                // Poll for transaction status
                const txHash = result.tx_response.txhash;
                console.log('Polling for transaction status:', txHash);
                
                let attempts = 0;
                const maxAttempts = 10;
                const pollInterval = 2000; // 2 seconds

                while (attempts < maxAttempts) {
                    attempts++;
                    console.log(`Polling attempt ${attempts}/${maxAttempts}`);
                    
                    try {
                        const statusResponse = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs/${txHash}`);
                        const statusData = await statusResponse.json();
                        
                        if (statusResponse.ok && statusData.tx_response) {
                            const txResponse = statusData.tx_response;
                            console.log('Transaction status:', txResponse);
                            
                            if (txResponse.height !== "0") {
                                // Transaction has been included in a block
                                if (txResponse.code === 0) {
                                    console.log('Transaction successful:', txResponse);
                                    return txResponse;
                                } else {
                                    console.error('Transaction failed:', txResponse);
                                    throw new Error(txResponse.raw_log || 'Transaction failed');
                                }
                            }
                        }
                    } catch (error) {
                        console.log('Error polling transaction status:', error);
                    }
                    
                    // Wait before next attempt
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }

                // If we get here, the transaction hasn't been included in a block
                console.log('Transaction broadcast successful but not yet included in a block');
                return result.tx_response;
            } catch (error) {
                console.error('Error encoding transaction:', error);
                throw error;
            }
        }
    }

    // Export to both module and global scope
    exports.SigningStargateClient = SigningStargateClient;
    
    // Ensure cosmjs object exists
    window.cosmjs = window.cosmjs || {};
    window.cosmjs.stargate = window.cosmjs.stargate || {};
    
    // Export to both locations
    window.cosmjs.stargate.SigningStargateClient = SigningStargateClient;
    window.cosmjsStargate = {
        SigningStargateClient: SigningStargateClient
    };

    async function pollTransactionStatus(txHash) {
        try {
            // Format the hash to match the expected format (remove '0x' if present and ensure uppercase)
            const formattedHash = txHash.replace('0x', '').toUpperCase();
            const baseUrl = 'https://node-palmito.tellorlayer.com';
            
            // Try both endpoints
            const endpoints = [
                `${baseUrl}/rpc/tx?hash=0x${formattedHash}&prove=false`,
                `${baseUrl}/cosmos/tx/v1beta1/txs/${formattedHash}`
            ];
            
            console.log('Polling transaction status from:', endpoints[0]);
            
            // Try the first endpoint
            let response = await fetch(endpoints[0]);
            let data;
            
            if (!response.ok) {
                console.log('First endpoint failed, trying second endpoint...');
                // Try the second endpoint
                response = await fetch(endpoints[1]);
                if (!response.ok) {
                    throw new Error(`Failed to fetch transaction status: ${response.status}`);
                }
            }
            
            data = await response.json();
            console.log('Transaction status:', data);
            
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
                console.log('Transaction successful!');
                console.log('Gas used:', txResult.gas_used);
                console.log('Gas wanted:', txResult.gas_wanted);
                
                // Look for the tokens_withdrawn event
                const events = txResult.events || [];
                const withdrawEvent = events.find(event => event.type === 'tokens_withdrawn');
                if (withdrawEvent) {
                    console.log('Withdrawal details:', {
                        sender: withdrawEvent.attributes.find(attr => attr.key === 'sender')?.value,
                        recipient: withdrawEvent.attributes.find(attr => attr.key === 'recipient_evm_address')?.value,
                        amount: withdrawEvent.attributes.find(attr => attr.key === 'amount')?.value,
                        withdrawId: withdrawEvent.attributes.find(attr => attr.key === 'withdraw_id')?.value
                    });
                }
                
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

    async function withdrawFromLayer(amount, ethereumAddress, account) {
        try {
            console.log('Starting withdrawal process...');
            const amountInMicroUnits = (parseFloat(amount) * 1000000).toString();
            console.log('Withdrawing with params:', {
                amount,
                amountInMicroUnits,
                ethereumAddress,
                account
            });

            const offlineSigner = window.getOfflineSigner('layertest-4');
            console.log('Got offline signer');

            const client = await SigningStargateClient.connectWithSigner(
                'https://node-palmito.tellorlayer.com',
                offlineSigner
            );
            console.log('Connected to signing client');

            // Create a fresh message each time
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
            console.log('Created message:', msg);

            // Show pending popup
            showPendingPopup();
            console.log('Showing pending popup');

            // Sign and broadcast the transaction
            console.log('Attempting to sign and broadcast transaction...');
            const result = await client.signAndBroadcast(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Withdraw TRB to Ethereum'
            );

            console.log('Transaction result:', result);
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

    async function requestAttestations(account, queryId, timestamp) {
        try {
            console.log('Starting attestation request process...');
            console.log('Requesting attestations with params:', {
                account,
                queryId,
                timestamp
            });

            const offlineSigner = window.getOfflineSigner('layertest-4');
            console.log('Got offline signer');

            const client = await SigningStargateClient.connectWithSigner(
                'https://node-palmito.tellorlayer.com',
                offlineSigner
            );
            console.log('Connected to signing client');

            // Create the message
            const msg = {
                typeUrl: '/layer.bridge.MsgRequestAttestations',
                value: {
                    creator: account,
                    query_id: queryId,
                    timestamp: timestamp
                }
            };
            console.log('Created message:', msg);

            // Show pending popup
            showPendingPopup();
            console.log('Showing pending popup');

            // Sign and broadcast the transaction
            console.log('Attempting to sign and broadcast transaction...');
            const result = await client.signAndBroadcast(
                account,
                [msg],
                {
                    amount: [{ denom: 'loya', amount: '5000' }],
                    gas: '200000'
                },
                'Request attestations for withdrawal'
            );

            console.log('Transaction result:', result);
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

    async function getWithdrawReport(queryId) {
        try {
            console.log('Fetching withdraw report for queryId:', queryId);
            const response = await fetch(`https://api.tellor.io/tellor-io/layer/oracle/get_current_aggregate_report/${queryId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch withdraw report: ${response.status}`);
            }

            const data = await response.json();
            console.log('Withdraw report data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching withdraw report:', error);
            throw error;
        }
    }

    // Export to both module and global scope
    exports.SigningStargateClient = SigningStargateClient;
    exports.requestAttestations = requestAttestations;
    exports.getWithdrawReport = getWithdrawReport;

    // Ensure cosmjs object exists
    window.cosmjs = window.cosmjs || {};
    window.cosmjs.stargate = window.cosmjs.stargate || {};

    // Export to both locations
    window.cosmjs.stargate.SigningStargateClient = SigningStargateClient;
    window.cosmjs.stargate.requestAttestations = requestAttestations;
    window.cosmjs.stargate.getWithdrawReport = getWithdrawReport;
    window.cosmjsStargate = {
        SigningStargateClient: SigningStargateClient,
        requestAttestations: requestAttestations,
        getWithdrawReport: getWithdrawReport
    };
}))); 