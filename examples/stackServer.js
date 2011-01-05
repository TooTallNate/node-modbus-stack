var Stack = require('stack');
var FC = require('modbus-stack').FUNCTION_CODES;

// We re-define Stack's "errorHandler" so that it works with the MODBUS API
Stack.errorHandler = function(request, response, err) {
  var errCode = err && err.errno ? err.errno : 1;
  console.log("responding with exception: " + errCode);
  response.writeException(errCode);
}

// The MODBUS Server class and Stack work well together:
require('modbus-stack/server').createServer(
  Stack(
    // Handle "Read Coils" (well, we just call `next()`...)
    functionCode(FC.READ_COILS, function(req, res, next) {
      console.log('Got request for "Read Coils", but passing it on...');
      next();
    }),
    // Handle "Read Input Registers"
    functionCode(FC.READ_INPUT_REGISTERS, function(req, res, next) {
      console.log('Got "Read Input Registers" request [ ' + req.startAddress + "-" + req.quantity + ' ]');
      var resp = new Array(req.quantity);
      for (var i=0; i < req.quantity; i++) {
        resp[i] = req.startAddress + i;
      }
      res.writeResponse(resp);
    })
  )
).listen(502);

// A Convience function to handle a MODBUS "Function Code"
function functionCode(fc, callback) {
  return function(req, res, next) {
    req.functionCode === fc ?
      callback.apply(this, arguments) :
      next();
  }
}
