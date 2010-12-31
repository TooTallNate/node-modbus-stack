var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var modbus = require('./modbus-stack');
var FUNCTION_CODES = modbus.FUNCTION_CODES;

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

exports.REQUESTS = {
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

exports.RESPONSES = {
  // READ_INPUT_REGISTERS
  4: function(registers) {
    if (!Array.isArray(registers)) throw new Error('"Read Input Registers" expects to write an Array of Numbers');
    var i=0, l=registers.length, put = Put()
      .word8(registers.length*2);
    for (; i<l; i++) {
      put.word16be(registers[i]);
    }
    return put.buffer();
  }
};

