'use strict';

const dgram = require('dgram');
const isSocket = require('./util/is-socket');
const Socket = require('./socket');

module.exports = createSocket;

/**
 * Create a new UDP unicast socket.
 *
 * @param {dgram.Socket|string|object} socket
 * @param {object} [options]
 * @return {Socket}
 */
function createSocket(socket, options = {}) {
  if (!isSocket(socket)) {
    options = socket; // eslint-disable-line no-param-reassign

    if (isSocket(options.socket)) {
      // eslint-disable-next-line no-param-reassign, prefer-destructuring
      socket = options.socket;
    } else {
      socket = dgram.createSocket(options); // eslint-disable-line no-param-reassign
      socket.bind(options.port || 0, options.address || '0.0.0.0');
    }
  }

  return new Socket(Object.assign({}, options, { socket }));
}
