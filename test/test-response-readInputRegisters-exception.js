var fs = require('fs');
var assert = require('assert');
var modbus = require('modbus-stack');

exports['readInputRegisters response'] = function() {
  var dump = fs.createReadStream(__dirname + "/responses/readInputRegisters.exception.IllegalDataAddress.dump");
  var req = new modbus.ModbusRequestStack(dump);
  var gotResponse = false;
  var gotError = false;
  req.on('response', function(res) {
    // This shoud not be invoked
    gotResponse = true;
  });
  req.on('error', function(e) {
    gotError = true;
    assert.equal(e.errno, 2);
  });
  dump.on('close', function() {
    assert.ok(!gotResponse, "The 'response' event was fired");
    assert.ok(gotError, "The 'error' event was never fired");
  });
}
