require('colors');
var FUNCTION_CODES = require('modbus-stack').FUNCTION_CODES;
var ModbusRequestStack = require('modbus-stack').ModbusRequestStack;

var conn = require('net').createConnection(502, '10.1.10.134');

// A 'client' instance is good for 1 single request/response transaction.
var client = new ModbusRequestStack(conn);

// We're gonna call for the "Read Input Registers" function on the remote
// MODBUS device, requesting to read the current values of the first 4 registers.
var fc = FUNCTION_CODES.READ_INPUT_REGISTERS;
var startAddress = 0;
var numToRead = 4;
client.request(fc, startAddress, numToRead, function(err, response) {
  if (err) {
    throw err;
  }
  
  response.forEach(function(register, i) {
    console.log(
      ("Sensor " + String(startAddress + i).bold + ":\t").blue +
      (String(register/10).bold + '\u00B0F').green
     );
  });

  // Close the connection
  conn.end();
});

