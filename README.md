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


A MODBUS Request
----------------

You will need to know which _function code_ (defined in the MODBUS specification)
you are invoking on the MODBUS slave. In this example, we'll request to read
from the current values of the first 50 __Input Registers__ on the slave:

    var net = require('net');
    var ModbusRequestStack = require('modbus-stack').ModbusRequestStack;
    
    // IP and port of the MODBUS slave, default port is 502.
    var conn = net.createConnection(502, '10.0.1.50');
    
    var req = new ModbusRequestStack(conn);
    req.request(0x04, // Function Code: 4
                0,    // Start at address 0
                50);  // Read 50 contiguous registers from 0
    
    // 'response' is emitted after the entire contents of the response has been received.
    req.on('response', function(registers) {
      // An Array of length 50 filled with Numbers of the current registers.
      console.log(registers);
    });

More to come...


[StreamStack]: http://github.com/TooTallNate/node-stream-stack
[node-serialport]: https://github.com/voodootikigod/node-serialport
[ModbusWiki]: http://en.wikipedia.org/wiki/Modbus
[Modbus]: http://www.modbus.org
[Node]: http://nodejs.org

