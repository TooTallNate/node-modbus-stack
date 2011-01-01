var FC = require('modbus-stack').FUNCTION_CODES;

var handlers = {};

handlers[FC.READ_COILS] = function(request, response) {
  response.writeException(2);
}

handlers[FC.READ_INPUT_REGISTERS] = function(request, response) {
  console.log(request);
  setTimeout(function() {
  response.writeResponse(new Array(request.quantity));
  }, 800);
}

require('modbus-stack/server').createServer(handlers).listen(502);
