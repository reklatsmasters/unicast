jest.mock('lib/util/is-socket')

const Emitter = require('events')
const Socket = require('lib/socket')

test('should check port', () => {
  expect(() => {
    new Socket({
      remotePort: -1,
      remoteAddress: '127.0.0.1'
    })
  }).toThrow('Option `remotePort` should be a valid port.')
})

test('should check address', () => {
  expect(() => {
    new Socket({
      remotePort: 100,
      remoteAddress: 'not.an.ip.addr'
    })
  }).toThrow('Option `remoteAddress` should be a valid ip address.')
})

test('should read with empty queue', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  const invalidMessage = Buffer.from('invalid')
  const validMessage = Buffer.from('valid')

  socket.push = jest.fn(() => true)

  socket._read()

  mock.emit('message', invalidMessage, {address: '127.0.0.2', port: 1111})
  mock.emit('message', invalidMessage, {address: '127.0.0.1', port: 2222})
  mock.emit('message', validMessage, {address: '127.0.0.1', port: 1111})

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenCalledWith(validMessage)
})

test('should read from queue', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  const message = Buffer.from('valid')
  const rinfo = {
    address: '127.0.0.1',
    port: 1111
  }

  socket.push = jest.fn(() => true)

  mock.emit('message', message, rinfo)
  expect(socket.push).not.toBeCalled()

  socket._read()
  expect(socket.push).toHaveBeenCalledTimes(1)
})

test('should not read after close', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  const message = Buffer.from('valid')
  const rinfo = {
    address: '127.0.0.1',
    port: 1111
  }

  socket.push = jest.fn(() => true)
  socket.close()

  mock.emit('message', message, rinfo)
  expect(socket.push).not.toHaveBeenCalledWith(message)
})

test('should send messages', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const remotePort = 1111
  const remoteAddress = '127.0.0.1'

  const socket = new Socket({
    socket: mock,
    remotePort,
    remoteAddress
  })

  const message = Buffer.from('valid')
  const callback = jest.fn()

  socket._write(message, 'buffer', callback)

  expect(mock.send).toHaveBeenCalledTimes(1)
  expect(mock.send).toHaveBeenCalledWith(message, remotePort, remoteAddress, callback)
})

test('should not send messages after close', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const remotePort = 1111
  const remoteAddress = '127.0.0.1'

  const socket = new Socket({
    socket: mock,
    remotePort,
    remoteAddress
  })

  const message = Buffer.from('valid')
  const callback = jest.fn()

  socket.close()

  socket._write(message, 'buffer', callback)
  expect(callback).toHaveBeenCalledWith(new Error('Write after free.'))
  expect(mock.send).not.toBeCalled()
})

test('should close', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  socket.push = jest.fn(() => true)
  socket.end = jest.fn()

  socket._read()
  socket.close()

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenCalledWith(null)

  expect(socket.end).toHaveBeenCalledTimes(1)
  expect(mock.close).toHaveBeenCalledTimes(1)
})

test('should close when dgram socket is closed', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  socket.push = jest.fn(() => true)
  socket.end = jest.fn()

  socket._read()
  mock.emit('close')

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenCalledWith(null)

  expect(socket.end).toHaveBeenCalledTimes(1)
  expect(mock.close).not.toBeCalled()
})

test('should not close the socket then `closeTransport = false`', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1',
    closeTransport: false
  })

  socket.push = jest.fn(() => true)
  socket.end = jest.fn()

  socket._read()
  socket.close()

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenCalledWith(null)

  expect(socket.end).toHaveBeenCalledTimes(1)
  expect(mock.close).toHaveBeenCalledTimes(0)
})

test('should close the socket then `closeTransport = true`', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1',
    closeTransport: true
  })

  socket.push = jest.fn(() => true)
  socket.end = jest.fn()

  socket._read()
  socket.close()

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenCalledWith(null)

  expect(socket.end).toHaveBeenCalledTimes(1)
  expect(mock.close).toHaveBeenCalledTimes(1)
})

test('should free queue when socket is closed', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  socket.push = jest.fn(() => true)
  socket.end = jest.fn()

  const message = Buffer.from('valid')
  const rinfo = {
    address: '127.0.0.1',
    port: 1111
  }

  mock.emit('message', message, rinfo)

  socket.close()

  expect(socket.push).not.toBeCalled()
  expect(socket.end).toHaveBeenCalledTimes(1)
  expect(mock.close).toHaveBeenCalledTimes(1)

  socket._read()

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenLastCalledWith(message)

  socket._read()

  expect(socket.push).toHaveBeenCalledTimes(2)
  expect(socket.push).toHaveBeenLastCalledWith(null)
})

test('unshift() should emit `data` event', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  socket.push = jest.fn(() => true)
  const message = Buffer.from('valid')

  socket._read()
  expect(socket.unshift(message)).toBe(true)

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenLastCalledWith(message)
})

test('unshift() should fill the queue', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  socket.push = jest.fn(() => true)
  const message = Buffer.from('valid')

  expect(socket.unshift(message)).toBe(true)
  expect(socket.push).not.toBeCalled()

  socket._read()

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenLastCalledWith(message)
})

test('unshift should not work', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  const message = Buffer.from('valid')

  expect(socket.unshift({})).toBe(false)

  socket.close()
  expect(socket.unshift(message)).toBe(false)
})

test('destroy', () => {
  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn()
  })

  const socket = new Socket({
    socket: mock,
    remotePort: 1111,
    remoteAddress: '127.0.0.1'
  })

  socket.push = jest.fn(() => true)
  socket.end = jest.fn()

  const message = Buffer.from('valid')
  const rinfo = {
    address: '127.0.0.1',
    port: 1111
  }

  mock.emit('message', message, rinfo)

  socket.destroy()

  expect(socket.push).toHaveBeenCalledTimes(1)
  expect(socket.push).toHaveBeenLastCalledWith(null)

  expect(socket.end).toHaveBeenCalledTimes(1)
  expect(mock.close).toHaveBeenCalledTimes(1)
})

test('address', () => {
  const address = '127.0.0.2'
  const port = 2222

  const mock = Object.assign(new Emitter(), {
    send: jest.fn(),
    close: jest.fn(),
    address: jest.fn(() => ({address, port}))
  })

  const remotePort = 1111
  const remoteAddress = '127.0.0.1'

  const socket = new Socket({
    socket: mock,
    remotePort,
    remoteAddress
  })

  expect(socket.remotePort).toEqual(remotePort)
  expect(socket.remoteAddress).toEqual(remoteAddress)
  expect(socket.localPort).toEqual(port)
  expect(socket.localAddress).toEqual(address)
})
