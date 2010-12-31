var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

exports.REQUESTS = {
  // READ_INPUT_REGISTERS
  4: function(startAddress, quantity) {
    return Put()
      .word16be(startAddress)
      .word16be(quantity)
      .buffer();
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
