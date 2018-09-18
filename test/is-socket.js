'use strict';

const dgram = require('dgram');
const net = require('net');
const isSocket = require('lib/util/is-socket');

test('is socket', () => {
  expect(isSocket(dgram.createSocket('udp4'))).toBeTruthy();
  expect(isSocket(net.createServer())).toBeFalsy();
});
