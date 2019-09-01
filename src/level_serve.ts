import createLevelStream, { OPERATIONS } from 'level-rpc-stream'

import { LevelUp } from 'levelup'
import Pumpify from 'pumpify'
import { Stream } from 'stream'
import net from 'net'
import through2 from 'through2'
import uuid from 'uuid'

type Opts = {
  encoder: NodeJS.ReadWriteStream
  decoder: NodeJS.ReadWriteStream
}

const pumpify = (...args: Stream[]) => new Pumpify(...args)
pumpify.obj = (...args: Stream[]) => new Pumpify.obj(...args)

export default function levelServe(level: LevelUp, _opts?: Opts) {
  const opts = _opts || {
    encoder: through2.obj(),
    decoder: through2.obj(),
  }

  return net.createServer(conn => {
    const id = uuid()
    const levelStream = createLevelStream(level)

    pumpify.obj(
      conn,
      opts.decoder,
      toJSON(),
      prefixKey('id', id),
      // log('level in'),
      levelStream,
      toJSON(),
      // log('level out'),
      unprefixKeys(['id', 'meta'], id),
      toString(),
      opts.encoder,
      conn,
    )
  })
}

function toJSON() {
  return through2.obj((chunk, enc, cb) => {
    try {
      cb(null, JSON.parse(chunk))
    } catch (err) {
      cb(err)
    }
  })
}

function toString() {
  return through2.obj((chunk, enc, cb) => {
    let str
    try {
      cb(null, JSON.stringify(chunk) + '\n')
    } catch (err) {
      cb(err)
    }
  })
}

function log(namespace: string) {
  return through2.obj((chunk, enc, cb) => {
    console.log(`${namespace}:`, typeof chunk, chunk)
    cb(null, chunk)
  })
}

function prefixKey(key: string, namespace: string) {
  const regex = new RegExp(`("id":")`)
  return through2.obj((chunk, enc, cb) => {
    if (Array.isArray(chunk)) return void cb(null, '')
    if (typeof chunk[key] === 'string') {
      chunk[key] = `${namespace}!${chunk[key]}`
    }
    cb(null, chunk)
  })
}

function unprefixKeys(keys: string[], namespace: string) {
  const regex = new RegExp(`^${namespace}!`)
  return through2.obj((chunk, enc, cb) => {
    if (!Array.isArray(chunk) || chunk.length !== 3) return void cb(null, chunk)
    const data = chunk[2]
    keys.forEach(key => {
      if (typeof data[key] !== 'string') return
      data[key] = data[key].replace(regex, '')
    })
    cb(null, chunk)
  })
}
