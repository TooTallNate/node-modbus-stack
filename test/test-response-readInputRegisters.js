var fs = require('fs');
var assert = require('assert');
var modbus = require('modbus-stack');

exports['readInputRegisters response'] = function() {
  var dump = fs.createReadStream(__dirname + "/responses/readInputRegisters.start0.count4.dump");
  var req = new modbus.ModbusRequestStack(dump);
  var gotResponse = false;
  req.on('response', function(res) {
    gotResponse = true;
    assert.equal(res.functionCode, modbus.FUNCTION_CODES.READ_INPUT_REGISTERS, "response Function Code is not '" + modbus.FUNCTION_CODES.READ_INPUT_REGISTERS + "'");
    assert.equal(res.byteLength, 8, "Expected byte length of 8");
    assert.ok(Array.isArray(res), "response should be an Array");
    assert.equal(res[0], 732);
    assert.equal(res[1], 737);
    assert.equal(res[2], 744);
    assert.equal(res[3], 716);
  });
  dump.on('close', function() {
    assert.ok(gotResponse, "The 'response' event was never fired");
  });
}
