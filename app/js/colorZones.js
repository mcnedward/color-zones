var ColorZones = function (renderer, timeZoneService, colorPicker) {
  var self = this;

  const width = renderer.width(), height = renderer.height();
  const color = '#a01111';
  const textColor = 'white';
  const hoverZoneColor = '#660d60';
  const timeFormat = 'HH:mm:ss';

  var _hoverTimeZoneKey;
  var _selectedTimeText;
  var _mouseX, _mouseY;

  self.timeZones = ko.observableArray();
  self.timeZoneRegions = ko.observable({});
  self.width = ko.observable(width + 'px');
  self.height = ko.observable(height + 'px');
  self.colorPicker = ko.observable(colorPicker);
  self.opacity = ko.observable(80);
  self.showTimes = ko.observable(true);
  self.zoom = ko.observable(1);
  self.centerLat = ko.observable(0);
  self.centerLng = ko.observable(0);

  // Draw Loop
  renderer.renderFunction(function() {
    if (self.timeZones().length === 0) return;

    var timeTexts = [];
    // Trigger the intervals to draw all the zones
    for (var i = 0; i < self.timeZones().length; i++) {
      var timeZone = self.timeZones()[i];

      var current = moment().tz(timeZone.name);
      var hours = adjustTime(current.hours());
      var minutes = adjustTime(current.minutes());
      var seconds = adjustTime(current.seconds());

      var red = getColorInterval(colorPicker.red, hours, minutes, seconds);
      var green = getColorInterval(colorPicker.green, hours, minutes, seconds);
      var blue = getColorInterval(colorPicker.blue, hours, minutes, seconds);

      var color = "#" + red + green + blue;
      renderer.polygon(timeZone.coords, color, self.opacity());

      if (timeZone.centroidPolygon === undefined) continue;
      var timeText = {
        textX: timeZone.centroidPolygon.centroid.x,
        textY: timeZone.centroidPolygon.centroid.y,
        time: current.format(timeFormat)
      };
      timeTexts.push(timeText);
      if (_hoverTimeZoneKey && _hoverTimeZoneKey !== '' && _hoverTimeZoneKey === timeZone.name) {
        _selectedTimeText = timeText;
      }
    }

    var hoverTimeZone = self.timeZoneRegions()[_hoverTimeZoneKey];
    if (hoverTimeZone) {
      $.each(hoverTimeZone, function(index, value) {
        if (!value || !value.coords || value.coords.length === 0) return;
        renderer.polygon(value.coords, hoverZoneColor, 80);
      });
      if (!self.showTimes()) {
        renderer.text(_mouseX - 30, _mouseY - 5, _selectedTimeText.time, textColor);
      }
    }

    // Need to do this in a separate loop here to have the times drawn on top
    if (!self.showTimes()) return;
    for (var j = 0; j < timeTexts.length; j++) {
      renderer.text(timeTexts[j].textX, timeTexts[j].textY, timeTexts[j].time, textColor);
    }
  });

  var _mapCallback;
  // Load the map image
  function loadMap(mapCallback) {
    _mapCallback = mapCallback;
    fetch('/api/map?centerLat=' + self.centerLat() + '&centerLng=' + self.centerLng() + '&zoom=' + self.zoom() + '&width=' + width + '&height=' + height)
    .then(function (response) {
      if (!response.ok) {
        console.error('Something went wrong trying to load the map iamge...');
        return;
      }
      response.text().then(function (mapUrl) {
        renderer.loadImage(mapUrl);
        if (_mapCallback !== undefined)
          _mapCallback();
      });
    });
  }
  loadMap();

  // Load the time zones
  timeZoneService.setup(self.centerLat, self.centerLng, self.zoom); // Pass in the observables
  timeZoneService.loadTimeZones(function(errorMessage) {
    console.error(errorMessage);
  }, self.timeZones, self.timeZoneRegions);

  function adjustTime(interval) {
    if (interval < 10) {
      interval = "0" + interval;
    }
    return interval.toString();
  }

  function getColorInterval(color, hours, minutes, seconds) {
    var interval = colorPicker.colors()[color].interval;
    switch (interval) {
      case colorPicker.hours:
        return hours;
      case colorPicker.minutes:
        return minutes;
      case colorPicker.seconds:
        return seconds;
      default:
        console.warn('Could not find an interval for: ' + interval + '...');
    }
  }

  function rayCastTest(region, x, y, zoneName) {
    var points = region.coords;
    var rayTest = 0;
    var lastPoint = points[points.length - 1];

    for (var j = 0; j < points.length; j++) {
      var point = points[j];

      if ((lastPoint.y <= y && point.y >= y) || 
          (lastPoint.y > y && point.y < y)) {
        var slope = (point.x - lastPoint.x) / (point.y / lastPoint.y);
        var testPoint = slope * (y - lastPoint.y) + lastPoint.x;
        if (testPoint < x) {
          rayTest++;
        }
      }
      lastPoint = point;
    }
    // If the count is odd, we are in the polygon
    return rayTest % 2 === 1;
  }

  renderer.addMouseOverEvent(function(x, y) {
    if (self.timeZones().length === 0) return;
    for (var i = 0; i < self.timeZones().length; i++) {
      var zone = self.timeZones()[i];
      var boundingBox = zone.boundingBox;
      if (boundingBox === undefined) return;

      // Source: https://github.com/dosx/timezone-picker
      if (y > boundingBox.xyMax.y && y < boundingBox.xyMin.y &&
          x > boundingBox.xyMin.x && x < boundingBox.xyMax.x) {
        // Mouse is in the zone bounds, so now have to check if it is in one of this zone's regions
        var regions = self.timeZoneRegions()[zone.name];
        for (var key in regions) {
          if (!regions.hasOwnProperty(key)) continue;
          if (rayCastTest(regions[key], x, y)) {
            _hoverTimeZoneKey = zone.name;
            _mouseX = x;
            _mouseY = y;
          }
        }
      }
    }
  }, self.centerLat(), self.centerLng());

  renderer.addMouseScrollEvent(function(zoom) {
    if (zoom > 1) {
      self.zoom(self.zoom() + 1);
    } else {
      self.zoom(self.zoom() - 1);
    }

    if (self.zoom() < 1) {
      // Can't zoom any lower
      self.zoom(1);
      return;
    }
  });
};
