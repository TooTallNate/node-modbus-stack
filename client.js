var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var netStream = require('net').Stream;
var FUNCTION_CODES = modbus.FUNCTION_CODES;
var BitArray = require('node-bitarray');

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
  // WRITE_SINGLE_COIL
  5: function(address, value) {
    if (typeof value !== 'boolean') throw new Error('"Write Single Coil" expects a \'boolean\' value');
    return putTwoWord16be(address, value ? 0xff00 : 0x0000);
  },
  // WRITE_SINGLE_REGISTER
  6: putTwoWord16be,

  // WRITE_MULTIPLE_COILS
  15: function(adress, values) {
    if(values.length < 1 || values.length > 1968) {
      throw new Error('"Write Multiple Coils" expects 1 to 1968 registers');
    }

    values.map(
      function(val) {
        if (typeof val !== 'boolean') throw new Error('"Write Multiple Coils" expects \'boolean\' values');
        return val ? 1 : 0;
      }
    )

    request = Put()
      .word16be(address)
      .word16be(values.length)
      .word8(Math.ceil(values.length/8))
      .put(BitArray.toBuffer(values));

    return request.buffer();
  },

  // WRITE_MULTIPLE_REGISTERS
  16: function(address, values) {
    if(values.length < 1 || values.length > 123) {
      throw new Error('"Write Multiple Registers" expects 1 to 123 registers');
    }

    request = Put()
      .word16be(address)
      .word16be(values.length)
      .word8(values.length*2);

    for(var i=0; i<values.length; i++) {
      request.word16be(values[i]);
    }

    return request.buffer();
  }
};

function readBitArray(bufferlist) {
  var binary = Binary(bufferlist)
    .getWord8('byteCount')
    .end();

  var rtn = [];
  for(var i=0, l=binary.vars.byteCount; i<l; i++) {
    binary.getBuffer("oneByteBuffer", 1).end();
    rtn = rtn.concat(
      BitArray.fromBuffer(binary.vars.oneByteBuffer)
        .reverse() // The LSB of the first data byte contains the output addressed in the query.
        .map(function(val) { return val==1 ? true : false})
    );
  }

  rtn.byteCount = binary.vars.byteCount;
  return rtn;
}

function read16beArray(bufferlist) {
    var binary = Binary(bufferlist)
      .getWord8('byteCount')
      .end();
    
    var rtn = [];
    rtn.byteCount = binary.vars.byteCount;
    for (var i=0, l=binary.vars.byteCount/2; i<l; i++) {
      binary.getWord16be("val");
      rtn.push(binary.end().vars.val);
    }
    return rtn;
  }

function readAddressQuantity(bufferlist) {
  var binary = Binary(bufferlist)
    .getWord16be("address")
    .getWord16be("quantity")
    .end();
  return binary.vars;
}

function readAddressValue(bufferlist) {
  var binary = Binary(bufferlist)
    .getWord16be("address")
    .getWord16be("value")
    .end();
  return binary.vars;
}

Client.RESPONSES = {
  // READ_COILS
  1: readBitArray,
  // READ_DISCRETE_INPUTS,
  2: readBitArray,
  // READ_HOLDING_REGISTERS
  3: read16beArray,
  // READ_INPUT_REGISTERS
  4: read16beArray,
  // WRITE_SINGLE_COIL
  5: function(bufferlist) {
    var rtn = readAddressValue(bufferlist);
    rtn.value = rtn.value ? true : false;
    return rtn;
  },
  // WRITE_SINGLE_REGISTER
  6: readAddressValue, 
  // WRITE_MULTIPLE_COILS
  15: readAddressQuantity,
  // WRITE_MULTIPLE_REGISTERS
  16: readAddressQuantity,
};
