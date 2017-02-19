var express = require('express');
var app = express();
var fs = require("fs");

app.use(express.static('views'));
app.use(express.static(__dirname + '/public'));
app.use(express.static('tz_json'));

function fileResponse(req, res, fileName) {
  fs.readFile(fileName, 'utf8', function (err, data) {
    // TODO Handle errors!
    if (err) {
      console.trace('Hmmm... Something went wrong when trying to read the file: ' + err);
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.send(JSON.stringify(data));
  });
}
app.get('/api/mapbounds', function(req, res) {
  var fileName = __dirname + '/public/tz_json/bounding_boxes.json';
  fileResponse(req, res, fileName);
})
app.get('/api/polygons/:zone', function(req, res) {
  var zone = req.params.zone;
  var fileName = __dirname + '/public/tz_json/polygons/' + zone + '.json';
  fileResponse(req, res, fileName);
})
app.get('/api/hover-regions', function(req, res) {
  var fileName = __dirname + '/public/tz_json/hover_regions.json';
  fileResponse(req, res, fileName);
})

app.listen(3000, function() {
  console.log('color app listening on port 3000!');
})
