var net = require('net');
var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

/* Streamlined TCP MODBUS server class. Can be used to respond to MODBUS requests
 * from TCP clients. `handlers` can be a function which is invoked for every
 * "request" event, or an Object with keys being the Function Codes your server
 * is going to handle. 
 */
function Server (handlers) {
  net.Server.call(this, this._setupConn);
  if (typeof handlers == 'function') {
    this.on('request', handlers);
  } else {
    this.on('request', this._handler);
    this.handlers = handlers || {};
  }
}
require('util').inherits(Server, net.Server);
module.exports = Server;

Server.prototype._setupConn = function(stream) {
  var self = this;
  var response = new modbus.ModbusResponseStack(stream);
  response.on('request', function(request) {
    self.emit('request', request, response);
    if (stream.readable && stream.writable) {
      self._setupConn(stream);
    }
  });
}

// Called for every 'request' event, when a "handlers" Object was passed.
Server.prototype._handler = function(request, response) {
  if (request.functionCode in this.handlers) {
    this.handlers[request.functionCode].call(this, request, response);
  } else {
    response.writeException(1);
  }
}

// Convenience function to create a MODBUS Server.
function createServer (handlers) {
  return new Server(handlers);
}
Server.createServer = createServer;


// The pattern of 'startAddress' and 'quantity' is used by a lot of
// MODBUS functions, and can be re-used in the code.
function parseTwoWord16be(first, second) {
  return function(bufferlist) {
    return Binary(bufferlist)
      .getWord16be(first)
      .getWord16be(second)
      .end().vars;
  }
}

var no_parameters = function() { return {}; }
var startAddress_quantity = parseTwoWord16be('startAddress', 'quantity');
var address_value = parseTwoWord16be('address', 'value');

Server.REQUESTS = {
  // READ_COILS
  1: startAddress_quantity,
  // READ_DISCRETE_INPUTS
  2: startAddress_quantity,
  // READ_HOLDING_REGISTERS
  3: startAddress_quantity,
  // READ_INPUT_REGISTERS
  4: startAddress_quantity,
  // WRITE_SINGLE_COIL
  5: function(bufferlist) {
    var rtn = address_value.call(this, bufferlist);
    rtn.value = rtn.value === 0xff00;
    return rtn;
  },
  // WRITE_SINGLE_REGISTER
  6: address_value,
  // READ_EXCEPTION_STATUS (Serial Line Only)
  7: no_parameters,
  // GET_COMM_EVENT_COUNTER (Serial Line Only)
  11: no_parameters,
  // GET_COMM_EVENT_LOG (Serial Line Only)
  12: no_parameters,
  // REPORT_SLAVE_ID (Serial Line Only)
  17: no_parameters
};

Server.RESPONSES = {
  // READ_INPUT_REGISTERS
  4: function(registers) {
    if (!Array.isArray(registers) || registers.length != this.request.quantity) {
      throw new Error('Expected to write an "Array" of length "'+this.request.quantity+'"');
    }
    var i=0, l=registers.length, put = Put()
      .word8(registers.length*2);
    for (; i<l; i++) {
      put.word16be(registers[i]);
    }
    return put.buffer();
  }
};
