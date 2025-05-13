// Protobuf definitions for Layer Bridge messages
window.layerProto = {
    // Message type URLs
    MSG_WITHDRAW_TOKENS_TYPE: "/layer.bridge.MsgWithdrawTokens",
    
    // Helper function to create a MsgWithdrawTokens message
    createMsgWithdrawTokens: (creator, recipient, amount) => {
        return {
            typeUrl: window.layerProto.MSG_WITHDRAW_TOKENS_TYPE,
            value: {
                creator: creator,
                recipient: recipient.toLowerCase(),
                amount: amount
            }
        };
    },

    // Helper function to encode a message to protobuf format
    encodeMessage: (message) => {
        // Check if proto code is loaded
        if (!window.protobuf) {
            throw new Error('Protobuf.js library not loaded. Please ensure protobuf.min.js is loaded before using this function.');
        }

        // Create the message types
        const root = new protobuf.Root();
        
        // Define the Coin type
        const Coin = new protobuf.Type("Coin")
            .add(new protobuf.Field("denom", 1, "string"))
            .add(new protobuf.Field("amount", 2, "string"));
        
        // Define the MsgWithdrawTokens type
        const MsgWithdrawTokens = new protobuf.Type("MsgWithdrawTokens")
            .add(new protobuf.Field("creator", 1, "string"))
            .add(new protobuf.Field("recipient", 2, "string"))
            .add(new protobuf.Field("amount", 3, "Coin"));

        // Add types to root
        root.add(Coin);
        root.add(MsgWithdrawTokens);

        // Get the message type
        const MsgType = root.lookupType("MsgWithdrawTokens");

        // Ensure message has the correct structure
        const msgData = {
            creator: message.creator || "",
            recipient: message.recipient || "",
            amount: {
                denom: message.amount?.denom || "",
                amount: (message.amount?.amount || "0").toString()
            }
        };

        console.log('Encoding message:', msgData);

        // Verify the message
        const errMsg = MsgType.verify(msgData);
        if (errMsg) {
            throw Error(errMsg);
        }

        // Create the message
        const msg = MsgType.create(msgData);

        // Encode the message
        return MsgType.encode(msg).finish();
    },

    // Helper function to decode a protobuf message
    decodeMessage: (bytes) => {
        // Check if proto code is loaded
        if (!window.protobuf) {
            throw new Error('Protobuf.js library not loaded. Please ensure protobuf.min.js is loaded before using this function.');
        }

        // Create the message types
        const root = new protobuf.Root();
        
        // Define the Coin type
        const Coin = new protobuf.Type("Coin")
            .add(new protobuf.Field("denom", 1, "string"))
            .add(new protobuf.Field("amount", 2, "string"));
        
        // Define the MsgWithdrawTokens type
        const MsgWithdrawTokens = new protobuf.Type("MsgWithdrawTokens")
            .add(new protobuf.Field("creator", 1, "string"))
            .add(new protobuf.Field("recipient", 2, "string"))
            .add(new protobuf.Field("amount", 3, "Coin"));

        // Add types to root
        root.add(Coin);
        root.add(MsgWithdrawTokens);

        // Get the message type
        const MsgType = root.lookupType("MsgWithdrawTokens");

        // Decode the message
        return MsgType.decode(bytes);
    },

    // Helper function to create a signed transaction
    createSignedTx: (msg, fee, memo, signature, pubKey) => {
        return {
            body: {
                messages: [msg],
                memo: memo
            },
            auth_info: {
                signer_infos: [{
                    public_key: {
                        type_url: "/cosmos.crypto.secp256k1.PubKey",
                        value: pubKey
                    },
                    mode_info: {
                        single: {
                            mode: "SIGN_MODE_LEGACY_AMINO_JSON"
                        }
                    }
                }],
                fee: fee
            },
            signatures: [signature]
        };
    },

    // Helper function to decode balance response
    decodeBalanceResponse: function(base64Response) {
        try {
            // Check if proto code is loaded
            if (!window.protobuf) {
                throw new Error('Protobuf.js library not loaded. Please ensure protobuf.min.js is loaded before using this function.');
            }

            console.log('Decoding balance response:', base64Response);
            const binaryData = atob(base64Response);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
            }
            
            console.log('Binary data:', bytes);
            
            // Create the Coin message type
            const Coin = {
                fields: {
                    denom: {
                        type: "string",
                        id: 1
                    },
                    amount: {
                        type: "string",
                        id: 2
                    }
                }
            };

            // Create a root namespace
            const root = protobuf.Root.fromJSON({
                nested: {
                    layer: {
                        nested: {
                            bridge: {
                                nested: {
                                    Coin: Coin
                                }
                            }
                        }
                    }
                }
            });

            // Get the message type
            const CoinType = root.lookupType("layer.bridge.Coin");

            // Decode the message
            const balance = CoinType.decode(bytes);
            
            return {
                balance: {
                    amount: balance.amount,
                    denom: balance.denom
                }
            };
        } catch (error) {
            console.error('Error decoding balance response:', error);
            return null;
        }
    }
};

// Remove the test code below
// const { MsgWithdrawTokens } = window.layer_proto.layer.bridge;
// 
// // Create a message
// const msg = MsgWithdrawTokens.create({
//     creator: "your_address",
//     recipient: "recipient_address",
//     amount: {
//         denom: "loya",
//         amount: "1000000"
//     }
// });
// 
// // Encode the message
// const encoded = MsgWithdrawTokens.encode(msg).finish(); 