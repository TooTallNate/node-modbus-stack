var PORT = 8503;
var ModbusRequestStack = require('modbus-stack').ModbusRequestStack;
var s = require('modbus-stack/server');
var assert = require('assert');

exports['server with a "handlers" Object'] = function() {
  var handlers = {};
  var startAddress = 0;
  var quantity = 10;
  handlers[4] = function(req, res) {
    //console.log(req);
    assert.equal(req.startAddress, startAddress);
    assert.equal(req.quantity, quantity);
    var rtn = new Array(req.quantity);
    for (var i=0; i<req.quantity; i++) {
      rtn[i] = req.startAddress + i;
    }
    res.writeResponse(rtn);
  }
  var server = s.createServer(handlers);
  server.listen(PORT, function() {
    var conn = require('net').createConnection(PORT);
    var clientRequest = new ModbusRequestStack(conn);
    clientRequest.request(4, startAddress, quantity, function(err, clientResponse) {
      //console.log(clientResponse);
      assert.ok(Array.isArray(clientResponse));
      assert.equal(clientResponse.length, quantity);
      conn.end();
      server.close();
    });
  });
}
