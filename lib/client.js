var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

exports.REQUESTS = {
  // READ_INPUT_REGISTERS
  4: function(startAddress, quantity) {
    return Put().word8(4).word16be(startAddress).word16be(quantity).buffer();
  }
};

exports.RESPONSES = {
  // READ_INPUT_REGISTERS
  4: function(bufferlist) {
    var binary = Binary(bufferlist)
      .getWord8('functionCode')
      .getWord8('byteCount').end();
    binary.vars.length = binary.vars.byteCount;
    for (var i=0, l=binary.vars.length; i<l; i++) {
      binary.getWord16be(i+"");
    }
    binary.end();
    return binary.vars;
  }
};

