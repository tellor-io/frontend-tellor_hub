(function(global) {
    var protobuf = global.protobuf;
    
    // Initialize the global layer proto object if it doesn't exist
    global.layerProto = global.layerProto || {};
    global.layerProto.bridge = global.layerProto.bridge || {};
    
    // Define MsgRequestAttestations
    global.layerProto.bridge.MsgRequestAttestations = (function() {
        function MsgRequestAttestations(p) {
            if (p) {
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null) this[ks[i]] = p[ks[i]];
            }
        }
        
        MsgRequestAttestations.prototype.creator = "";
        MsgRequestAttestations.prototype.query_id = "";
        MsgRequestAttestations.prototype.timestamp = "";
        
        MsgRequestAttestations.create = function create(properties) {
            return new MsgRequestAttestations(properties);
        };
        
        MsgRequestAttestations.encode = function encode(message) {
            var writer = protobuf.Writer.create();
            if (message.creator != null)
                writer.uint32(10).string(message.creator);
            if (message.query_id != null)
                writer.uint32(18).string(message.query_id);
            if (message.timestamp != null)
                writer.uint32(26).string(message.timestamp);
            return writer.finish();
        };
        
        MsgRequestAttestations.decode = function decode(reader) {
            if (!(reader instanceof protobuf.Reader))
                reader = protobuf.Reader.create(reader);
            var message = new MsgRequestAttestations();
            while (reader.pos < reader.len) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.creator = reader.string();
                        break;
                    case 2:
                        message.query_id = reader.string();
                        break;
                    case 3:
                        message.timestamp = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        
        return MsgRequestAttestations;
    })();
    
    layer.bridge.MsgWithdrawTokens = (function() {
        function MsgWithdrawTokens(p) {
            if (p) {
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null) this[ks[i]] = p[ks[i]];
            }
        }
        
        MsgWithdrawTokens.prototype.creator = "";
        MsgWithdrawTokens.prototype.recipient = "";
        MsgWithdrawTokens.prototype.amount = null;
        
        MsgWithdrawTokens.create = function create(properties) {
            return new MsgWithdrawTokens(properties);
        };
        
        MsgWithdrawTokens.encode = function encode(message) {
            var writer = protobuf.Writer.create();
            if (message.creator != null)
                writer.uint32(10).string(message.creator);
            if (message.recipient != null)
                writer.uint32(18).string(message.recipient);
            if (message.amount != null)
                layer.bridge.Coin.encode(message.amount, writer.uint32(26).fork()).ldelim();
            return writer.finish();
        };
        
        MsgWithdrawTokens.decode = function decode(reader) {
            if (!(reader instanceof protobuf.Reader))
                reader = protobuf.Reader.create(reader);
            var message = new MsgWithdrawTokens();
            while (reader.pos < reader.len) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.creator = reader.string();
                        break;
                    case 2:
                        message.recipient = reader.string();
                        break;
                    case 3:
                        message.amount = layer.bridge.Coin.decode(reader);
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        
        return MsgWithdrawTokens;
    })();
    
    layer.bridge.Coin = (function() {
        function Coin(p) {
            if (p) {
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null) this[ks[i]] = p[ks[i]];
            }
        }
        
        Coin.prototype.denom = "";
        Coin.prototype.amount = "";
        
        Coin.create = function create(properties) {
            return new Coin(properties);
        };
        
        Coin.encode = function encode(message) {
            var writer = protobuf.Writer.create();
            if (message.denom != null)
                writer.uint32(10).string(message.denom);
            if (message.amount != null)
                writer.uint32(18).string(message.amount);
            return writer.finish();
        };
        
        Coin.decode = function decode(reader) {
            if (!(reader instanceof protobuf.Reader))
                reader = protobuf.Reader.create(reader);
            var message = new Coin();
            while (reader.pos < reader.len) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.denom = reader.string();
                        break;
                    case 2:
                        message.amount = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        
        return Coin;
    })();
    
    // Ensure the proto types are properly exposed
    if (typeof exports !== 'undefined') {
        exports.layerProto = global.layerProto;
    }
})(window);

// Log initialization for debugging
console.log('Layer proto initialized:', {
    bridge: window.layerProto.bridge,
    MsgRequestAttestations: window.layerProto.bridge.MsgRequestAttestations,
    MsgWithdrawTokens: window.layerProto.bridge.MsgWithdrawTokens
});
