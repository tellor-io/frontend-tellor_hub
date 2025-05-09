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
                return window.layerProto.encodeMessage({
                    creator: message.creator,
                    recipient: message.recipient,
                    amount: {
                        denom: message.amount.denom,
                        amount: message.amount.amount
                    }
                });
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

        async signAndBroadcast(signerAddress, messages, fee, memo) {
            try {
                console.log('Starting signAndBroadcast...');
                
                // Get the account info using the signer
                const accounts = await this.signer.getAccounts();
                const account = accounts.find(acc => acc.address === signerAddress);
                
                if (!account) {
                    throw new Error('Account not found in signer');
                }
                console.log('Found account:', account);

                // Get the account details from the chain - using the correct URL
                const accountUrl = `${this.rpcUrl}/cosmos/auth/v1beta1/accounts/${signerAddress}`;
                console.log('Fetching account from:', accountUrl);
                const accountResponse = await fetch(accountUrl);
                
                if (!accountResponse.ok) {
                    if (accountResponse.status === 404) {
                        // If account is new, use default values
                        console.log('Account not found on chain, using default values for new account');
                        const tx = {
                            chain_id: 'layertest-4',
                            account_number: "0",
                            sequence: "0",
                            fee: fee,
                            msgs: messages,
                            memo: memo
                        };
                        return await this.broadcastTransaction(tx, signerAddress);
                    }
                    throw new Error(`Failed to fetch account: ${accountResponse.status}`);
                }
                
                const accountData = await accountResponse.json();
                console.log('Account data:', accountData);

                // Extract account number and sequence
                let accountNumber, sequence;
                if (accountData.account) {
                    accountNumber = accountData.account.account_number;
                    sequence = accountData.account.sequence;
                } else {
                    // If account is new, use 0 for both
                    accountNumber = "0";
                    sequence = "0";
                }

                // Create the transaction
                const tx = {
                    chain_id: 'layertest-4',
                    account_number: accountNumber,
                    sequence: sequence,
                    fee: fee,
                    msgs: messages,
                    memo: memo
                };
                return await this.broadcastTransaction(tx, signerAddress);
            } catch (error) {
                console.error('Error in signAndBroadcast:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                throw new Error(`Transaction failed: ${error.message}`);
            }
        }

        // Helper method to handle transaction broadcasting
        async broadcastTransaction(tx, signerAddress) {
            console.log('Creating transaction with:', {
                signerAddress,
                messages: tx.msgs,
                fee: tx.fee,
                memo: tx.memo,
                accountNumber: tx.account_number,
                sequence: tx.sequence
            });

            // Create the transaction to sign with proper structure
            const txToSign = {
                chain_id: 'layertest-4',
                account_number: tx.account_number,
                sequence: tx.sequence,
                fee: {
                    amount: tx.fee.amount,
                    gas: tx.fee.gas
                },
                msgs: tx.msgs.map(msg => ({
                    type: msg.typeUrl,
                    value: msg.value
                })),
                memo: tx.memo
            };

            // Sign the transaction
            console.log('Signing transaction:', txToSign);
            console.log('Requesting signature from Keplr...');
            const signResult = await this.signer.signAmino(signerAddress, txToSign);
            console.log('Sign result:', signResult);

            // Create the transaction body with encoded messages
            const txBody = {
                messages: tx.msgs.map(msg => {
                    // Get the message type from registry
                    const messageType = this.registry.get(msg.typeUrl);
                    if (!messageType) {
                        throw new Error(`Unknown message type: ${msg.typeUrl}`);
                    }

                    // Encode the message using the registry
                    const encodedValue = messageType.encode(msg.value);
                    console.log('Encoded message:', {
                        typeUrl: msg.typeUrl,
                        value: encodedValue
                    });

                    return {
                        typeUrl: msg.typeUrl,
                        value: encodedValue
                    };
                }),
                memo: tx.memo,
                timeoutHeight: "0",
                extensionOptions: [],
                nonCriticalExtensionOptions: []
            };

            // Create the auth info
            const authInfo = {
                signerInfos: [{
                    publicKey: {
                        typeUrl: "/cosmos.crypto.secp256k1.PubKey",
                        value: window.layerProto.encodeMessage({
                            key: signResult.signature.pub_key.value
                        })
                    },
                    modeInfo: {
                        single: {
                            mode: "SIGN_MODE_LEGACY_AMINO_JSON"
                        }
                    },
                    sequence: tx.sequence
                }],
                fee: {
                    amount: tx.fee.amount,
                    gasLimit: tx.fee.gas,
                    payer: "",
                    granter: ""
                }
            };

            // Encode the entire transaction
            const encodedTx = window.layerProto.encodeMessage({
                body: txBody,
                authInfo: authInfo,
                signatures: [signResult.signature.signature]
            });

            // Convert to base64
            const txBytesBase64 = btoa(String.fromCharCode.apply(null, encodedTx));

            const broadcastTx = {
                tx_bytes: txBytesBase64,
                mode: "BROADCAST_MODE_SYNC"
            };

            // Broadcast the transaction using REST API
            const broadcastResponse = await fetch(`${this.rpcUrl}/cosmos/tx/v1beta1/txs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(broadcastTx)
            });

            if (!broadcastResponse.ok) {
                const errorText = await broadcastResponse.text();
                console.error('Broadcast error:', errorText);
                throw new Error(`Failed to broadcast transaction: ${broadcastResponse.status}`);
            }

            const result = await broadcastResponse.json();
            console.log('Broadcast result:', result);

            if (result.error) {
                throw new Error(result.error.message || 'Transaction failed');
            }

            const txHash = result.tx_response?.txhash;
            if (!txHash) {
                throw new Error('No transaction hash returned');
            }

            console.log('Transaction hash:', txHash);

            return {
                code: 0,
                height: 0,
                txhash: txHash,
                rawLog: ''
            };
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
}))); 