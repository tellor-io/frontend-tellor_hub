(function(global) {
    var  = protobuf;
    
    var layer = {};
    layer.bridge = {};
    
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
            var writer = .Writer.create();
            if (message.creator != null)
                writer.uint32(10).string(message.creator);
            if (message.recipient != null)
                writer.uint32(18).string(message.recipient);
            if (message.amount != null)
                layer.bridge.Coin.encode(message.amount, writer.uint32(26).fork()).ldelim();
            return writer.finish();
        };
        
        MsgWithdrawTokens.decode = function decode(reader) {
            if (!(reader instanceof .Reader))
                reader = .Reader.create(reader);
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
            var writer = .Writer.create();
            if (message.denom != null)
                writer.uint32(10).string(message.denom);
            if (message.amount != null)
                writer.uint32(18).string(message.amount);
            return writer.finish();
        };
        
        Coin.decode = function decode(reader) {
            if (!(reader instanceof .Reader))
                reader = .Reader.create(reader);
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
    
    // Export to global scope
    global.layer_proto = layer;
})(window);
