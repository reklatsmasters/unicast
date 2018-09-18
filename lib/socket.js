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
   * @constructor
   * @param {object} options
   * @param {string} options.remoteAddress
   * @param {number} options.remotePort
   * @param {dgram.Socket} options.socket
   * @param {bool} options.closeTransport
   */
  constructor(options = {}) {
    super(Object.assign({}, options, defaultOptions));

    if (!isIP(options.remoteAddress)) {
      throw new Error('Option `remoteAddress` should be a valid ip address.');
    }

    if (!isPort(options.remotePort)) {
      throw new Error('Option `remotePort` should be a valid port.');
    }

    if (!isSocket(options.socket)) {
      throw new Error('Option `socket` should be a valid dgram socket.');
    }

    this[pRemoteAddress] = options.remoteAddress;
    this[pRemotePort] = options.remotePort;

    this[pSocket] = options.socket;

    this[pSocketClosed] = false;
    this[pWritableClosed] = false;
    this[pReadableClosed] = false;

    this[pSocket].on('message', handleMessage.bind(this));
    this[pSocket].once('close', () => {
      this[pSocketClosed] = true;
      this.close();
    });

    this.once('finish', () => {
      this[pWritableClosed] = true;
    });

    this[pCloseTransport] = isBoolean(options.closeTransport)
      ? options.closeTransport
      : true;
  }

  /**
   * @return {string}
   */
  get remoteAddress() {
    return this[pRemoteAddress];
  }

  /**
   * @return {number}
   */
  get remotePort() {
    return this[pRemotePort];
  }

  /**
   * @return {string}
   */
  get localAddress() {
    return this[pSocket].address().address;
  }

  /**
   * @return {number}
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
   * @param {function} callback
   */
  _write(chunk, encoding, callback) {
    if (this[pWritableClosed]) {
      callback(new Error('Write after free.'));
      return;
    }

    this[pSocket].send(
      chunk,
      this[pRemotePort],
      this[pRemoteAddress],
      callback
    );
  }

  /**
   * @private
   * @param {Error} err
   * @param {function} callback
   */
  _destroy(err, callback) {
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

    callback(err);
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
 * Handler `message` event.
 * @param {Buffer} message
 * @param {object} rinfo
 */
function handleMessage(message, rinfo) {
  // Drop messages from unknown sender.
  if (
    rinfo.address !== this[pRemoteAddress] ||
    rinfo.port !== this[pRemotePort]
  ) {
    return;
  }

  this.process(message);
}

/**
 * Check if argument is boolean.
 * @param {any} flag
 * @returns {boolean}
 */
function isBoolean(flag) {
  return typeof flag === 'boolean';
}
