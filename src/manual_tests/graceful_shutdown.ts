import { OPERATIONS, RESPONSE_SUBSTREAM_ID, demux } from 'level-rpc-stream'
import { Socket, connect } from 'net'

import { Duplex } from 'stream'
import { EventEmitter } from 'events'
import { Substream } from 'mux-demux'
import duplexify from 'duplexify'
import levelServe from '../level_serve'
import levelup from 'levelup'
import memdown from 'memdown'
import pump from 'pump'
import through2 from 'through2'

async function test() {
  /**
   * serverside code
   */
  const db = levelup(memdown())
  const server = levelServe(db)
  const port = 8001

  // server listen
  await new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, () => {
      server.removeListener('error', reject)
      resolve()
    })
  })
  console.log('server started')

  /**
   * clientside code
   */
  // client listen
  const duplex: Duplex = await new Promise(resolve => {
    const socket: Socket = connect(
      port,
      undefined,
      () => {
        const inStream = jsonStringStream()
        const outStream = through2.obj()
        pump(inStream, socket, outStream)
        const duplex = duplexify.obj(inStream, outStream)
        resolve(duplex)
      },
    )
  })
  console.log('client started')

  const substream: Substream = await getSubstream(duplex, RESPONSE_SUBSTREAM_ID)
  console.log('rpc substream started')

  duplex.write({
    id: '1',
    op: OPERATIONS.GET,
    args: ['key'],
  })
  console.log('req sent')
  server.close()
  console.log('close server')
  duplex.end()
  console.log('end duplex')

  const data = await onEvent(substream, 'data')
  console.log('res recieved', data)

  await db.close()
}

test()
  .then(() => {
    console.log('test finished, process should exit')
  })
  .catch(err => {
    throw err
  })

async function getSubstream(duplex: Duplex, id: string): Promise<Substream> {
  return new Promise(resolve => {
    const demuxStream = demux((substream: Substream) => {
      console.log('new substream:', substream.meta)
      if (substream.meta === id) {
        resolve(substream)
      }
    })
    duplex.pipe(demuxStream)
  })
}
async function onEvent(ee: EventEmitter, event: string): Promise<any> {
  return new Promise(resolve => {
    function cleanup() {
      ee.removeListener(event, handleEvent)
    }
    function handleEvent(data: any) {
      cleanup()
      resolve(data)
    }
    ee.on(event, handleEvent)
    return cleanup
  })
}
function jsonStringStream() {
  return through2.obj((chunk, _, cb) => cb(null, JSON.stringify(chunk)))
}
