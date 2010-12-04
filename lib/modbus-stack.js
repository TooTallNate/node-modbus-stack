var StreamStack = require('stream-stack').StreamStack;
var Put = require('put');
var BufferList = require('bufferlist').BufferList;
var Binary = require('bufferlist/binary').Binary;
var inherits = require('util').inherits;
var client = require('./client');
var server = require('./server');
var slice = Array.prototype.slice;

// The length of the "MODBUS Application Protocol" header.
const MBAP_LENGTH = 7;

exports.EXCEPTION_CODES = {
  1 : 'Illegal Function',
  2 : 'Illegal Data Address',
  3 : 'Illegal Data Value',
  4 : 'Slave Device Failure',
  5 : 'Acknowledge',
  6 : 'Slave Device Busy',
  8 : 'Memory Parity Error',
  10: 'Gateway Path Unavailable',
  11: 'Gateway Target Path Failed to Respond'
};

exports.FUNCTION_CODES = {
  READ_COILS:               1,
  READ_DISCRETE_INPUTS:     2,
  READ_HOLDING_REGISTERS:   3,
  READ_INPUT_REGISTERS:     4,
  WRITE_SINGLE_COIL:        5,
  WRITE_SINGLE_REGISTER:    6,
  READ_EXCEPTION_STATUS:    7, // Serial Line only
  DIAGNOSTICS:              8, // Serial Line only
  PROGRAM_484:              9,
  POLL_484:                 10,
  GET_COMM_EVENT_COUNTER:   11,// Serial Line only
  GET_COMM_EVENT_LOG:       12,// Serial Line only
  PROGRAM_CONTROLLER:       13,
  POLL_CONTROLLER:          14,
  WRITE_MULTIPLE_COILS:     15,
  WRITE_MULTIPLE_REGISTERS: 16,
  REPORT_SLAVE_ID:          17,// Serial Line only
  PROGRAM_884_M84:          18,
  RESET_COMM_LINK:          19,
  READ_FILE_RECORD:         20,
  WRITE_FILE_RECORD:        21,
  MASK_WRITE_REGISTER:      22,
  READ_WRITE_MULTIPLE_REGISTERS:23,
  READ_FIFO_QUEUE:          24,
  ENCAPSULATED_INFERFACE_TRANSPORT:43
};

function ModbusRequestStack(stream) {
  StreamStack.call(this, stream);
  this.bufferlist = new BufferList();
  this.stream.on('data', this._onData.bind(this));
  this.stream.on('end', this._onEnd.bind(this));
  this._reqNum = 1;
}
inherits(ModbusRequestStack, StreamStack);
exports.ModbusRequestStack = ModbusRequestStack;

// The 'version' of the MODBUS protocol. Only version 0 is defined.
ModbusRequestStack.prototype.protocolVersion = 0;

// The unit identifier to request. This is usually used in over serial lines, not so much over TCP.
ModbusRequestStack.prototype.unitIdentifier = 1;

// Make a MODBUS request for a given 'function code'.
ModbusRequestStack.prototype.request = function(functionCode) {
  this.functionCode = functionCode;
  var argsLen = arguments.length;
  if (argsLen > 1) {
    var callback = arguments[argsLen-1];
    if (typeof(callback) == 'function') {
      this.on('error', function(e) {
        callback(e);
      });
      this.once('response', function(res) {
        callback(null, res);
      });
    }
  }
  var args = slice.call(arguments, 1, argsLen-1);
  var pdu = client.REQUESTS[functionCode].apply(this, args);
  var mbap = Put()
    .word16be(this._reqNum++)
    .word16be(this.protocolVersion)
    .word16be(pdu.length+1)
    .word8(this.unitIdentifier)
    .put(pdu)
    .write(this.stream);
}

ModbusRequestStack.prototype._onData = function(chunk) {
  if (chunk) this.bufferlist.push(chunk);
  if (!this.responseHeader && this.bufferlist.length >= MBAP_LENGTH) {
    this.responseHeader = readMBAP(this.bufferlist);
    this.bufferlist.advance(MBAP_LENGTH);
    // Re-check the bufferlist to see if we have the rest of the response already
    this._onData();
  } else if (this.bufferlist.length >= (this.responseHeader.length-1)) {
    // We have the complete response.
    var response = client.RESPONSES[this.functionCode](this.bufferlist);
    this.bufferlist.advance(this.responseHeader.length-1);
    this.emit('response', response);
    // Modbus request/response complete!
  }
}

ModbusRequestStack.prototype._onEnd = function() {
  console.log('got remote "end" event');
}

function readMBAP(bufferlist) {
  return Binary(bufferlist)
    .getWord16be('transactionId')
    .getWord16be('protocolVersion')
    .getWord16be('length')
    .getWord8('unitIdentifier')
    .end().vars;
}

