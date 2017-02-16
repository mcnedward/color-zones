var express = require('express');
var app = express();
var fs = require("fs");

app.use(express.static('views'));
app.use(express.static(__dirname + '/public'));
app.use(express.static('tz_json'));

app.get('/api/mapbounds', function(req, res) {
  var fileName = __dirname + '/public/tz_json/bounding_boxes.json';
  fs.readFile(fileName, 'utf8', function (err, data) {
    // TODO Handle errors!
    if (err) throw err;
    res.setHeader('content-type', 'application/json');
    res.send(JSON.stringify(data));
  });
})

app.listen(3000, function() {
  console.log('color app listening on port 3000!');
})
