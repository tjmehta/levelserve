import { Duplex, Stream } from 'stream'
import { OPERATIONS, RESPONSE_SUBSTREAM_ID, demux } from 'level-rpc-stream'
import { ReadableSubstream, Substream } from 'mux-demux'
import { Server, connect } from 'net'

import { LevelUp } from 'levelup'
import Pumpify from 'pumpify'
import { Socket } from 'net'
import duplexify from 'duplexify'
import levelServe from '../level_serve'
import levelup from 'levelup'
import memdown from 'memdown'
import pump from 'pump'
import through2 from 'through2'

const pumpify = (...args: Stream[]) => new Pumpify(...args)
pumpify.obj = (...args: Stream[]) => new Pumpify.obj(...args)

describe('levelServe', () => {
  let ctx: {
    db: LevelUp
    server: Server
    duplex: Duplex
    socket?: Socket
    stream?: Duplex
    substream?: Substream
  }

  beforeEach(done => {
    const inStream = through2.obj()
    const outStream = through2.obj()

    const db = levelup(memdown())

    ctx = {
      db,
      duplex: duplexify.obj(inStream, outStream),
      server: levelServe(db),
      socket: undefined,
    }

    ctx.server.listen(8001, done)
  })
  afterEach(done => {
    ctx.db.close(done)
  })
  afterEach(done => {
    ctx.server.close(done)
  })
  afterEach(done => {
    if (ctx.socket) ctx.socket.end(done)
  })

  it('should handle a GET request and respond w/ error', async () => {
    const stream = await clientStream(8001)
    const substream = await clientSubstream(stream, RESPONSE_SUBSTREAM_ID)
    stream.write({
      id: '1',
      op: OPERATIONS.GET,
      args: ['key'],
    })
    const chunk = await onceEvent(substream, 'data')
    expect(chunk).toMatchInlineSnapshot(`
      Object {
        "error": [NotFoundError: Key not found in database [key]],
        "id": "1",
      }
    `)
  })

  describe('leveldb contains data', () => {
    beforeEach(async () => {
      ctx.stream = await clientStream(8001)
      ctx.substream = await clientSubstream(ctx.stream, RESPONSE_SUBSTREAM_ID)
      ctx.stream.write({
        id: '1',
        op: OPERATIONS.PUT,
        args: ['key', 'val'],
      })
      const res: { error?: Error } = await onceEvent(ctx.substream, 'data')
      if (res.error) throw res.error
    })

    it('should handle a GET request and respond with data', async () => {
      if (!ctx.stream) throw new Error('stream missing')
      if (!ctx.substream) throw new Error('substream missing')
      ctx.stream.write({
        id: '2',
        op: OPERATIONS.GET,
        args: ['key'],
      })
      const res = await onceEvent(ctx.substream, 'data')
      ctx.substream.destroy()
      // @ts-ignore res has a result
      expect(res && res.result).toBeInstanceOf(Buffer)
      expect(res).toMatchInlineSnapshot(`
        Object {
          "id": "2",
          "result": Object {
            "data": Array [
              118,
              97,
              108,
            ],
            "type": "Buffer",
          },
        }
      `)
    })

    it('should handle a RSTREAM request and respond via substream', async () => {
      if (!ctx.stream) throw new Error('stream missing')
      if (!ctx.substream) throw new Error('substream missing')
      const requestId = 'mustbeunique'
      ctx.stream.write({
        id: requestId,
        op: OPERATIONS.RSTREAM,
      })
      const substream = await clientSubstream(ctx.stream, requestId)
      const res = await onceEvent(substream, 'data')
      expect(res && res.key).toBeInstanceOf(Buffer)
      expect(res && res.value).toBeInstanceOf(Buffer)
      expect(res).toMatchInlineSnapshot(`
        Object {
          "key": Object {
            "data": Array [
              107,
              101,
              121,
            ],
            "type": "Buffer",
          },
          "value": Object {
            "data": Array [
              118,
              97,
              108,
            ],
            "type": "Buffer",
          },
        }
      `)
    })
  })

  async function clientStream(port: number): Promise<Duplex> {
    return new Promise((resolve, reject) => {
      const inStream = through2.obj((chunk, enc, cb) =>
        cb(null, JSON.stringify(chunk)),
      )
      const outStream = through2.obj()
      const socket = connect(
        port,
        undefined,
        () => {
          pump(inStream, socket, outStream)
          resolve(duplexify.obj(inStream, outStream))
        },
      )
      ctx.socket = socket
    })
  }

  async function clientSubstream(
    duplex: Duplex,
    meta: string,
  ): Promise<ReadableSubstream> {
    return new Promise((resolve, reject) => {
      duplex.pipe(
        demux((substream: ReadableSubstream) => {
          if (substream.meta === meta) {
            // console.log('substream', substream.meta)
            resolve(substream)
          }
        }),
      )
    })
  }

  async function onceEvent(stream: Stream, event: string): Promise<any> {
    return new Promise(resolve => {
      stream.once(event, resolve)
    })
  }
})
