var Color = function(renderer) {
  var self = this;

  const width = 1024, height = 512;
  const zoom = 1;
  const centerLat = 0;
  const centerLon = 0;
  const accessToken = "pk.eyJ1IjoiZWR3YXJkbWNuZWFseSIsImEiOiJjaXo3bmszcG0wMGZzMzNwZGd2d2szdmZqIn0.1ycNDtJkOf2K0bBa6tG04g";
  const mapUrl = "https://api.mapbox.com/styles/v1/mapbox/streets-v8/static/" + centerLon + "," + centerLat + "," + zoom + ",0,0/" + width + "x" + height +"?access_token=" + accessToken;

  // 27.269854, -82.460850 - Sarasota, FL
  var lat = 27.269854;
  var lon = -82.460850;

  self.currentTime = ko.observable();
  self.backgroundColor = ko.observable();
  self.width = ko.observable(width + 'px');
  self.height = ko.observable(height + 'px');

  // Load the map image first
  fetch(mapUrl).then(function(response) {
    if (response.ok) {
      renderer.drawImage(mapUrl, function() {
        // Map is rendered, so I can draw the bounds now
        loadMapBounds();
      });
    }
  });

  // Load the map bounds
  function loadMapBounds() {
    fetch('/api/mapbounds').then(function(response) {
      if (response.ok) {
        response.json().then(function(json) {
          createBounds();
        });
      }
    });
  }

  function createBounds() {
    var centerX = mercX(centerLon);
    var centerY = mercY(centerLat);

    var x = mercX(lon) - centerX;
    var y = mercY(lat) - centerY;

    renderer.ellipse(x, y, 5, 5);
  }

  function mercX(lon) {
    lon = toRadians(lon);
    var a = (256 / Math.PI) * Math.pow(2, zoom);
    var b = lon + Math.PI;
    return a * b;
  }

  function mercY(lat) {
    lat = toRadians(lat);
    var a = (256 / Math.PI) * Math.pow(2, zoom);
    var b = Math.tan(Math.PI / 4 + lat / 2);
    var c = Math.PI - Math.log(b);
    return a * c;
  }

  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  function adjustTime(interval) {
    if (interval < 10) {
      interval = "0" + interval;
    }
    return interval;
  }
  
  setInterval(() => {
    var current = moment().tz('America/Los_Angeles');
    var hours = adjustTime(current.hours());
    var minutes = adjustTime(current.minutes());
    var seconds = adjustTime(current.seconds());

    self.currentTime(current.format('HH:mm:ss'));

    var hex = (seconds * 10000) + (minutes * 100) + hours;
    var color = "#" + hex;
    self.backgroundColor(color);
  }, 1000);
};
