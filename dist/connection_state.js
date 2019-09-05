"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var level_rpc_stream_1 = require("level-rpc-stream");
var through2_1 = __importDefault(require("through2"));
var ConnectionState = /** @class */ (function (_super) {
    __extends(ConnectionState, _super);
    function ConnectionState() {
        var _this = _super.call(this) || this;
        _this.unresolvedQueryIds = new Set();
        _this.openStreamIds = new Set();
        return _this;
    }
    ConnectionState.prototype._deleteQueryId = function (queryId) {
        this.unresolvedQueryIds.delete(queryId);
        this.emit('resolvedQuery', queryId);
    };
    ConnectionState.prototype._deleteStreamId = function (streamId) {
        this.openStreamIds.delete(streamId);
        this.emit('streamClosed', streamId);
    };
    ConnectionState.prototype.monitorRequests = function () {
        var _this = this;
        return through2_1.default.obj(function (chunk, enc, cb) {
            if (chunk &&
                (chunk.op === level_rpc_stream_1.OPERATIONS.RSTREAM ||
                    chunk.op === level_rpc_stream_1.OPERATIONS.KSTREAM ||
                    chunk.op === level_rpc_stream_1.OPERATIONS.VSTREAM)) {
                _this.openStreamIds.add(chunk.id);
            }
            else {
                _this.unresolvedQueryIds.add(chunk.id);
            }
            cb(null, chunk);
        });
    };
    ConnectionState.prototype.monitorResponses = function () {
        var _this = this;
        return through2_1.default.obj(function (chunk, enc, cb) {
            if (Array.isArray(chunk)) {
                if (chunk.length === 2 && chunk[1] === 'close') {
                    var streamId = chunk[0];
                    _this._deleteStreamId(streamId);
                }
            }
            else if (typeof chunk.id === 'string') {
                if (_this.unresolvedQueryIds.has(chunk.id)) {
                    _this._deleteStreamId(chunk.id);
                }
                else if (_this.openStreamIds.has(chunk.id)) {
                    _this._deleteQueryId(chunk.id);
                }
            }
            cb(null, chunk);
        });
    };
    return ConnectionState;
}(events_1.EventEmitter));
exports.default = ConnectionState;
