// Protobuf definitions for Layer Bridge messages
window.layerProto = {
    // Message type URLs
    MSG_WITHDRAW_TOKENS_TYPE: "/layer.bridge.MsgWithdrawTokens",
    MSG_REQUEST_ATTESTATIONS_TYPE: "/layer.bridge.MsgRequestAttestations",
    MSG_NO_STAKE_REPORT_TYPE: "/layer.oracle.MsgNoStakeReport",
    MSG_PROPOSE_DISPUTE_TYPE: "/layer.dispute.MsgProposeDispute",
    MSG_VOTE_TYPE: "/layer.dispute.MsgVote",
    MSG_ADD_FEE_TO_DISPUTE_TYPE: "/layer.dispute.MsgAddFeeToDispute",
    
    // Initialize proto types
    bridge: {
        // Define the Coin type
        Coin: {
            create: (data) => ({
                denom: data.denom || "",
                amount: (data.amount || "0").toString()
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.denom) writer.uint32(10).string(message.denom);
                if (message.amount) writer.uint32(18).string(message.amount);
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.denom = reader.readString(); break;
                        case 2: message.amount = reader.readString(); break;
                        default: reader.skipField();
                    }
                }
                return message;
            }
        },

        // Define the MsgWithdrawTokens type
        MsgWithdrawTokens: {
            create: (data) => ({
                creator: data.creator || "",
                recipient: (data.recipient || "").toLowerCase(),
                amount: data.amount || { denom: "", amount: "0" }
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.creator) writer.uint32(10).string(message.creator);
                if (message.recipient) writer.uint32(18).string(message.recipient);
                if (message.amount) {
                    writer.uint32(26).fork();
                    window.layerProto.bridge.Coin.encode(message.amount);
                    writer.ldelim();
                }
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.creator = reader.readString(); break;
                        case 2: message.recipient = reader.readString(); break;
                        case 3: message.amount = window.layerProto.bridge.Coin.decode(reader); break;
                        default: reader.skipField();
                    }
                }
                return message;
            }
        },

        // Define the MsgRequestAttestations type
        MsgRequestAttestations: {
            create: (data) => ({
                creator: data.creator || "",
                query_id: data.query_id || "",
                timestamp: (data.timestamp || "0").toString()
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.creator) writer.uint32(10).string(message.creator);
                if (message.query_id) writer.uint32(18).string(message.query_id);
                if (message.timestamp) writer.uint32(26).string(message.timestamp);
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.creator = reader.readString(); break;
                        case 2: message.query_id = reader.readString(); break;
                        case 3: message.timestamp = reader.readString(); break;
                        default: reader.skipField();
                    }
                }
                return message;
            }
        },

        // Define the MsgNoStakeReport type
        MsgNoStakeReport: {
            create: (data) => ({
                creator: data.creator || "",
                query_data: data.query_data || new Uint8Array(0),
                value: data.value || ""
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.creator) writer.uint32(10).string(message.creator);
                if (message.query_data) writer.uint32(18).bytes(message.query_data);
                if (message.value) writer.uint32(26).string(message.value);
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.creator = reader.readString(); break;
                        case 2: message.query_data = reader.readBytes(); break;
                        case 3: message.value = reader.readString(); break;
                        default: reader.skipField();
                    }
                }
                return message;
            }
        },

        // Define the MsgProposeDispute type
        MsgProposeDispute: {
            create: (data) => ({
                creator: data.creator || "",
                disputedReporter: data.disputedReporter || "",
                reportMetaId: data.reportMetaId || 0,
                reportQueryId: data.reportQueryId || "",
                disputeCategory: data.disputeCategory || 0,
                fee: data.fee || { denom: "", amount: "0" },
                payFromBond: data.payFromBond || false
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.creator) writer.uint32(10).string(message.creator);
                if (message.disputedReporter) writer.uint32(18).string(message.disputedReporter);
                if (message.reportMetaId) writer.uint32(26).uint64(message.reportMetaId);
                if (message.reportQueryId) writer.uint32(34).string(message.reportQueryId);
                if (message.disputeCategory !== undefined) writer.uint32(42).uint32(message.disputeCategory);
                if (message.fee) {
                    writer.uint32(50).fork();
                    window.layerProto.bridge.Coin.encode(message.fee);
                    writer.ldelim();
                }
                if (message.payFromBond !== undefined) writer.uint32(56).bool(message.payFromBond);
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.creator = reader.readString(); break;
                        case 2: message.disputedReporter = reader.readString(); break;
                        case 3: message.reportMetaId = reader.readUint64(); break;
                        case 4: message.reportQueryId = reader.readString(); break;
                        case 5: message.disputeCategory = reader.readUint32(); break;
                        case 6: message.fee = window.layerProto.bridge.Coin.decode(reader); break;
                        case 7: message.payFromBond = reader.readBool(); break;
                        default: reader.skipField();
                    }
                }
                return message;
            }
        },

        // Define the MsgVote type
        MsgVote: {
            create: (data) => ({
                voter: data.voter || "",
                id: data.id || 0,
                vote: data.vote || 0  // Changed from string to number for enum
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.voter) writer.uint32(10).string(message.voter);
                if (message.id) writer.uint32(16).uint64(message.id);
                if (message.vote !== undefined) writer.uint32(26).uint32(message.vote);  // Changed from string to uint32
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.voter = reader.readString(); break;
                        case 2: message.id = reader.readUint64(); break;
                        case 3: message.vote = reader.readUint32(); break;  // Changed from readString to readUint32
                        default: reader.skipField();
                    }
                }
                return message;
            }
        },

        // Define the MsgAddFeeToDispute type
        MsgAddFeeToDispute: {
            create: (data) => ({
                creator: data.creator || "",
                disputeId: data.disputeId || 0,
                amount: data.amount || { denom: "", amount: "0" },
                payFromBond: data.payFromBond || false
            }),
            encode: (message) => {
                const writer = protobuf.Writer.create();
                if (message.creator) writer.uint32(10).string(message.creator);
                if (message.disputeId) writer.uint32(16).uint64(message.disputeId);
                if (message.amount) {
                    writer.uint32(26).fork();
                    window.layerProto.bridge.Coin.encode(message.amount);
                    writer.ldelim();
                }
                if (message.payFromBond !== undefined) writer.uint32(32).bool(message.payFromBond);
                return writer.finish();
            },
            decode: (reader) => {
                const message = {};
                while (reader.nextField()) {
                    if (reader.isEndGroup) break;
                    switch (reader.getFieldNumber()) {
                        case 1: message.creator = reader.readString(); break;
                        case 2: message.disputeId = reader.readUint64(); break;
                        case 3: message.amount = window.layerProto.bridge.Coin.decode(reader); break;
                        case 4: message.payFromBond = reader.readBool(); break;
                        default: reader.skipField();
                    }
                }
                return message;
            }
        }
    },

    // Helper function to create a MsgWithdrawTokens message
    createMsgWithdrawTokens: (creator, recipient, amount) => {
        return {
            typeUrl: window.layerProto.MSG_WITHDRAW_TOKENS_TYPE,
            value: window.layerProto.bridge.MsgWithdrawTokens.create({
                creator,
                recipient,
                amount
            })
        };
    },

    // Helper function to create a MsgRequestAttestations message
    createMsgRequestAttestations: (creator, queryId, timestamp) => {
        return {
            typeUrl: window.layerProto.MSG_REQUEST_ATTESTATIONS_TYPE,
            value: window.layerProto.bridge.MsgRequestAttestations.create({
                creator,
                query_id: queryId,
                timestamp
            })
        };
    },

    // Helper function to create a MsgNoStakeReport message
    createMsgNoStakeReport: (creator, queryData, value) => {
        return {
            typeUrl: window.layerProto.MSG_NO_STAKE_REPORT_TYPE,
            value: window.layerProto.bridge.MsgNoStakeReport.create({
                creator,
                query_data: queryData,
                value
            })
        };
    },

    // Helper function to create a MsgProposeDispute message
    createMsgProposeDispute: (creator, disputedReporter, reportMetaId, reportQueryId, disputeCategory, fee, payFromBond) => {
        return {
            typeUrl: window.layerProto.MSG_PROPOSE_DISPUTE_TYPE,
            value: window.layerProto.bridge.MsgProposeDispute.create({
                creator,
                disputedReporter,
                reportMetaId,
                reportQueryId,
                disputeCategory,
                fee,
                payFromBond
            })
        };
    },

    // Helper function to create a MsgAddFeeToDispute message
    createMsgAddFeeToDispute: (creator, disputeId, amount, payFromBond) => {
        return {
            typeUrl: window.layerProto.MSG_ADD_FEE_TO_DISPUTE_TYPE,
            value: window.layerProto.bridge.MsgAddFeeToDispute.create({
                creator,
                disputeId,
                amount,
                payFromBond
            })
        };
    },

    // Helper function to create a MsgVote message
    createMsgVote: (voter, id, vote) => {
        // Convert string vote choice to enum value
        const voteEnum = window.layerProto.convertVoteChoiceToEnum(vote);
        
        return {
            typeUrl: window.layerProto.MSG_VOTE_TYPE,
            value: window.layerProto.bridge.MsgVote.create({
                voter,
                id,
                vote: voteEnum
            })
        };
    },

    // Helper function to convert vote choice string to enum value
    convertVoteChoiceToEnum: (voteChoice) => {
        switch (voteChoice) {
            case 'vote-support':
                return 1;  // Support
            case 'vote-against':
                return 2;  // Against
            case 'vote-invalid':
                return 3;  // Invalid
            default:
                throw new Error(`Invalid vote choice: ${voteChoice}. Must be vote-support, vote-against, or vote-invalid.`);
        }
    },

    // Helper function to encode a message to protobuf format
    encodeMessage: (message) => {
        // Check if proto code is loaded
        if (!window.protobuf) {
            throw new Error('Protobuf.js library not loaded. Please ensure protobuf.min.js is loaded before using this function.');
        }

        // Get the appropriate message type based on typeUrl
        let encoder;
        if (message.typeUrl === window.layerProto.MSG_WITHDRAW_TOKENS_TYPE) {
            encoder = window.layerProto.bridge.MsgWithdrawTokens;
        } else if (message.typeUrl === window.layerProto.MSG_REQUEST_ATTESTATIONS_TYPE) {
            encoder = window.layerProto.bridge.MsgRequestAttestations;
        } else if (message.typeUrl === window.layerProto.MSG_NO_STAKE_REPORT_TYPE) {
            encoder = window.layerProto.bridge.MsgNoStakeReport;
        } else if (message.typeUrl === window.layerProto.MSG_PROPOSE_DISPUTE_TYPE) {
            encoder = window.layerProto.bridge.MsgProposeDispute;
        } else if (message.typeUrl === window.layerProto.MSG_VOTE_TYPE) {
            encoder = window.layerProto.bridge.MsgVote;
        } else {
            throw new Error(`Unknown message type: ${message.typeUrl}`);
        }

        // Encode the message using the appropriate encoder
        return encoder.encode(message.value);
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