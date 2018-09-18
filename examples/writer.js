'use strict';

const fs = require('fs');
const dgram = require('dgram');
const unicast = require('..');

const sender = dgram.createSocket('udp4');

const socket = unicast.createSocket({
  type: 'udp4',
  port: 2222,
  remotePort: 1111,
  remoteAddress: '127.0.0.1',
});

socket.pipe(fs.createWriteStream('./test.txt', { encoding: 'utf8' }));

sender.bind(1111, '127.0.0.1', () => {
  sender.send(Buffer.from('hello,'), 2222, () => {
    sender.send(Buffer.from(' world!'), 2222, () => {
      sender.close();
      setTimeout(() => socket.close(), 1e2);
    });
  });
});
