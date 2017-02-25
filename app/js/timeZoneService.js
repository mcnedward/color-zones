function TimeZoneService(mapWidth) {
  var self = this;

  const mercUnits = mapWidth / 4;

  // This is an observable that the caller passes in
  // It will be updated as the service finishes each of it's requests
  var _timeZoneObservables;
  var _timeZoneRegionsObservable;
  var _centerLat;
  var _centerLng;
  var _zoom;
  var _errorCallback;

  // These need to be observables from ColorZones
  self.setup = function(centerLat, centerLng, zoom) {
    _centerLat = centerLat;
    _centerLng = centerLng;
    _zoom = zoom;
  };

  self.loadTimeZones = function (errorCallback, _timeZoneObservables, timeZoneRegionsObservable) {
    _errorCallback = errorCallback;
    if (_centerLat === undefined || _centerLng === undefined || _zoom === undefined) {
      _errorCallback('You need to call TimeZoneService.setCenterCoordinates(centerLat, centerLng, zoom) first!');
      return;
    }
    _timeZonesObservable = _timeZoneObservables;
    _timeZoneRegionsObservable = timeZoneRegionsObservable;

    // Load the time zone regions
    fetch('/api/hover-regions').then(function (response) {
      if (!response.ok) {
        _errorCallback('Something went wrong trying to load the time zone regions...');
        return;
      }
      response.json().then(function (json) {
        var hoverRegions = JSON.parse(json);

        function getTimeZone(hoverRegion) {
          // Each hover region contains a hover region array of points
          var coords = [];
          for (var i = 0; i < hoverRegion.hoverRegion.length; i++) {
            // Every two points in the hover region are the lat and lng
            var region = hoverRegion.hoverRegion[i];
            for (var j = 0; j < region.points.length; j += 2) {
              var pointPair = region.points.slice(j, j + 2);
              var xy = getXY(pointPair[0], pointPair[1]);
              coords.push(xy);
            }
          }
          return new TimeZone(hoverRegion.name, coords);
        }

        for (var i = 0; i < hoverRegions.length; i++) {
          var timeZone = getTimeZone(hoverRegions[i]);
          loadZonePolygons(timeZone);
          _timeZoneObservables().push(timeZone);
        }

        // All time zones are loaded, so we can now load the bounding boxes
        loadBoundingBoxes();
      });
    });

    self.reloadCoordinates = function() {
      for (var i = 0; i < _timeZoneObservables().length; i++) {
        var coords = _timeZoneObservables()[i].coords;
        for (var j = 0; j < coords.length; j++) {
          coords[j] = getXY(coords[j].x, coords[j].y);
        }
      }
    };

    // Load the bounding boxes
    function loadBoundingBoxes() {
      fetch('/api/map-bounds').then(function (response) {
        if (!response.ok) {
          // TODO Handle error here
          return;
        }
        response.json().then(function (json) {
          var boundingBoxes = JSON.parse(json);
          for (var i = 0; i < boundingBoxes.length; i++) {
            var box = boundingBoxes[i];
            for (var j = 0; j < _timeZoneObservables().length; j++) {
              if (_timeZoneObservables()[j].matchesId(box.name)) {
                var xyMin = getXY(box.boundingBox.ymin, box.boundingBox.xmin);
                var xyMax = getXY(box.boundingBox.ymax, box.boundingBox.xmax);
                _timeZoneObservables()[j].boundingBox = {
                  xyMin: xyMin,
                  xyMax: xyMax
                };
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
          _errorCallback('Something went wrong trying to load the time zone polygons for ' + zoneName + '...');
          return;
        }
        response.json().then(function (json) {
          var data = JSON.parse(json);
          var polygons = {};

          for (var i = 0; i < data.polygons.length; i++) {
            // Loop through all the points in the polygon
            // Every 2 points are a lat & lng pair
            var polygonData = data.polygons[i];
            var coords = [];

            for (var j = 0; j < polygonData.points.length; j += 2) {
              var coord = polygonData.points.slice(j, j + 2);
              var xy = getXY(coord[0], coord[1]);
              coords.push(xy);
            }

            // Check if the polygon has already been created
            var polygon = polygons[polygonData.name];
            if (polygon) {
              polygon.coords = polygon.coords.concat(coords);
            } else {
              polygon = new Polygon(polygonData.name, coords, getXY(polygonData.centroid[1], polygonData.centroid[0]));
              polygons[polygonData.name] = polygon;
            }
          }

          // Check to each polygon to find the largest by seeing if it has the most edges
          // Use the largest polygon's centroid as the timezone centroid
          var centroidName, maxPoints = 0;
          $.each(polygons, function (index, value) {
            if (value.coords.length > maxPoints) {
              maxPoints = value.coords.length;
              centroidName = value.name;
            }
          });

          if (!_timeZoneRegionsObservable()[timeZone.name]) {
            _timeZoneRegionsObservable()[timeZone.name] = [];
          }
          _timeZoneRegionsObservable()[timeZone.name] = polygons;
          timeZone.centroidPolygon = polygons[centroidName];
        });
      });
    }
  };

  function getXY(lat, lng) {
    var centerX = mercX(_centerLng());
    var centerY = mercY(_centerLat());
    var x = mercX(lng) - centerX;
    var y = mercY(lat) - centerY;
    return { x: x, y: y };
  }

  function mercX(lng) {
    lng = toRadians(lng);
    var a = (mercUnits / Math.PI) * Math.pow(2, _zoom());
    var b = lng + Math.PI;
    return a * b;
  }

  function mercY(lat) {
    lat = toRadians(lat);
    var a = (mercUnits / Math.PI) * Math.pow(2, _zoom());
    var b = Math.tan(Math.PI / 4 + lat / 2);
    var c = Math.PI - Math.log(b);
    return a * c;
  }

  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}