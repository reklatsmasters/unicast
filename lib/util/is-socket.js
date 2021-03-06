'use strict';

const dgram = require('dgram');

module.exports = isSocket;

/**
 * Check if an argument is a valid socket object.
 * @param {any} maybeSocket
 * @returns {bool}
 */
function isSocket(maybeSocket) {
  return maybeSocket instanceof dgram.Socket;
}
