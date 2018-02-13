const { Duplex } = require('stream')
const { isIP } = require('net')
const Denque = require('denque')
const isPort = require('./util/is-port')
const isSocket = require('./util/is-socket')

const pSocket = Symbol('socket')
const pSocketClosed = Symbol('socketClosed')
const pReadQueue = Symbol('readQueue')
const pReadable = Symbol('readable')
const pRemoteAddress = Symbol('remoteAddress')
const pRemotePort = Symbol('remotePort')
const pWritableClosed = Symbol('writableClosed')
const pReadableClosed = Symbol('readableClosed')
const pCloseTransport = Symbol('closeTransport')

/**
 * This class implements stream-based dgram socket.
 */
module.exports = class Socket extends Duplex {
  constructor(options = {}) {
    super(options)

    if (!isIP(options.remoteAddress)) {
      throw new Error('Option `remoteAddress` should be a valid ip address.')
    }

    if (!isPort(options.remotePort)) {
      throw new Error('Option `remotePort` should be a valid port.')
    }

    if (!isSocket(options.socket)) {
      throw new Error('Option `socket` should be a valid dgram socket.')
    }

    this[pRemoteAddress] = options.remoteAddress
    this[pRemotePort] = options.remotePort

    this[pSocket] = options.socket

    this[pReadQueue] = denque()
    this[pSocketClosed] = false
    this[pReadable] = false
    this[pWritableClosed] = false
    this[pReadableClosed] = false

    this[pSocket].on('message', handleMessage.bind(this))
    this[pSocket].once('close', () => {
      this[pSocketClosed] = true
      this.close()
    })

    this.once('finish', () => {
      this[pWritableClosed] = true
    })

    this[pCloseTransport] = isBoolean(options.closeTransport) ? options.closeTransport : true
  }

  get remoteAddress() {
    return this[pRemoteAddress]
  }

  get remotePort() {
    return this[pRemotePort]
  }

  get localAddress() {
    return this[pSocket].address().address
  }

  get localPort() {
    return this[pSocket].address().port
  }

  _read() {
    if (this[pReadQueue].isEmpty()) {
      if (this[pSocketClosed]) {
        this.push(null)

        this[pReadable] = false
        this[pReadableClosed] = true
      } else {
        this[pReadable] = true
      }
    } else {
      this[pReadable] = this.push(this[pReadQueue].shift())
    }
  }

  _write(chunk, encoding, callback) {
    if (this[pWritableClosed]) {
      return callback(new Error('Write after free.'))
    }

    if (!Buffer.isBuffer(chunk)) {
      chunk = Buffer.from(chunk, encoding)
    }

    this[pSocket].send(chunk, this[pRemotePort], this[pRemoteAddress], callback)
  }

  _destroy(err, callback) {
    if (!this[pWritableClosed]) {
      this.end()
      this[pWritableClosed] = true
    }

    if (!this[pReadableClosed]) {
      this.push(null)
      this[pReadableClosed] = true
    }

    if (!this[pSocketClosed]) {
      this[pSocket].close()
      this[pSocketClosed] = true
    }

    this[pReadQueue].clear()
    this[pReadable] = false

    callback(err)
  }

  unshift(packet) {
    if (!Buffer.isBuffer(packet) || this[pReadableClosed]) {
      return false
    }

    if (this[pReadable]) {
      this[pReadable] = this.push(packet)
    } else {
      this[pReadQueue].unshift(packet)
    }

    return true
  }

  /**
   * Handle incoming data from another source.
   * Dangerous and undocumented method.
   * @public
   * @param {Buffer} data
   */
  process(data) {
    if (!Buffer.isBuffer(data) || this[pReadableClosed]) {
      return false
    }

    if (this[pReadable] && this[pReadQueue].isEmpty()) {
      this[pReadable] = this.push(data)
    } else {
      this[pReadQueue].push(data)
    }

    return true
  }

  close() {
    if (!this[pSocketClosed] && this[pCloseTransport]) {
      this[pSocket].close()
      this[pSocketClosed] = true
    }

    if (!this[pWritableClosed]) {
      this.end()
      this[pWritableClosed] = true
    }

    if (!this[pReadableClosed] && this[pReadQueue].isEmpty()) {
      this.push(null)
      this[pReadableClosed] = true
    }
  }
}

/**
 * A tiny wrapper for `denque`.
 */
function denque(...args) {
  return new Denque(...args)
}

/**
 * Handler `message` event.
 * @param {Buffer} message
 * @param {object} rinfo
 */
function handleMessage(message, rinfo) {
  // Drop messages from unknown sender.
  if (rinfo.address !== this[pRemoteAddress] || rinfo.port !== this[pRemotePort]) {
    return
  }

  return this.process(message)
}

/**
 * Check if argument is boolean.
 * @param {any} flag
 * @returns {boolean}
 */
function isBoolean(flag) {
  return typeof flag === 'boolean'
}
