var assert = require('assert');
var modbus = require('modbus-stack');
var Stream = require('stream').Stream;

exports['bad client request'] = function() {
  var s = new Stream();
  s.write = function() {};
  var req = new modbus.ModbusRequestStack(s);
  assert.throws(function() {
    req.request(Infinity);
  });
}
