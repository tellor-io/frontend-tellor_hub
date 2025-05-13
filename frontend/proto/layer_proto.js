/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.layer = (function() {

    /**
     * Namespace layer.
     * @exports layer
     * @namespace
     */
    var layer = {};

    layer.bridge = (function() {

        /**
         * Namespace bridge.
         * @memberof layer
         * @namespace
         */
        var bridge = {};

        bridge.MsgWithdrawTokens = (function() {

            /**
             * Properties of a MsgWithdrawTokens.
             * @memberof layer.bridge
             * @interface IMsgWithdrawTokens
             * @property {string|null} [creator] MsgWithdrawTokens creator
             * @property {string|null} [recipient] MsgWithdrawTokens recipient
             * @property {layer.bridge.ICoin|null} [amount] MsgWithdrawTokens amount
             */

            /**
             * Constructs a new MsgWithdrawTokens.
             * @memberof layer.bridge
             * @classdesc Represents a MsgWithdrawTokens.
             * @implements IMsgWithdrawTokens
             * @constructor
             * @param {layer.bridge.IMsgWithdrawTokens=} [properties] Properties to set
             */
            function MsgWithdrawTokens(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MsgWithdrawTokens creator.
             * @member {string} creator
             * @memberof layer.bridge.MsgWithdrawTokens
             * @instance
             */
            MsgWithdrawTokens.prototype.creator = "";

            /**
             * MsgWithdrawTokens recipient.
             * @member {string} recipient
             * @memberof layer.bridge.MsgWithdrawTokens
             * @instance
             */
            MsgWithdrawTokens.prototype.recipient = "";

            /**
             * MsgWithdrawTokens amount.
             * @member {layer.bridge.ICoin|null|undefined} amount
             * @memberof layer.bridge.MsgWithdrawTokens
             * @instance
             */
            MsgWithdrawTokens.prototype.amount = null;

            /**
             * Creates a new MsgWithdrawTokens instance using the specified properties.
             * @function create
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {layer.bridge.IMsgWithdrawTokens=} [properties] Properties to set
             * @returns {layer.bridge.MsgWithdrawTokens} MsgWithdrawTokens instance
             */
            MsgWithdrawTokens.create = function create(properties) {
                return new MsgWithdrawTokens(properties);
            };

            /**
             * Encodes the specified MsgWithdrawTokens message. Does not implicitly {@link layer.bridge.MsgWithdrawTokens.verify|verify} messages.
             * @function encode
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {layer.bridge.IMsgWithdrawTokens} message MsgWithdrawTokens message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MsgWithdrawTokens.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.creator != null && Object.hasOwnProperty.call(message, "creator"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.creator);
                if (message.recipient != null && Object.hasOwnProperty.call(message, "recipient"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.recipient);
                if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                    $root.layer.bridge.Coin.encode(message.amount, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified MsgWithdrawTokens message, length delimited. Does not implicitly {@link layer.bridge.MsgWithdrawTokens.verify|verify} messages.
             * @function encodeDelimited
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {layer.bridge.IMsgWithdrawTokens} message MsgWithdrawTokens message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MsgWithdrawTokens.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MsgWithdrawTokens message from the specified reader or buffer.
             * @function decode
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {layer.bridge.MsgWithdrawTokens} MsgWithdrawTokens
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MsgWithdrawTokens.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.layer.bridge.MsgWithdrawTokens();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.creator = reader.string();
                            break;
                        }
                    case 2: {
                            message.recipient = reader.string();
                            break;
                        }
                    case 3: {
                            message.amount = $root.layer.bridge.Coin.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MsgWithdrawTokens message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {layer.bridge.MsgWithdrawTokens} MsgWithdrawTokens
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MsgWithdrawTokens.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MsgWithdrawTokens message.
             * @function verify
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MsgWithdrawTokens.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.creator != null && message.hasOwnProperty("creator"))
                    if (!$util.isString(message.creator))
                        return "creator: string expected";
                if (message.recipient != null && message.hasOwnProperty("recipient"))
                    if (!$util.isString(message.recipient))
                        return "recipient: string expected";
                if (message.amount != null && message.hasOwnProperty("amount")) {
                    var error = $root.layer.bridge.Coin.verify(message.amount);
                    if (error)
                        return "amount." + error;
                }
                return null;
            };

            /**
             * Creates a MsgWithdrawTokens message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {layer.bridge.MsgWithdrawTokens} MsgWithdrawTokens
             */
            MsgWithdrawTokens.fromObject = function fromObject(object) {
                if (object instanceof $root.layer.bridge.MsgWithdrawTokens)
                    return object;
                var message = new $root.layer.bridge.MsgWithdrawTokens();
                if (object.creator != null)
                    message.creator = String(object.creator);
                if (object.recipient != null)
                    message.recipient = String(object.recipient);
                if (object.amount != null) {
                    if (typeof object.amount !== "object")
                        throw TypeError(".layer.bridge.MsgWithdrawTokens.amount: object expected");
                    message.amount = $root.layer.bridge.Coin.fromObject(object.amount);
                }
                return message;
            };

            /**
             * Creates a plain object from a MsgWithdrawTokens message. Also converts values to other types if specified.
             * @function toObject
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {layer.bridge.MsgWithdrawTokens} message MsgWithdrawTokens
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MsgWithdrawTokens.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.creator = "";
                    object.recipient = "";
                    object.amount = null;
                }
                if (message.creator != null && message.hasOwnProperty("creator"))
                    object.creator = message.creator;
                if (message.recipient != null && message.hasOwnProperty("recipient"))
                    object.recipient = message.recipient;
                if (message.amount != null && message.hasOwnProperty("amount"))
                    object.amount = $root.layer.bridge.Coin.toObject(message.amount, options);
                return object;
            };

            /**
             * Converts this MsgWithdrawTokens to JSON.
             * @function toJSON
             * @memberof layer.bridge.MsgWithdrawTokens
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MsgWithdrawTokens.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MsgWithdrawTokens
             * @function getTypeUrl
             * @memberof layer.bridge.MsgWithdrawTokens
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MsgWithdrawTokens.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/layer.bridge.MsgWithdrawTokens";
            };

            return MsgWithdrawTokens;
        })();

        bridge.Coin = (function() {

            /**
             * Properties of a Coin.
             * @memberof layer.bridge
             * @interface ICoin
             * @property {string|null} [denom] Coin denom
             * @property {string|null} [amount] Coin amount
             */

            /**
             * Constructs a new Coin.
             * @memberof layer.bridge
             * @classdesc Represents a Coin.
             * @implements ICoin
             * @constructor
             * @param {layer.bridge.ICoin=} [properties] Properties to set
             */
            function Coin(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Coin denom.
             * @member {string} denom
             * @memberof layer.bridge.Coin
             * @instance
             */
            Coin.prototype.denom = "";

            /**
             * Coin amount.
             * @member {string} amount
             * @memberof layer.bridge.Coin
             * @instance
             */
            Coin.prototype.amount = "";

            /**
             * Creates a new Coin instance using the specified properties.
             * @function create
             * @memberof layer.bridge.Coin
             * @static
             * @param {layer.bridge.ICoin=} [properties] Properties to set
             * @returns {layer.bridge.Coin} Coin instance
             */
            Coin.create = function create(properties) {
                return new Coin(properties);
            };

            /**
             * Encodes the specified Coin message. Does not implicitly {@link layer.bridge.Coin.verify|verify} messages.
             * @function encode
             * @memberof layer.bridge.Coin
             * @static
             * @param {layer.bridge.ICoin} message Coin message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Coin.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.denom != null && Object.hasOwnProperty.call(message, "denom"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.denom);
                if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.amount);
                return writer;
            };

            /**
             * Encodes the specified Coin message, length delimited. Does not implicitly {@link layer.bridge.Coin.verify|verify} messages.
             * @function encodeDelimited
             * @memberof layer.bridge.Coin
             * @static
             * @param {layer.bridge.ICoin} message Coin message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Coin.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Coin message from the specified reader or buffer.
             * @function decode
             * @memberof layer.bridge.Coin
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {layer.bridge.Coin} Coin
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Coin.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.layer.bridge.Coin();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.denom = reader.string();
                            break;
                        }
                    case 2: {
                            message.amount = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Coin message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof layer.bridge.Coin
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {layer.bridge.Coin} Coin
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Coin.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Coin message.
             * @function verify
             * @memberof layer.bridge.Coin
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Coin.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.denom != null && message.hasOwnProperty("denom"))
                    if (!$util.isString(message.denom))
                        return "denom: string expected";
                if (message.amount != null && message.hasOwnProperty("amount"))
                    if (!$util.isString(message.amount))
                        return "amount: string expected";
                return null;
            };

            /**
             * Creates a Coin message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof layer.bridge.Coin
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {layer.bridge.Coin} Coin
             */
            Coin.fromObject = function fromObject(object) {
                if (object instanceof $root.layer.bridge.Coin)
                    return object;
                var message = new $root.layer.bridge.Coin();
                if (object.denom != null)
                    message.denom = String(object.denom);
                if (object.amount != null)
                    message.amount = String(object.amount);
                return message;
            };

            /**
             * Creates a plain object from a Coin message. Also converts values to other types if specified.
             * @function toObject
             * @memberof layer.bridge.Coin
             * @static
             * @param {layer.bridge.Coin} message Coin
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Coin.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.denom = "";
                    object.amount = "";
                }
                if (message.denom != null && message.hasOwnProperty("denom"))
                    object.denom = message.denom;
                if (message.amount != null && message.hasOwnProperty("amount"))
                    object.amount = message.amount;
                return object;
            };

            /**
             * Converts this Coin to JSON.
             * @function toJSON
             * @memberof layer.bridge.Coin
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Coin.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Coin
             * @function getTypeUrl
             * @memberof layer.bridge.Coin
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Coin.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/layer.bridge.Coin";
            };

            return Coin;
        })();

        return bridge;
    })();

    return layer;
})();

module.exports = $root;
