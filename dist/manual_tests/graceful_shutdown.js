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
Object.defineProperty(exports, "__esModule", { value: true });
var level_rpc_stream_1 = require("level-rpc-stream");
var net_1 = require("net");
var duplexify_1 = __importDefault(require("duplexify"));
var level_serve_1 = __importDefault(require("../level_serve"));
var levelup_1 = __importDefault(require("levelup"));
var memdown_1 = __importDefault(require("memdown"));
var pump_1 = __importDefault(require("pump"));
var through2_1 = __importDefault(require("through2"));
function test() {
    return __awaiter(this, void 0, void 0, function () {
        var db, server, port, duplex, substream, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = levelup_1.default(memdown_1.default());
                    server = level_serve_1.default(db);
                    port = 8001;
                    // server listen
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            server.on('error', reject);
                            server.listen(port, function () {
                                server.removeListener('error', reject);
                                resolve();
                            });
                        })];
                case 1:
                    // server listen
                    _a.sent();
                    console.log('server started');
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var socket = net_1.connect(port, undefined, function () {
                                var inStream = jsonStringStream();
                                var outStream = through2_1.default.obj();
                                pump_1.default(inStream, socket, outStream);
                                var duplex = duplexify_1.default.obj(inStream, outStream);
                                resolve(duplex);
                            });
                        })];
                case 2:
                    duplex = _a.sent();
                    console.log('client started');
                    return [4 /*yield*/, getSubstream(duplex, level_rpc_stream_1.RESPONSE_SUBSTREAM_ID)];
                case 3:
                    substream = _a.sent();
                    console.log('rpc substream started');
                    duplex.write({
                        id: '1',
                        op: level_rpc_stream_1.OPERATIONS.GET,
                        args: ['key'],
                    });
                    console.log('req sent');
                    server.close();
                    console.log('close server');
                    duplex.end();
                    console.log('end duplex');
                    return [4 /*yield*/, onEvent(substream, 'data')];
                case 4:
                    data = _a.sent();
                    console.log('res recieved', data);
                    return [4 /*yield*/, db.close()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
test()
    .then(function () {
    console.log('test finished, process should exit');
})
    .catch(function (err) {
    throw err;
});
function getSubstream(duplex, id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var demuxStream = level_rpc_stream_1.demux(function (substream) {
                        console.log('new substream:', substream.meta);
                        if (substream.meta === id) {
                            resolve(substream);
                        }
                    });
                    duplex.pipe(demuxStream);
                })];
        });
    });
}
function onEvent(ee, event) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    function cleanup() {
                        ee.removeListener(event, handleEvent);
                    }
                    function handleEvent(data) {
                        cleanup();
                        resolve(data);
                    }
                    ee.on(event, handleEvent);
                    return cleanup;
                })];
        });
    });
}
function jsonStringStream() {
    return through2_1.default.obj(function (chunk, _, cb) { return cb(null, JSON.stringify(chunk)); });
}
