var PORT = 8502;
var ModbusRequestStack = require('modbus-stack').ModbusRequestStack;
var s = require('modbus-stack/server');
var assert = require('assert');

exports['server with "catch-all"'] = function() {
  var server = s.createServer(function(req, res) {
    //console.log(req);
    assert.equal(req.startAddress, 0);
    assert.equal(req.quantity, 10);
    var rtn = new Array(req.quantity);
    for (var i=0; i<req.quantity; i++) {
      rtn[i] = req.startAddress + i;
    }
    res.writeResponse(rtn);
  });
  server.listen(PORT, function() {
    var conn = require('net').createConnection(PORT);
    var clientRequest = new ModbusRequestStack(conn);
    var quantity = 10;
    clientRequest.request(4, 0, quantity, function(err, clientResponse) {
      //console.log(clientResponse);
      assert.ok(Array.isArray(clientResponse));
      assert.equal(clientResponse.length, quantity);
      conn.end();
      server.close();
    });
  });
}
