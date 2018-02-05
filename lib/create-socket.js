const dgram = require('dgram')
const isSocket = require('./util/is-socket')
const Socket = require('./socket')

module.exports = createSocket

/**
 * Create a new UDP unicast socket.
 *
 * @param {dgram.Socket|string|object} socket
 * @param {object} [options]
 * @return {Socket}
 */
function createSocket(socket, options = {}) {
  if (!isSocket(socket)) {
    options = socket

    if (isSocket(options.socket)) {
      socket = options.socket
    } else {
      socket = dgram.createSocket(options)
      socket.bind(options.port || 0, options.address || '0.0.0.0')
    }
  }

  return new Socket(Object.assign({}, options, { socket }))
}
