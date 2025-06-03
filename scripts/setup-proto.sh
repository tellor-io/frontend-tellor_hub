#!/bin/bash

# Create proto directories
mkdir -p frontend/proto/cosmos/base/v1beta1
mkdir -p frontend/proto/cosmos/msg/v1
mkdir -p frontend/proto/gogoproto
mkdir -p frontend/proto/cosmos_proto

# Download required proto files
curl -o frontend/proto/cosmos/base/v1beta1/coin.proto https://raw.githubusercontent.com/cosmos/cosmos-sdk/v0.46.0/proto/cosmos/base/v1beta1/coin.proto
curl -o frontend/proto/cosmos/msg/v1/msg.proto https://raw.githubusercontent.com/cosmos/cosmos-sdk/v0.46.0/proto/cosmos/msg/v1/msg.proto
curl -o frontend/proto/gogoproto/gogo.proto https://raw.githubusercontent.com/cosmos/gogoproto/master/gogoproto/gogo.proto
curl -o frontend/proto/cosmos_proto/cosmos.proto https://raw.githubusercontent.com/cosmos/cosmos-proto/main/proto/cosmos_proto/cosmos.proto

# Update package.json to include proto compilation
npm install --save-dev protobufjs-cli

# Create a simpler proto file without external dependencies
cat > frontend/proto/bridge/simple_tx.proto << EOL
syntax = "proto3";
package layer.bridge;

message MsgWithdrawTokens {
  string creator = 1;
  string recipient = 2;
  Coin amount = 3;
}

message Coin {
  string denom = 1;
  string amount = 2;
}
EOL

# Run proto compilation with the correct paths
cd frontend/proto
npx pbjs -t static-module -w commonjs -o layer_proto.js bridge/simple_tx.proto
npx pbts -o layer_proto.d.ts layer_proto.js

# Create a browser-compatible version
cat > layer_proto_browser.js << EOL
(function(global) {
    var $protobuf = protobuf;
    
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
            var writer = $protobuf.Writer.create();
            if (message.creator != null)
                writer.uint32(10).string(message.creator);
            if (message.recipient != null)
                writer.uint32(18).string(message.recipient);
            if (message.amount != null)
                layer.bridge.Coin.encode(message.amount, writer.uint32(26).fork()).ldelim();
            return writer.finish();
        };
        
        MsgWithdrawTokens.decode = function decode(reader) {
            if (!(reader instanceof $protobuf.Reader))
                reader = $protobuf.Reader.create(reader);
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
            var writer = $protobuf.Writer.create();
            if (message.denom != null)
                writer.uint32(10).string(message.denom);
            if (message.amount != null)
                writer.uint32(18).string(message.amount);
            return writer.finish();
        };
        
        Coin.decode = function decode(reader) {
            if (!(reader instanceof $protobuf.Reader))
                reader = $protobuf.Reader.create(reader);
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
EOL

# Go back to root
cd ../.. 