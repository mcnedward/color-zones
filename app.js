var express = require('express');
var app = express();
var fs = require('fs');
const environment = 'dev';

app.use(express.static('views'));
// App
var scriptDir;
if (environment === 'dev') {
  scriptDir = '/app';
} else if (environment === 'production') {
  scriptDir = '/public';
}
app.use('/js', express.static(__dirname + '/' + scriptDir + '/js'));
app.use('/css', express.static(__dirname + '/public/css'));
// Modules
app.use('/js', express.static(__dirname + '/node_modules/tether/dist/js'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/knockout/build/output'));
app.use('/js', express.static(__dirname + '/node_modules/moment/min'));
app.use('/js', express.static(__dirname + '/node_modules/moment-timezone/builds'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); 

const mapboxAccessToken = "pk.eyJ1IjoiZWR3YXJkbWNuZWFseSIsImEiOiJjaXo3bmszcG0wMGZzMzNwZGd2d2szdmZqIn0.1ycNDtJkOf2K0bBa6tG04g";

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

app.get('/api/map', function(req, res) {
  var centerLat = req.query.centerLat,
      centerLng = req.query.centerLng,
      zoom = req.query.zoom,
      width = req.query.width,
      height = req.query.height;
  var mapUrl = "https://api.mapbox.com/styles/v1/mapbox/streets-v8/static/" + centerLng + "," + centerLat + "," + zoom + ",0,0/" + width + "x" + height + "?access_token=" + mapboxAccessToken;
  res.send(mapUrl);
})
app.get('/api/map-bounds', function(req, res) {
  var fileName = __dirname + '/tz_json/bounding_boxes.json';
  fileResponse(req, res, fileName);
})
app.get('/api/polygons/:zone', function(req, res) {
  var zone = req.params.zone;
  var fileName = __dirname + '/tz_json/polygons/' + zone + '.json';
  fileResponse(req, res, fileName);
})
app.get('/api/hover-regions', function(req, res) {
  var fileName = __dirname + '/tz_json/hover_regions.json';
  fileResponse(req, res, fileName);
})

app.listen(3000, function() {
  console.log('color app listening on port 3000!');
})
