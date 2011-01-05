require('modbus-stack');
require('modbus-stack/server').createServer(
  require('stack')(
    // Handle "Read Coils" (well, we just call `next()`...)
    functionCode(1, function(req, res, next) {
      console.log("Got request for '1', but passing it on...");
      next();
    }),
    // Handle "Read Input Registers"
    functionCode(4, function(req, res, next) {
      var resp = new Array(req.quantity);
      for (var i=0; i < req.quantity; i++) {
        resp[i] = req.startAddress + i;
      }
      res.writeResponse(resp);
    }),
    // If all else fails, call our "Illegal Function" response.
    illegalFunction
  )
).listen(502);


function functionCode(fc, callback) {
  return function(req, res, next) {
    if (req.functionCode === fc) {
      callback.apply(this, arguments);
    } else {
      next();
    }
  }
}

function illegalFunction(request, response, err) {
  var errCode = err && err.errno ? err.errno : 1;
  console.log("responding with exception: " + errCode);
  response.writeException(errCode);
}
