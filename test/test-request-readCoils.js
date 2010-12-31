var fs = require('fs');
var assert = require('assert');
var modbus = require('modbus-stack');

exports['readInputRegisters request'] = function() {
  var dump = fs.createReadStream(__dirname + "/requests/readCoils.start0.count50.dump");
  var res = new modbus.ModbusResponseStack(dump);
  var gotRequest = false;
  res.on('request', function(req) {
    gotRequest = true;
    assert.equal(req.functionCode, modbus.FUNCTION_CODES.READ_COILS, "request Function Code is not '" + modbus.FUNCTION_CODES.READ_COILS + "'");
    assert.equal(req.startAddress, 0);
    assert.equal(req.quantity, 50);
  });
  dump.on('close', function() {
    assert.ok(gotRequest, "The 'request' event was never fired");
  });
}
