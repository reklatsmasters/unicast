'use strict';

const isPort = require('lib/util/is-port');

test('is port', () => {
  expect(isPort(1)).toBeTruthy();
  expect(isPort(0xffff)).toBeTruthy();

  expect(isPort(0)).toBeFalsy();
  expect(isPort(-1)).toBeFalsy();
  expect(isPort(0xffff + 1)).toBeFalsy();
  expect(isPort(0.0)).toBeFalsy();
  expect(isPort(NaN)).toBeFalsy();
  expect(isPort(null)).toBeFalsy();
  expect(isPort(undefined)).toBeFalsy();
  expect(isPort('port')).toBeFalsy();
  expect(isPort({})).toBeFalsy();
});
