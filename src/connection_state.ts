import MuxDemux, { ReadableSubstream, Substream } from 'mux-demux'

import { EventEmitter } from 'events'
import { OPERATIONS } from 'level-rpc-stream'
import { Stream } from 'pump'
import { Writable } from 'stream'
import through2 from 'through2'
import uuid from 'uuid'

export default class ConnectionState extends EventEmitter {
  unresolvedQueryIds: Set<string>
  openStreamIds: Set<string>
  constructor() {
    super()
    this.unresolvedQueryIds = new Set()
    this.openStreamIds = new Set()
  }
  _deleteQueryId(queryId: string) {
    this.unresolvedQueryIds.delete(queryId)
    this.emit('resolvedQuery', queryId)
  }
  _deleteStreamId(streamId: string) {
    this.openStreamIds.delete(streamId)
    this.emit('streamClosed', streamId)
  }
  monitorRequests() {
    return through2.obj((chunk, enc, cb) => {
      if (
        chunk &&
        (chunk.op === OPERATIONS.RSTREAM ||
          chunk.op === OPERATIONS.KSTREAM ||
          chunk.op === OPERATIONS.VSTREAM)
      ) {
        this.openStreamIds.add(chunk.id)
      } else {
        this.unresolvedQueryIds.add(chunk.id)
      }
      cb(null, chunk)
    })
  }
  monitorResponses() {
    return through2.obj((chunk, enc, cb) => {
      if (Array.isArray(chunk)) {
        if (chunk.length === 2 && chunk[1] === 'close') {
          const streamId = chunk[0]
          this._deleteStreamId(streamId)
        }
      } else if (typeof chunk.id === 'string') {
        if (this.unresolvedQueryIds.has(chunk.id)) {
          this._deleteStreamId(chunk.id)
        } else if (this.openStreamIds.has(chunk.id)) {
          this._deleteQueryId(chunk.id)
        }
      }
      cb(null, chunk)
    })
  }
}
