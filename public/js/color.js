var Color = function(renderer) {
  var self = this;

  const width = 1024, height = 512;
  const zoom = 1;
  const centerLat = 20;
  const centerLon = 10;
  const accessToken = "pk.eyJ1IjoiZWR3YXJkbWNuZWFseSIsImEiOiJjaXo3bmszcG0wMGZzMzNwZGd2d2szdmZqIn0.1ycNDtJkOf2K0bBa6tG04g";
  const mapUrl = "https://api.mapbox.com/styles/v1/mapbox/streets-v8/static/" + centerLon + "," + centerLat + "," + zoom + ",0,0/" + width + "x" + height +"?access_token=" + accessToken;

  // 27.269854, -82.460850 - Sarasota, FL
  var lat = 27.269854;
  var lon = -82.460850;
  
  var gmaps = google.maps;

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
          var boundingBoxes = JSON.parse(json);
          
          var box = boundingBoxes[0];
          var zones = box.zoneCentroids;
          var zoneName = box.name.replace('/', '-');

          fetch('/api/polygons/' + zoneName).then(function(response) {
            if (response.ok) {
              response.json().then(function(json) {
                var data = JSON.parse(json);

                var polygons = data.polygons;
                var coords = [];
                for (var i = 0; i < polygons.length; i++) {
                  var polygon = polygons[i];
                  // Loop through all the points in the polygon
                  // Every 2 points are a lat & lon pair
                  for (var j = 0; j < polygon.points.length; j += 2) {
                    var point = polygon.points.slice(j, j + 2);
                    var latLng = new LatLng(point[0], point[1]);
                    coords.push(latLng);
                  }
                }

                // http://www.geeksforgeeks.org/convex-hull-set-2-graham-scan/
                // Global point
                var p0;

                // The first step is to find the point P with the lowest latitude (y)
                var minLatCoord = coords[0].lat, min = 0;
                for (var i = 0; i < coords.length; i++) {
                  var lat = coords[i].lat;
                  if ((lat < min) || (minLatCoord == lat && coords[i].lng < coords[min].lng)) {
                    minLatCoord = coords[i].lat;
                    min = i;
                  }
                }
                var temp = coords[0];
                coords[0] = minLatCoord;
                coords[min] = temp;

                p0 = coords[0];

                // Next, sort the points in increasing order of the angle they and P make with the x-axis
                coords.sort(function(a, b) {
                  var slopeA = (a.lat - minLatCoord.lat) / (a.lng - minLatCoord.lng); 
                  var slopeB = (b.lat - minLatCoord.lat) / (b.lng - minLatCoord.lng);
                  return slopeA - slopeB;
                });

                function ccw(p1, p2, p3) {
                  return (p2.lng - p1.lng) * (p3.lat - p1.lat) - (p2.lat - p1.lat) * (p3.lng - p1.lng);
                }

                var points = [];
                var m = 1;
                for (i = 1; i < coords.length; i++) {
                  while (ccw(coords[m - 1], coords[m], coords[i]) <= 0) {
                    // Made a right, or clockwise, turn, so remove the second-to-last point
                    // coords.splice(m, 1);
                    // i--;
                    if (m > 1) {
                      m--;
                      continue;
                    } else if (i == coords.length) {
                      break;
                    } else {
                      i++;
                    }
                  }
                  coords[m] = coords[i];
                  m++;
                  points.push(coords[m]);
                }

                createGeoPolygon(points);
                // for (var i = 0; i < points.length; i++) {
                //   createGeoDot(points[i].lat, points[i].lng);
                // }

              });
            }
          });

          // for (var key in zones) {
          //   if (!zones.hasOwnProperty(key)) continue;
          //   var zoneCoord = zones[key];
          //   createGeoDot(zoneCoord[0], zoneCoord[1]);
          // }
        });
      }
    });
  }

  function createGeoPolygon(points) {
    var geoPoints = [];
    for (var i = 0; i < points.length; i++) {
      var centerX = mercX(centerLon);
      var centerY = mercY(centerLat);

      var x = mercX(points[i].lng) - centerX;
      var y = mercY(points[i].lat) - centerY;

      geoPoints.push({x: x, y: y});
    }
    renderer.polygon(geoPoints);
  }

  function createGeoDot(lat, lon) {
    var centerX = mercX(centerLon);
    var centerY = mercY(centerLat);

    var x = mercX(lon) - centerX;
    var y = mercY(lat) - centerY;

    renderer.ellipse(x, y, 3, 3);
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
