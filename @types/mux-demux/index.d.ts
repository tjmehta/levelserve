declare module 'mux-demux' {
  import { Duplex, Readable, Writable } from 'stream'
  // opts type
  interface OptsType {
    circular?: boolean
    keepOpen?: boolean
    objectMode?: boolean
    unexpectedFinishError?: boolean
  }
  interface ObjOptsType extends Omit<OptsType, 'objectMode'> {}

  export class DuplexSubstream extends Duplex {
    meta: string
    error(message: string): void
  }
  export class ReadableSubstream extends Readable {
    meta: string
    error(message: string): void
  }
  export class WritableSubstream extends Writable {
    meta: string
    error(message: string): void
  }

  export type Substream = DuplexSubstream | ReadableSubstream | WritableSubstream

  // handleStream type
  function handleSubstream(
    stream: Substream,
  ): void
  type HandleSubstreamType = typeof handleSubstream

  // muxdemux type
  class MuxDemux extends Duplex {
    constructor(
      opts?: OptsType | HandleSubstreamType,
      handleSubstream?: HandleSubstreamType,
    )
    createStream(name: string): DuplexSubstream
    createReadStream(name: string): ReadableSubstream
    createWriteStream(name: string): WritableSubstream
  }

  function createMuxDemux(
    opts?: OptsType | HandleSubstreamType,
    handleSubstream?: HandleSubstreamType,
  ): MuxDemux

  export default createMuxDemux
}

declare module 'mux-demux/msgpack' {
  import createMuxDemux from 'mux-demux'
  export default createMuxDemux
}
