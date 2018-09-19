# unicast

[![Build Status](https://travis-ci.org/reklatsmasters/unicast.svg?branch=master)](https://travis-ci.org/reklatsmasters/unicast)
[![npm](https://img.shields.io/npm/v/unicast.svg)](https://npmjs.org/package/unicast)
[![node](https://img.shields.io/node/v/unicast.svg)](https://npmjs.org/package/unicast)
[![license](https://img.shields.io/npm/l/unicast.svg)](https://npmjs.org/package/unicast)
[![downloads](https://img.shields.io/npm/dm/unicast.svg)](https://npmjs.org/package/unicast)
[![Coverage Status](https://coveralls.io/repos/github/reklatsmasters/unicast/badge.svg?branch=master)](https://coveralls.io/github/reklatsmasters/unicast?branch=master)

[Unicast](https://en.wikipedia.org/wiki/Unicast) implementation of UDP Datagram sockets.

## Usage

```js
const unicast = require('unicast')
const fs = require('fs')

const socket = unicast.createSocket({
  type: 'udp4',
  port: 2222,
  remotePort: 1111,
  remoteAddress: '127.0.0.1'
})

// now the `socket` can receive packets ONLY
// from 127.0.0.1:1111

socket.pipe(fs.createWriteStream('log.txt', { encoding: 'utf8' }))
```

## API

* `createSocket(socket: dgram.Socket, options: Options): Socket`
* `createSocket(options: Options): Socket`

Creates an unicast UDP Datagram socket. A `createSocket()` function also accept all options for `dgram.createSocket()`. If `socket` is provided, these options will be ignored.

* `options.remotePort: number`

The numeric representation of the remote port.

* `options.remoteAddress: string`

The string representation of the remote IP address.

* `options.socket: dgram.Socket`

An optional internal `dgram` socket used as transport layer.

* `options.port: number [default = 0]`

The string representation of the local IP address. If `port` is not specified or is `0`, the operating system will attempt to bind to a random port.

* `options.address: string [default = 0.0.0.0]`

The string representation of the local IP address. If `address` is not specified or is `0.0.0.0`, the operating system will attempt to listen on all addresses.

* `options.closeTransport: boolean [default = true]`

The internal socket will be closed when the `unicast.Socket` is being closed. You can change this behavior with this option.

* `options.messagesFilter: function(socket: Socket, message: Buffer, rinfo: Object): bool`

Custom filter of an incoming messages. By default it check the remote IP address and the remote port.

* `class Socket`

This class is an abstraction of an unicast UDP socket. A `Socket` is also a [duplex stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex), so it can be both readable and writable, and it is also a [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).

* `socket.close()`

Close the underlying socket and stop listening for data on it.

* `socket.unshift(message: Buffer): bool`

The `socket.unshift()` method pushes a chunk of data back into the internal buffer. This is useful in certain situations where a stream is being consumed by code that needs to "un-consume" some amount of data that it has optimistically pulled out of the source, so that the data can be passed on to some other party.

* `socket.process(message: Buffer): bool`

The `socket.process()` method helps to handle a chunk of data from an another source. Almost the same as `socket.unshift()` but pushes a chunk of data into the end of the internal buffer.

* `socket.localAddress: string`

The string representation of the local IP address. For example, `74.125.127.100` or `2001:4860:a005::68`.

* `socket.localPort: number`

The numeric representation of the local port. For example, `80` or `21`.

* `get/set socket.remoteAddress: string`

The string representation of the remote IP address. For example, `74.125.127.100` or `2001:4860:a005::68`.

* `get/set socket.remotePort: number`

The numeric representation of the remote port. For example, `80` or `21`.

## License

MIT, 20!8 (c) Dmitriy Tsvettsikh
