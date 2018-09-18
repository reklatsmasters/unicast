'use strict';

const createSocket = require('lib/create-socket');
const Socket = require('lib/socket');

jest.mock('lib/socket');
jest.mock('lib/util/is-socket', () =>
  jest.fn().mockImplementation(x => x === true)
);
jest.mock('dgram', () => ({
  createSocket(s) {
    return s;
  },
}));

beforeEach(() => {
  Socket.mockClear();
});

test('call 1', () => {
  expect(createSocket(true)).toBeInstanceOf(Socket);
  expect(Socket).toHaveBeenLastCalledWith({ socket: true });
});

test('call 2', () => {
  expect(createSocket({ socket: true })).toBeInstanceOf(Socket);
  expect(Socket).toHaveBeenLastCalledWith({ socket: true });
});

test('call 3', () => {
  const socket = {
    type: 'udp4',
    bind: jest.fn(),
  };

  expect(createSocket(socket)).toBeInstanceOf(Socket);
  expect(Socket).toHaveBeenCalledWith(Object.assign({ socket }, socket));
  expect(socket.bind).toBeCalled();
});
