node-modbus-stack
=================
### A [StreamStack][] implementation of the [MODBUS][Modbus] protocol for [Node][].

This module exposes two concrete `StreamStack` implementations:
`ModbusRequestStack` can be used as a MODBUS client (i.e. Master), and can write
MODBUS compliant requests and listen for the response.
`ModbusResponseStack` can be used to create a MODBUS server (i.e. Slave), by
listening for requests and providing a convenient API to respond with.

[MODBUS][ModbusWiki] is an open building automation protocol that is widely used
in various monitoring and controlling equipment. It's used with a variety of
different transports, including TCP.

Currently only communication through the TCP protocol is supported, however
RS-485 serial support should be possible with [node-serialport]. I haven't
had a chance to look into it yet.


A MODBUS Master (Client)
------------------------

You will need to know which _Function Code_ (defined in the MODBUS specification)
you are invoking on the remote MODBUS slave. In this example, we'll request to
read from the current values of the first 50 __Input Registers__ on the slave:

    // 'RIR' contains the "Function Code" that we are going to invoke on the remote device
    var RIR = require('modbus-stack').FUNCTION_CODES.READ_INPUT_REGISTERS;
    
    // IP and port of the MODBUS slave, default port is 502
    var client = require('modbus-stack/client').createClient(502, '10.0.1.50');
    
    // 'req' is an instance of the low-level `ModbusRequestStack` class
    var req = client.request(RIR, // Function Code: 4
                             0,    // Start at address 0
                             50);  // Read 50 contiguous registers from 0
    
    // 'response' is emitted after the entire contents of the response has been received.
    req.on('response', function(registers) {
      // An Array of length 50 filled with Numbers of the current registers.
      console.log(registers);
      client.end();
    });


A MODBUS Slave (Server)
-----------------------

`node-modbus-stack` makes it dead simple to create a compliant MODBUS Slave (or Server)
written in pure JavaScript. Here's an example of a server that would respond to the
request above:

    var FC = require('modbus-stack').FUNCTION_CODES;
    
    // 'handlers' is an Object with keys containing the "Function Codes" that your MODBUS
    // server will handle. Anything function code requested without a handler defined here
    // will have the Server transparently respond with Exception Code 1 ("Illegal Function")
    var handlers = {};
    
    // Define a handler for "Read Input Registers". We'll just respond with the register
    // number requested. In a real-world situation, you'd probably look up these values from
    // a database, etc.
    handlers[FC.READ_INPUT_REGISTERS] = function(request, response) {
      var start = request.startAddress;
      var length = request.quantity;
      
      var resp = new Array(length);
      for (var i=0; i<length; i++) {
        resp[i] = start + i;
      }
      response.writeResponse(resp);
    }

    require('modbus-stack/server').createServer(handlers).listen(502);

A "catch-all" function can be passed to `createServer()` instead of a "handlers" object, if you'd
rather have a single callback invoked for _all_ MODBUS requests. Just be sure to call
`writeException()` manually for any "Function Codes" your server isn't going to handle.


[StreamStack]: http://github.com/TooTallNate/node-stream-stack
[node-serialport]: https://github.com/voodootikigod/node-serialport
[ModbusWiki]: http://en.wikipedia.org/wiki/Modbus
[Modbus]: http://www.modbus.org
[Node]: http://nodejs.org
