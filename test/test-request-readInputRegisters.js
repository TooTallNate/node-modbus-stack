var fs = require('fs');
var assert = require('assert');
var modbus = require('modbus-stack');
var Stream = require('stream').Stream;

exports['readInputRegisters request'] = function() {
  var dump = fs.createReadStream(__dirname + "/requests/readInputRegisters.start0.count4.dump");
  var res = new modbus.ModbusResponseStack(dump);
  var gotRequest = false;
  res.on('request', function(req) {
    gotRequest = true;
    assert.equal(req.functionCode, modbus.FUNCTION_CODES.READ_INPUT_REGISTERS, "request Function Code is not '" + modbus.FUNCTION_CODES.READ_INPUT_REGISTERS + "'");
    assert.equal(req.startAddress, 0);
    assert.equal(req.quantity, 4);
  });
  dump.on('close', function() {
    assert.ok(gotRequest, "The 'request' event was never fired");
  });
}
