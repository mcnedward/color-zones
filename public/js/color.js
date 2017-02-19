var Color = function (renderer) {
  var self = this;

  const width = 1024, height = 512;
  const zoom = 1;
  const centerLat = 20;
  const centerLng = 10;
  const accessToken = "pk.eyJ1IjoiZWR3YXJkbWNuZWFseSIsImEiOiJjaXo3bmszcG0wMGZzMzNwZGd2d2szdmZqIn0.1ycNDtJkOf2K0bBa6tG04g";
  const mapUrl = "https://api.mapbox.com/styles/v1/mapbox/streets-v8/static/" + centerLng + "," + centerLat + "," + zoom + ",0,0/" + width + "x" + height + "?access_token=" + accessToken;
  const color = '#a01111';

  // 27.269854, -82.460850 - Sarasota, FL
  var lat = 27.269854;
  var lng = -82.460850;

  var gmaps = google.maps;

  self.currentTime = ko.observable();
  self.backgroundColor = ko.observable();
  self.width = ko.observable(width + 'px');
  self.height = ko.observable(height + 'px');

  // Load the map image first
  fetch(mapUrl).then(function (response) {
    if (response.ok) {
      renderer.drawImage(mapUrl, function () {
        // Map is rendered, so I can draw the bounds now
        loadRegions();
      });
    }
  });

  function loadRegions() {
    fetch('/api/hover-regions').then(function(response) {
      if (!response.ok) {
        // Handle error here
        return;
      }
      response.json().then(function(json) {
        var hoverRegions = JSON.parse(json);

        for (var i = 0; i < hoverRegions.length; i++) {
          var coords = getHoverRegionCoords(hoverRegions[i]);

          createGeoPolygon(coords, color);
        }

        function getHoverRegionCoords(hoverRegion) {
          // Each hover region contains a hover region array of points
          var coords = [];
          for (var i = 0; i < hoverRegion.hoverRegion.length; i++) {
            // Every two points in the hover region are the lat and lng
            var region = hoverRegion.hoverRegion[i];
            for (var j = 0; j < region.points.length; j += 2) {
              var pointPair = region.points.slice(j , j + 2);
              var latLng = new LatLng(pointPair[0], pointPair[1]);
              coords.push(latLng);  
            }
          }
          return coords;
        }
      })
    })
  }

  // Load the map bounds
  function loadMapBounds() {
    fetch('/api/mapbounds').then(function (response) {
      if (response.ok) {
        response.json().then(function (json) {
          var boundingBoxes = JSON.parse(json);

          for (var i = 0; i < 1; i++) {
            var box = boundingBoxes[i];
            var zoneName = box.name.replace(/\/|_/g, '-');

            fetch('/api/polygons/' + zoneName).then(function (response) {
              if (response.ok) {
                response.json().then(function (json) {
                  var data = JSON.parse(json);

                  var polygons = data.polygons;
                  var polygonPoints = [];
                  for (var i = 0; i < polygons.length; i++) {
                    // Loop through all the points in the polygon
                    // Every 2 points are a lat & lng pair
                    var polygon = polygons[i];
                    var points = [];
                    for (var j = 0; j < polygon.points.length; j += 2) {
                      var point = polygon.points.slice(j, j + 2);
                      var latLng = new LatLng(point[0], point[1]);
                      polygonPoints.push(latLng);
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  function drawZones(points) {
    var current = moment().tz('America/Los_Angeles');
    var hours = adjustTime(current.hours());
    var minutes = adjustTime(current.minutes());
    var seconds = adjustTime(current.seconds());

    self.currentTime(current.format('HH:mm:ss'));

    var hex = (seconds * 10000) + (minutes * 100) + parseInt(hours);
    var color = "#" + hex;
    console.log(color)
    createGeoPolygon(points, color);

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
  }

  function createGeoPolygon(points, color) {
    var geoPoints = [];
    for (var i = 0; i < points.length; i++) {
      var centerX = mercX(centerLng);
      var centerY = mercY(centerLat);

      var x = mercX(points[i].lng) - centerX;
      var y = mercY(points[i].lat) - centerY;

      geoPoints.push({ x: x, y: y });
    }
    renderer.polygon(geoPoints, color);
  }

  function createGeoDot(latLng, color) {
    var centerX = mercX(centerLng);
    var centerY = mercY(centerLat);

    var x = mercX(latLng.lng) - centerX;
    var y = mercY(latLng.lat) - centerY;

    renderer.ellipse(x, y, 3, 3, color);
  }

  function mercX(lng) {
    lng = toRadians(lng);
    var a = (256 / Math.PI) * Math.pow(2, zoom);
    var b = lng + Math.PI;
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
};
