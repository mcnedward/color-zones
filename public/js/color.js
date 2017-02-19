var Color = function (renderer) {
  var self = this;

  const width = 1024, height = 512;
  const zoom = 1;
  const centerLat = 20;
  const centerLng = 10;
  const accessToken = "pk.eyJ1IjoiZWR3YXJkbWNuZWFseSIsImEiOiJjaXo3bmszcG0wMGZzMzNwZGd2d2szdmZqIn0.1ycNDtJkOf2K0bBa6tG04g";
  const mapUrl = "https://api.mapbox.com/styles/v1/mapbox/streets-v8/static/" + centerLng + "," + centerLat + "," + zoom + ",0,0/" + width + "x" + height + "?access_token=" + accessToken;
  const color = '#a01111';
  const gmaps = google.maps;

  // 27.269854, -82.460850 - Sarasota, FL
  var lat = 27.269854;
  var lng = -82.460850;

  var timeZones = [];

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

        function getTimeZone(hoverRegion) {
          // Each hover region contains a hover region array of points
          var coords = [];
          for (var i = 0; i < hoverRegion.hoverRegion.length; i++) {
            // Every two points in the hover region are the lat and lng
            var region = hoverRegion.hoverRegion[i];
            for (var j = 0; j < region.points.length; j += 2) {
              var pointPair = region.points.slice(j , j + 2);
              var xy = getXY(pointPair[0], pointPair[1]);
              coords.push(xy);  
            }
          }
          return new TimeZone(hoverRegion.name, coords);
        }

        for (var i = 0; i < hoverRegions.length; i++) {
          var timeZone = getTimeZone(hoverRegions[i]);
          loadZonePolygons(timeZone);
          timeZones.push(timeZone);
        }

        // All time zones are loaded, so we can now load the bounding boxes
        loadBoundingBoxes();

        // Trigger the intervals to draw all the zones
        for (var i = 0; i < timeZones.length; i++) {
          drawZone(timeZones[i]);
        }
      })
    })
  }

  // Load the bounding boxes
  function loadBoundingBoxes() {
    fetch('/api/map-bounds').then(function(response) {
      if (!response.ok) {
        // TODO Handle error here
        return;
      }
      response.json().then(function(json) {
        var boundingBoxes = JSON.parse(json);
        for (var i = 0; i < boundingBoxes.length; i++) {
          var box = boundingBoxes[i];
          for (var j = 0; j < timeZones.length; j++) {
            if (timeZones[j].matchesId(box.name)) {
              var xyMin = getXY(box.boundingBox.ymin, box.boundingBox.xmin);
              var xyMax = getXY(box.boundingBox.ymax, box.boundingBox.xmax);
              timeZones[j].boundingBox = {
                xyMin: xyMin,
                xyMax: xyMax
              }
              break;
            }
          }
        }
      });
    });
  }

  // Load the polygons for a time zone
  function loadZonePolygons(timeZone) {
    var zoneName = timeZone.name.replace(/\/|_/g, '-');
    fetch('/api/polygons/' + zoneName).then(function (response) {
      if (!response.ok) {
        // TODO Handle error here
        return;
      }
      response.json().then(function (json) {
        var data = JSON.parse(json);
        var polygons = [];
        var centroidIndex = 0, maxPoints = 0;

        for (var i = 0; i < data.polygons.length; i++) {
          // Loop through all the points in the polygon
          // Every 2 points are a lat & lng pair
          var polygon = data.polygons[i];
          var points = [];

          for (var j = 0; j < polygon.points.length; j += 2) {
            var point = polygon.points.slice(j, j + 2);
            var xy = getXY(point[0], point[1]);
            points.push(xy);
          }
          polygons.push(new Polygon(polygon.name, points, getXY(polygon.centroid[1], polygon.centroid[0])));

          // Check to see if this polygon is the largest by seeing if it has the most edges
          // Use the largest polygon's centroid as the timezone centroid
          if (points.length > maxPoints) {
            maxPoints = points.length;
            centroidIndex = i;
          }
        }
        timeZone.polygons = polygons;
        timeZone.centroidPolygon = polygons[centroidIndex];
      });
    });
  }

  function drawZone(timeZone) {
    setInterval(() => {
      var current = moment().tz(timeZone.name);
      var hours = adjustTime(current.hours());
      var minutes = adjustTime(current.minutes());
      var seconds = adjustTime(current.seconds());

      self.currentTime(current.format('HH:mm:ss'));

      var hex = hours + minutes + seconds;
      var color = "#" + hex;
      
      renderer.polygon(timeZone.coords, color);
      var textX = timeZone.centroidPolygon.centroid.x;
      var textY = timeZone.centroidPolygon.centroid.y;
      renderer.text(textX, textY, current.format('HH:mm:ss'), '#ffffff', timeZone.centroidPolygon.id());
    }, 1000);
  }

  function getXY(lat, lng) {
    var centerX = mercX(centerLng);
    var centerY = mercY(centerLat);
    var x = mercX(lng) - centerX;
    var y = mercY(lat) - centerY;
    return {x: x, y: y};
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
    return interval.toString();
  }

  renderer.addMouseOverEvent(function(event) {
    var mousePosition = renderer.getPosition(event);
    var mouseX = mousePosition.x;
    var mouseY = mousePosition.y;
    console.log('MouseX: ' + mouseX + ' MouseY: ' + mouseY);
    for (var i = 0; i < timeZones.length; i++) {
      var zone = timeZones[i];
      var boundingBox = zone.boundingBox;
      if (mouseY > boundingBox.xyMin.y && mouseY < boundingBox.xyMax.y && mouseX > boundingBox.xyMin.x && mouseX < boundingBox.xyMax.x) {
        // Mouse is in the zone bounds
        console.log('You are in the ' + zone.name + ' zone!');
        return;
      }
    }
  });
};
