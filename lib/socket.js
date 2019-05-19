'use strict';

const { Duplex } = require('stream');
const { isIP } = require('net');
const isPort = require('./util/is-port');
const isSocket = require('./util/is-socket');

const pSocket = Symbol('socket');
const pSocketClosed = Symbol('socketClosed');
const pRemoteAddress = Symbol('remoteAddress');
const pRemotePort = Symbol('remotePort');
const pWritableClosed = Symbol('writableClosed');
const pReadableClosed = Symbol('readableClosed');
const pCloseTransport = Symbol('closeTransport');

const defaultOptions = {
  decodeStrings: true,
};

/**
 * This class implements stream-based dgram socket.
 */
module.exports = class Socket extends Duplex {
  /**
   * @class
   * @param {Object} options
   * @param {string} options.remoteAddress
   * @param {number} options.remotePort
   * @param {dgram.Socket} options.socket
   * @param {boolean} [options.closeTransport]
   * @param {Function} [options.messagesFilter]
   */
  constructor(options = {}) {
    super(Object.assign({}, options, defaultOptions));

    const { remoteAddress, remotePort, socket, messagesFilter, closeTransport } = options;

    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;

    if (!isSocket(socket)) {
      throw new Error('Option `socket` should be a valid dgram socket.');
    }

    this[pSocket] = socket;

    this[pSocketClosed] = false;
    this[pWritableClosed] = false;
    this[pReadableClosed] = false;

    const checkMessage = messagesFilter || filter;

    if (typeof checkMessage !== 'function') {
      throw new TypeError('Option `messagesFilter` should be a function.');
    }

    this[pSocket].on('message', (message, rinfo) => {
      if (checkMessage(this, message, rinfo)) {
        this.process(message);
      }
    });

    this[pSocket].once('close', () => {
      this[pSocketClosed] = true;
      this.close();
    });

    this.once('finish', () => {
      this[pWritableClosed] = true;
    });

    this[pCloseTransport] = isBoolean(closeTransport) ? closeTransport : true;
  }

  /**
   * @returns {string}
   */
  get remoteAddress() {
    return this[pRemoteAddress];
  }

  /**
   * @param {string} address
   */
  set remoteAddress(address) {
    if (!isIP(address)) {
      throw new Error('Option `remoteAddress` should be a valid ip address.');
    }

    this[pRemoteAddress] = address;
  }

  /**
   * @returns {number}
   */
  get remotePort() {
    return this[pRemotePort];
  }

  /**
   * @param {number} port
   */
  set remotePort(port) {
    if (!isPort(port)) {
      throw new Error('Option `remotePort` should be a valid port.');
    }

    this[pRemotePort] = port;
  }

  /**
   * @returns {string}
   */
  get localAddress() {
    return this[pSocket].address().address;
  }

  /**
   * @returns {number}
   */
  get localPort() {
    return this[pSocket].address().port;
  }

  /**
   * @private
   */
  _read() {} // eslint-disable-line class-methods-use-this

  /**
   * @private
   * @param {Buffer} chunk
   * @param {string} encoding
   * @param {Function} callback
   */
  _write(chunk, encoding, callback) {
    if (this[pWritableClosed]) {
      callback(new Error('Write after free.'));
      return;
    }

    this[pSocket].send(chunk, this[pRemotePort], this[pRemoteAddress], callback);
  }

  /**
   * @private
   * @param {Error} error
   * @param {Function} callback
   */
  _destroy(error, callback) {
    if (!this[pWritableClosed]) {
      this.end();
      this[pWritableClosed] = true;
    }

    if (!this[pReadableClosed]) {
      this.push(null);
      this[pReadableClosed] = true;
    }

    if (!this[pSocketClosed]) {
      this[pSocket].close();
      this[pSocketClosed] = true;
    }

    callback(error);
  }

  /**
   * Handle incoming data from another source.
   * @param {Buffer} data
   * @returns {boolean}
   */
  process(data) {
    if (!Buffer.isBuffer(data) || this[pReadableClosed]) {
      return false;
    }

    this.push(data);
    return true;
  }

  /**
   * Close socket.
   */
  close() {
    if (!this[pSocketClosed] && this[pCloseTransport]) {
      this[pSocket].close();
      this[pSocketClosed] = true;
    }

    if (!this[pWritableClosed]) {
      this.end();
      this[pWritableClosed] = true;
    }

    if (!this[pReadableClosed]) {
      this.push(null);
      this[pReadableClosed] = true;
    }
  }
};

/**
 * Check if argument is boolean.
 * @param {any} flag
 * @returns {boolean}
 */
function isBoolean(flag) {
  return typeof flag === 'boolean';
}

/**
 * Default filter for incoming messages.
 * @param {Socket} socket
 * @param {Buffer} message
 * @param {{address: string, port: number}} rinfo
 * @returns {bool}
 */
function filter(socket, message, rinfo) {
  const isAllowedAddress = socket.remoteAddress === rinfo.address;
  const isAllowedPort = socket.remotePort === rinfo.port;

  return isAllowedAddress && isAllowedPort;
}
