var FUNCTION_CODES = require('modbus-stack').FUNCTION_CODES;
var ModbusResponseStack = require('modbus-stack').ModbusResponseStack;

// A simple MODBUS server (Slave).
require('net').createServer(function setup(stream) {
  var response = new ModbusResponseStack(stream);
  response.on('request', function(request) {
    console.log(request);
    var a = new Array(request.quantity);
    for (var i=0, l=request.quantity; i<l; i++) {
      a[i] = 7+i;
    }
    response.writeResponse(a);
    if (stream.readable && stream.writable) {
      setup(stream);
    }
  });
}).listen(502); // Run as root!
