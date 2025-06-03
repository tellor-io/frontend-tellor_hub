// @cosmjs/encoding v0.28.11
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cosmjs = global.cosmjs || {}, global.cosmjs.encoding = {}));
}(this, (function (exports) {
    'use strict';

    // Base64 encoding/decoding
    const base64 = {
        encode: function(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
        },
        decode: function(str) {
            return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        }
    };

    // Hex encoding/decoding
    const hex = {
        encode: function(str) {
            return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        },
        decode: function(str) {
            return str.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
        }
    };

    exports.base64 = base64;
    exports.hex = hex;
}))); 