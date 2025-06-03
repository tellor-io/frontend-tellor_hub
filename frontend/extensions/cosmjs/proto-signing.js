// @cosmjs/proto-signing v0.28.11
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cosmjs = global.cosmjs || {}, global.cosmjs.protoSigning = {}));
}(this, (function (exports) {
    'use strict';

    // Basic signing utilities
    const protoSigning = {
        encodePubkey: function(pubkey) {
            return {
                type: pubkey.type,
                value: pubkey.value
            };
        },
        decodePubkey: function(pubkey) {
            return {
                type: pubkey.type,
                value: pubkey.value
            };
        }
    };

    exports.protoSigning = protoSigning;
}))); 