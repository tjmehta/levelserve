"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var pumpify_1 = __importDefault(require("pumpify"));
var level_rpc_stream_1 = __importDefault(require("level-rpc-stream"));
var net_1 = __importDefault(require("net"));
var through2_1 = __importDefault(require("through2"));
var uuid_1 = __importDefault(require("uuid"));
var pumpify = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return new (pumpify_1.default.bind.apply(pumpify_1.default, [void 0].concat(args)))();
};
pumpify.obj = function () {
    var _a;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return new ((_a = pumpify_1.default.obj).bind.apply(_a, [void 0].concat(args)))();
};
function levelServe(level, _opts) {
    var opts = _opts || {
        encoder: through2_1.default.obj(),
        decoder: through2_1.default.obj(),
    };
    return net_1.default.createServer(function (conn) {
        var id = uuid_1.default();
        var levelStream = level_rpc_stream_1.default(level);
        pumpify.obj(conn, opts.decoder, toJSON(), prefixKey('id', id), 
        // log('level in'),
        levelStream, toJSON(), 
        // log('level out'),
        unprefixKeys(['id', 'meta'], id), toString(), opts.encoder, conn);
    });
}
exports.default = levelServe;
function toJSON() {
    return through2_1.default.obj(function (chunk, enc, cb) {
        try {
            cb(null, JSON.parse(chunk));
        }
        catch (err) {
            cb(err);
        }
    });
}
function toString() {
    return through2_1.default.obj(function (chunk, enc, cb) {
        var str;
        try {
            cb(null, JSON.stringify(chunk) + '\n');
        }
        catch (err) {
            cb(err);
        }
    });
}
function log(namespace) {
    return through2_1.default.obj(function (chunk, enc, cb) {
        console.log(namespace + ":", typeof chunk, chunk);
        cb(null, chunk);
    });
}
function prefixKey(key, namespace) {
    var regex = new RegExp("(\"id\":\")");
    return through2_1.default.obj(function (chunk, enc, cb) {
        if (Array.isArray(chunk))
            return void cb(null, '');
        if (typeof chunk[key] === 'string') {
            chunk[key] = namespace + "!" + chunk[key];
        }
        cb(null, chunk);
    });
}
function unprefixKeys(keys, namespace) {
    var regex = new RegExp("^" + namespace + "!");
    return through2_1.default.obj(function (chunk, enc, cb) {
        if (!Array.isArray(chunk) || chunk.length !== 3)
            return void cb(null, chunk);
        var data = chunk[2];
        keys.forEach(function (key) {
            if (typeof data[key] !== 'string')
                return;
            data[key] = data[key].replace(regex, '');
        });
        cb(null, chunk);
    });
}
