var FC = require('modbus-stack').FUNCTION_CODES;

var client = require('modbus-stack/client').createClient(502);

var req = client.request(FC.READ_COILS, 50, 3);

req.on('response', function(err, response) {
  if (err) throw err;
  console.log(response);
  client.end();
});
