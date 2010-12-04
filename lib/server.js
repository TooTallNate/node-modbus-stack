var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

exports.REQUESTS = {
  // READ_INPUT_REGISTERS
  4: function(bufferlist) {
    return Binary(bufferlist)
      .getWord8('functionCode')
      .getWord16be('startAddress')
      .getWord16be('quantity')
      .end().vars;
  }
};

exports.RESPONSES = {
  // READ_INPUT_REGISTERS
  4: function(registers) {
    if (!Array.isArray(registers)) throw new Error('"Read Input Registers" expects to write an Array of Numbers');
    var i=0, l=registers.length, put = Put()
      .word8(4)
      .word8(registers.length*2);
    for (; i<l; i++) {
      put.word16be(registers[i]);
    }
    return put.buffer();
  }
};

