"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var level_rpc_stream_1 = require("level-rpc-stream");
var net_1 = require("net");
var pumpify_1 = __importDefault(require("pumpify"));
var duplexify_1 = __importDefault(require("duplexify"));
var level_serve_1 = __importDefault(require("../level_serve"));
var levelup_1 = __importDefault(require("levelup"));
var memdown_1 = __importDefault(require("memdown"));
var pump_1 = __importDefault(require("pump"));
var through2_1 = __importDefault(require("through2"));
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
describe('levelServe', function () {
    var ctx;
    beforeEach(function (done) {
        var inStream = through2_1.default.obj();
        var outStream = through2_1.default.obj();
        var db = levelup_1.default(memdown_1.default());
        ctx = {
            db: db,
            duplex: duplexify_1.default.obj(inStream, outStream),
            server: level_serve_1.default(db),
            socket: undefined,
        };
        ctx.server.listen(8001, done);
    });
    afterEach(function (done) {
        ctx.db.close(done);
    });
    afterEach(function (done) {
        ctx.server.close(done);
    });
    afterEach(function (done) {
        if (ctx.socket)
            ctx.socket.end(done);
    });
    it('should handle a GET request and respond w/ error', function () { return __awaiter(_this, void 0, void 0, function () {
        var stream, substream, chunk;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, clientStream(8001)];
                case 1:
                    stream = _a.sent();
                    return [4 /*yield*/, clientSubstream(stream, level_rpc_stream_1.RESPONSE_SUBSTREAM_ID)];
                case 2:
                    substream = _a.sent();
                    stream.write({
                        id: '1',
                        op: level_rpc_stream_1.OPERATIONS.GET,
                        args: ['key'],
                    });
                    return [4 /*yield*/, onceEvent(substream, 'data')];
                case 3:
                    chunk = _a.sent();
                    expect(chunk).toMatchInlineSnapshot("\n      Object {\n        \"error\": [NotFoundError: Key not found in database [key]],\n        \"id\": \"1\",\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    describe('leveldb contains data', function () {
        beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, res;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = ctx;
                        return [4 /*yield*/, clientStream(8001)];
                    case 1:
                        _a.stream = _c.sent();
                        _b = ctx;
                        return [4 /*yield*/, clientSubstream(ctx.stream, level_rpc_stream_1.RESPONSE_SUBSTREAM_ID)];
                    case 2:
                        _b.substream = _c.sent();
                        ctx.stream.write({
                            id: '1',
                            op: level_rpc_stream_1.OPERATIONS.PUT,
                            args: ['key', 'val'],
                        });
                        return [4 /*yield*/, onceEvent(ctx.substream, 'data')];
                    case 3:
                        res = _c.sent();
                        if (res.error)
                            throw res.error;
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle a GET request and respond with data', function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ctx.stream)
                            throw new Error('stream missing');
                        if (!ctx.substream)
                            throw new Error('substream missing');
                        ctx.stream.write({
                            id: '2',
                            op: level_rpc_stream_1.OPERATIONS.GET,
                            args: ['key'],
                        });
                        return [4 /*yield*/, onceEvent(ctx.substream, 'data')];
                    case 1:
                        res = _a.sent();
                        ctx.substream.destroy();
                        // @ts-ignore res has a result
                        expect(res && res.result).toBeInstanceOf(Buffer);
                        expect(res).toMatchInlineSnapshot("\n        Object {\n          \"id\": \"2\",\n          \"result\": Object {\n            \"data\": Array [\n              118,\n              97,\n              108,\n            ],\n            \"type\": \"Buffer\",\n          },\n        }\n      ");
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle a RSTREAM request and respond via substream', function () { return __awaiter(_this, void 0, void 0, function () {
            var requestId, substream, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ctx.stream)
                            throw new Error('stream missing');
                        if (!ctx.substream)
                            throw new Error('substream missing');
                        requestId = 'mustbeunique';
                        ctx.stream.write({
                            id: requestId,
                            op: level_rpc_stream_1.OPERATIONS.RSTREAM,
                        });
                        return [4 /*yield*/, clientSubstream(ctx.stream, requestId)];
                    case 1:
                        substream = _a.sent();
                        return [4 /*yield*/, onceEvent(substream, 'data')];
                    case 2:
                        res = _a.sent();
                        expect(res && res.key).toBeInstanceOf(Buffer);
                        expect(res && res.value).toBeInstanceOf(Buffer);
                        expect(res).toMatchInlineSnapshot("\n        Object {\n          \"key\": Object {\n            \"data\": Array [\n              107,\n              101,\n              121,\n            ],\n            \"type\": \"Buffer\",\n          },\n          \"value\": Object {\n            \"data\": Array [\n              118,\n              97,\n              108,\n            ],\n            \"type\": \"Buffer\",\n          },\n        }\n      ");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    function clientStream(port) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var inStream = through2_1.default.obj(function (chunk, enc, cb) {
                            return cb(null, JSON.stringify(chunk));
                        });
                        var outStream = through2_1.default.obj();
                        var socket = net_1.connect(port, undefined, function () {
                            pump_1.default(inStream, socket, outStream);
                            resolve(duplexify_1.default.obj(inStream, outStream));
                        });
                        ctx.socket = socket;
                    })];
            });
        });
    }
    function clientSubstream(duplex, meta) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        duplex.pipe(level_rpc_stream_1.demux(function (substream) {
                            if (substream.meta === meta) {
                                // console.log('substream', substream.meta)
                                resolve(substream);
                            }
                        }));
                    })];
            });
        });
    }
    function onceEvent(stream, event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        stream.once(event, resolve);
                    })];
            });
        });
    }
});
