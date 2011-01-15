# API

## var mb = require('modbus-stack')

The main module for `node-modbus-stack` contains the low-level StreamStack subclasses:
`ModbusRequestStack` and `ModbusResponseStack`, as well as various contansts related to
the protocol.

### mb.FUNCTION_CODES

An Object containing the defined Modbus "Function Codes", with keys in a human-readable
format, intended to be used in place of the actual number of the function code in your code.

    mb.FUNCTION_CODES.READ_COILS;
      // returns 1
    mb.FUNCTION_CODES.READ_INPUT_REGISTERS;
      // returns 4

### mb.EXCEPTION_CODES

An Object containing the defined Modbus "Exception Codes", which are used by a Slave
(server) in the case of an exception occuring during execution of a Function Code request.

    mb.EXCEPTION_CODES.ILLEGAL_FUNCTION;
      // returns 1


### var req = new mb.ModbusRequestStack(stream)

A `StreamStack` subclass that handles the client-side (Master) of the Modbus protocol.

`ModbusRequestStack` is a low-level API for Modbus requests. It is only good for _1 single_
request/response interaction.

It's recommended to use `mbc.createClient()` for a high-level TCP-based Client API.

    var socket = require('net').createConnection(502);
    var req = new mb.ModbusRequestStack(socket);

### req.request(functionCode, [arg1, arg2, arg3, ...], [callback])

Invokes a Modbus request on the parent Stream. "functionCode" must be the Function Code
that you are invoking. The (sometimes optional) "arg" arguments are specific to the
Function Code being invoked. "callback" can be an optional callback Function to invoke
when either an "error" or "response" occur.

    req.request(mb.FUNCTION_CODES.READ_COILS, 0, 5, function(err, res) {
      if (err) throw err;
      console.log(res);
        // [ true, false, true, false, true, true ]
    });

#### Event: 'response'

`function(response) { }`

Emitted after the response has been received and parsed. "response" is an Object
with properties dependant on the Function Code that was invoked. In some cases,
an Array instance is returned with the return values.

#### Event: 'error'

`function(error) { }`

Emitted if the remote Modbus Slave responds with an Exception Code, rather than a
successful response.

### var res = new mb.ModbusResponseStack(stream)

A `StreamStack` subclass that handles the server-side (Slave) of the Modbus protocol.

`ModbusResponseStack` is a low-level API for handling Modbus requests and returning
proper responses, or exceptions. It is only good for _1 single_ request/response
interaction.

It's recommended to use `mbs.createServer()` for a simpler, high-level API for writing
a Modbus-compliant server.

    require('net').createServer(function(socket) {
      var res = new mb.ModbusResponseStack(socket);
    }).listen(502);

### res.writeResponse([arg1, arg2, ...])

Writes out a Modbus response after a `request` event has been received. The arguments
passed are dependant on the Function Code being requested. Sometimes, no arguments are
necessary.

    var results = [4, 0, 5, 10, 2];
    res.writeResponse(results);

### res.writeException(exceptionCode)

Writes out a Modbus exception response after a `request` event has been received.
"exceptionCode" must be the Exception Code you would like to return to the Master.

#### Event: 'request'

`function(request) { }`

Emitted after a Modbus request has been received and parsed. "request" is an object
containing:

 * `functionCode` - The "Function Code" being requested.
 * `transactionId` - The transaction ID. Usually starts at 0 and increments by 1
                     for each subsequent request on a particular socket.
 * `protocolVersion` - The version of the Modbus protocol. This is always 0 for "Modbus/TCP".
 * `unitIdentifier` - The unit ID. To identify which Modbus slave to talk to. This
                      is normally only used for serial-line Modbus, but can be useful
                      if implementing a TCP->Serial Modbus bridge.

As well as any additional parameters relating to the Function Code being requested.


## var mbc = require('modbus-stack/client')

### mbc.createClient(port, [host])

Creates and return a new `Client` instance, which is the preferred method of
MODBUS master communication over TCP. The default MODBUS port is __502__.
`mbc.Client` is a subclass of `net.Socket`.

    var client = mbc.createClient(502, '192.168.0.1')

### client.request(functionCode, [arg1, arg2, arg3, ...], [callback])

Makes a MODBUS request to the remote MODBUS slave. Same as `ModusRequestStack#request()`.
Returns a new instance of `ModbusRequestStack`.


### mbc.REQUESTS

An Object containing the individual handlers for each implemented Function Code,
from the perspective of a Client making a Modbus request.

### mbc.RESPONSES

An Object containing the individual handlers for each implemented Function Code,
from the perspective of a Client receiving the response after a request.


## var mbs = require('modbus-stack/server')

### mbs.createServer(handlers)

Creates and returns a new `Server` instance, which is the preferred method of
MODBUS Slave communication over TCP. `handlers` should be an Object with
handlers for each individual Function Code your server will handle. 
Any Function Code requests received that doesn't have handler defined will have
an Exception Code "Illegal Function" response. Or, `handlers` may be a single
Function instance which is called for _all_ Function Codes. Your handler function
should manually call `writeException()` for any Function Codes you don't care about.

### mbs.REQUESTS

An Object containing the individual handlers for each implemented Function Code,
from the perspective of a Server receiving a request.

### mbs.RESPONSES

An Object containing the individual handlers for each implemented Function Code,
from the perspective of a Server responding to a previous request.
