var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var netStream = require('net').Stream;
var FUNCTION_CODES = modbus.FUNCTION_CODES;

/* TCP MODBUS Client interface, as it's the most usual use-case. */
function Client () {
  if (!(this instanceof Client)) return new Client();
  netStream.call(this);
}
require('util').inherits(Client, netStream);
module.exports = Client;

// Causes the client instance to make a MODBUS request to the remote host.
// This is done by creating a new ModbusRequetStack instance on `this`.
//   TODO: Either pipelining or throw an error if more than one
//         instance is active at a time.
Client.prototype.request = function() {
  var req = new modbus.ModbusRequestStack(this);
  req.request.apply(req, arguments);
  return req;
}

// Convenience function to create a new Client instance and have it
// `connect()` to the specified remote address.
Client.createClient = function(port, host) {
  var s = new Client();
  s.connect(port, host);
  return s;
}



// This pattern is (re)used by a lot of the basic MODBUS commands.
function putTwoWord16be(first, second) {
    return Put()
      .word16be(first)
      .word16be(second)
      .buffer();
}

Client.REQUESTS = {
  // READ_COILS
  1: putTwoWord16be,
  // READ_DISCRETE_INPUTS
  2: putTwoWord16be,
  // READ_HOLDING_REGISTERS
  3: putTwoWord16be,
  // READ_INPUT_REGISTERS
  4: putTwoWord16be,
  // WRITE_SINGLE_REGISTER:
  5: function(address, value) {
    if (typeof value !== 'boolean') throw new Error('"Write Single Coil" expects a \'boolean\' value');
    return putTwoWord16be(address, value ? 0xff00 : 0x0000);
  }
};

Client.RESPONSES = {
  // READ_INPUT_REGISTERS
  4: function(bufferlist) {
    var rtn = [];
    var binary = Binary(bufferlist)
      .getWord8('byteLength').end();
    rtn.byteLength = binary.vars.byteLength;
    for (var i=0, l=binary.vars.byteLength/2; i<l; i++) {
      binary.getWord16be("val");
      rtn.push(binary.end().vars.val);
    }
    return rtn;
  }
};
