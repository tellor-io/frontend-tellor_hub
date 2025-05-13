import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace layer. */
export namespace layer {

    /** Namespace bridge. */
    namespace bridge {

        /** Properties of a MsgWithdrawTokens. */
        interface IMsgWithdrawTokens {

            /** MsgWithdrawTokens creator */
            creator?: (string|null);

            /** MsgWithdrawTokens recipient */
            recipient?: (string|null);

            /** MsgWithdrawTokens amount */
            amount?: (layer.bridge.ICoin|null);
        }

        /** Represents a MsgWithdrawTokens. */
        class MsgWithdrawTokens implements IMsgWithdrawTokens {

            /**
             * Constructs a new MsgWithdrawTokens.
             * @param [properties] Properties to set
             */
            constructor(properties?: layer.bridge.IMsgWithdrawTokens);

            /** MsgWithdrawTokens creator. */
            public creator: string;

            /** MsgWithdrawTokens recipient. */
            public recipient: string;

            /** MsgWithdrawTokens amount. */
            public amount?: (layer.bridge.ICoin|null);

            /**
             * Creates a new MsgWithdrawTokens instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MsgWithdrawTokens instance
             */
            public static create(properties?: layer.bridge.IMsgWithdrawTokens): layer.bridge.MsgWithdrawTokens;

            /**
             * Encodes the specified MsgWithdrawTokens message. Does not implicitly {@link layer.bridge.MsgWithdrawTokens.verify|verify} messages.
             * @param message MsgWithdrawTokens message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: layer.bridge.IMsgWithdrawTokens, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgWithdrawTokens message, length delimited. Does not implicitly {@link layer.bridge.MsgWithdrawTokens.verify|verify} messages.
             * @param message MsgWithdrawTokens message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: layer.bridge.IMsgWithdrawTokens, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgWithdrawTokens message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgWithdrawTokens
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): layer.bridge.MsgWithdrawTokens;

            /**
             * Decodes a MsgWithdrawTokens message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgWithdrawTokens
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): layer.bridge.MsgWithdrawTokens;

            /**
             * Verifies a MsgWithdrawTokens message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgWithdrawTokens message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgWithdrawTokens
             */
            public static fromObject(object: { [k: string]: any }): layer.bridge.MsgWithdrawTokens;

            /**
             * Creates a plain object from a MsgWithdrawTokens message. Also converts values to other types if specified.
             * @param message MsgWithdrawTokens
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: layer.bridge.MsgWithdrawTokens, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgWithdrawTokens to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MsgWithdrawTokens
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Coin. */
        interface ICoin {

            /** Coin denom */
            denom?: (string|null);

            /** Coin amount */
            amount?: (string|null);
        }

        /** Represents a Coin. */
        class Coin implements ICoin {

            /**
             * Constructs a new Coin.
             * @param [properties] Properties to set
             */
            constructor(properties?: layer.bridge.ICoin);

            /** Coin denom. */
            public denom: string;

            /** Coin amount. */
            public amount: string;

            /**
             * Creates a new Coin instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Coin instance
             */
            public static create(properties?: layer.bridge.ICoin): layer.bridge.Coin;

            /**
             * Encodes the specified Coin message. Does not implicitly {@link layer.bridge.Coin.verify|verify} messages.
             * @param message Coin message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: layer.bridge.ICoin, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Coin message, length delimited. Does not implicitly {@link layer.bridge.Coin.verify|verify} messages.
             * @param message Coin message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: layer.bridge.ICoin, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Coin message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Coin
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): layer.bridge.Coin;

            /**
             * Decodes a Coin message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Coin
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): layer.bridge.Coin;

            /**
             * Verifies a Coin message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Coin message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Coin
             */
            public static fromObject(object: { [k: string]: any }): layer.bridge.Coin;

            /**
             * Creates a plain object from a Coin message. Also converts values to other types if specified.
             * @param message Coin
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: layer.bridge.Coin, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Coin to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Coin
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
