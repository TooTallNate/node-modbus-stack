var FC = require('modbus-stack').FUNCTION_CODES;

require('modbus-stack/server').createServer(
  require('stack')(
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
    }),
    // If all else fails, respond with "Illegal Function"
    illegalFunction
  )
).listen(502);


function functionCode(fc, callback) {
  return function(req, res, next) {
    req.functionCode === fc ?
      callback.apply(this, arguments) :
      next();
  }
}

function illegalFunction(request, response, err) {
  var errCode = err && err.errno ? err.errno : 1;
  console.log("responding with exception: " + errCode);
  response.writeException(errCode);
}
