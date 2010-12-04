var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

exports.REQUESTS = {
  4: function(startAddress, quantity) {
    return Put().word8(4).word16be(startAddress).word16be(quantity).buffer();
  }
};

exports.RESPONSES = {
  4: function(bufferlist) {
    var binary = Binary(bufferlist)
      .getWord8('functionCode')
      .getWord8('byteCount').end();
    binary.vars.length=0;
    for (var i=0; i<binary.vars.byteCount; i++) {
      binary.getWord16be(i+"");
      binary.vars.length++;
    }
    binary.end();
    return binary.vars;
  }
};

