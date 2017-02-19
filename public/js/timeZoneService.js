var TimeZoneService = function () {
  var self = this;

  self.errorCallback = ko.observable();
  self.successCallback = ko.observable();
  // This is an observable that the caller passes in
  // It will be updated as the service finishes each of it's requests
  self.timeZoneObservables;
  self.centerLat = ko.observable();
  self.centerLng = ko.observable();
  self.zoom = ko.observable();

  self.setup = function(centerLat, centerLng, zoom) {
    self.centerLat(centerLat);
    self.centerLng(centerLng);
    self.zoom(zoom);
  }

  self.loadTimeZones = function (errorCallback, timeZonesObservable) {
    if (self.centerLat() === undefined || self.centerLng() === undefined || self.zoom() === undefined) {
      errorCallback('You need to call TimeZoneService.setCenterCoordinates(centerLat, centerLng, zoom) first!');
      return;
    }
    self.errorCallback(errorCallback);
    self.timeZonesObservable = timeZonesObservable

    // Load the time zone regions
    fetch('/api/hover-regions').then(function (response) {
      if (!response.ok) {
        self.errorCallback()('Something went wrong trying to load the time zone regions...');
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
          timeZonesObservable().push(timeZone);
        }

        // All time zones are loaded, so we can now load the bounding boxes
        loadBoundingBoxes();
      })
    })

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
            for (var j = 0; j < timeZonesObservable().length; j++) {
              if (timeZonesObservable()[j].matchesId(box.name)) {
                var xyMin = getXY(box.boundingBox.ymin, box.boundingBox.xmin);
                var xyMax = getXY(box.boundingBox.ymax, box.boundingBox.xmax);
                timeZonesObservable()[j].boundingBox = {
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
          self.errorCallback()('Something went wrong trying to load the time zone polygons for ' + zoneName + '...');
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
          })

          timeZone.polygons = polygons;
          timeZone.centroidPolygon = polygons[centroidName];
        });
      });
    }

    function getXY(lat, lng) {
      var centerX = mercX(self.centerLng());
      var centerY = mercY(self.centerLat());
      var x = mercX(lng) - centerX;
      var y = mercY(lat) - centerY;
      return { x: x, y: y };
    }

    function mercX(lng) {
      lng = toRadians(lng);
      var a = (256 / Math.PI) * Math.pow(2, self.zoom());
      var b = lng + Math.PI;
      return a * b;
    }

    function mercY(lat) {
      lat = toRadians(lat);
      var a = (256 / Math.PI) * Math.pow(2, self.zoom());
      var b = Math.tan(Math.PI / 4 + lat / 2);
      var c = Math.PI - Math.log(b);
      return a * c;
    }

    function toRadians(degrees) {
      return degrees * (Math.PI / 180);
    }
  }
}