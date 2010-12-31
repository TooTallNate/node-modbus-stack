var fs = require('fs');
var assert = require('assert');
var modbus = require('modbus-stack');

exports['readDiscreteInputs request'] = function() {
  var dump = fs.createReadStream(__dirname + "/requests/readDiscreteInputs.start197.count22.dump");
  var res = new modbus.ModbusResponseStack(dump);
  var gotRequest = false;
  res.on('request', function(req) {
    gotRequest = true;
    assert.equal(req.functionCode, modbus.FUNCTION_CODES.READ_DISCRETE_INPUTS, "request Function Code is not '" + modbus.FUNCTION_CODES.READ_DISCRETE_INPUTS + "'");
    assert.equal(req.startAddress, 196);
    assert.equal(req.quantity, 22);
  });
  dump.on('close', function() {
    assert.ok(gotRequest, "The 'request' event was never fired");
  });
}
