var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

function putTwoWord16be(first, second) {
    return Put()
      .word16be(first)
      .word16be(second)
      .buffer();
}

exports.REQUESTS = {
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

exports.RESPONSES = {
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
