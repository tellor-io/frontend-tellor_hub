// Protobuf definitions for Layer Bridge messages
window.layerProto = {
    // Message type URLs
    MSG_WITHDRAW_TOKENS_TYPE: "/layer.bridge.MsgWithdrawTokens",
    
    // Helper function to create a MsgWithdrawTokens message
    createMsgWithdrawTokens: (creator, recipient, amount, denom) => {
        return {
            typeUrl: window.layerProto.MSG_WITHDRAW_TOKENS_TYPE,
            value: {
                creator: creator,
                recipient: recipient,
                amount: {
                    amount: amount.toString(),
                    denom: denom
                }
            }
        };
    },

    // Helper function to encode a message to protobuf format
    encodeMessage: (message) => {
        // Convert the message to a Uint8Array
        const jsonStr = JSON.stringify(message);
        const encoder = new TextEncoder();
        return encoder.encode(jsonStr);
    },

    // Helper function to decode a protobuf message
    decodeMessage: (bytes) => {
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(bytes);
        return JSON.parse(jsonStr);
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
            console.log('Decoding balance response:', base64Response);
            const binaryData = atob(base64Response);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
            }
            
            console.log('Binary data:', bytes);
            
            // Parse the protobuf message
            const response = {
                balance: {
                    amount: "0",
                    denom: ""
                }
            };

            // Simple protobuf parsing for balance response
            // Format: [1, length, bytes...] for amount
            //        [2, length, bytes...] for denom
            let i = 0;
            while (i < bytes.length) {
                const fieldNumber = bytes[i] >> 3;
                const wireType = bytes[i] & 0x7;
                i++;

                if (wireType === 2) { // Length-delimited
                    const length = bytes[i];
                    i++;
                    const value = new TextDecoder().decode(bytes.slice(i, i + length));
                    i += length;

                    if (fieldNumber === 1) { // amount
                        response.balance.amount = value;
                    } else if (fieldNumber === 2) { // denom
                        response.balance.denom = value;
                    }
                }
            }

            console.log('Decoded response:', response);
            return response;
        } catch (error) {
            console.error('Error decoding balance response:', error);
            return null;
        }
    }
}; 