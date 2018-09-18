'use strict';

module.exports = isPort;

/**
 * Check if argument is a valid port.
 * @param {number} port
 * @return {bool}
 */
function isPort(port) {
  if (!Number.isInteger(port)) {
    return false;
  }

  return port > 0 && port <= 0xffff;
}
