var Color = function (renderer, timeZoneService) {
  var self = this;

  const width = renderer.width(), height = renderer.height();
  const zoom = 1;
  const centerLat = 20;
  const centerLng = 10;
  const color = '#a01111';
  const gmaps = google.maps;

  // 27.269854, -82.460850 - Sarasota, FL
  var lat = 27.269854;
  var lng = -82.460850;

  self.timeZones = ko.observableArray();
  self.width = ko.observable(width + 'px');
  self.height = ko.observable(height + 'px');

  // Draw Loop
  setInterval(() => {
    if (self.timeZones().length == 0) return;

    // Clear the canvas each frame
    renderer.clear();
    renderer.drawImageBackground();

    // Trigger the intervals to draw all the zones
    for (var i = 0; i < self.timeZones().length; i++) {
      var timeZone = self.timeZones()[i];

      var current = moment().tz(timeZone.name);
      var hours = adjustTime(current.hours());
      var minutes = adjustTime(current.minutes());
      var seconds = adjustTime(current.seconds());

      var hex = hours + minutes + seconds;
      var color = "#" + hex;
      renderer.polygon(timeZone.coords, color);

      if (timeZone.centroidPolygon === undefined) return;
      var textX = timeZone.centroidPolygon.centroid.x;
      var textY = timeZone.centroidPolygon.centroid.y;
      renderer.text(textX, textY, current.format('HH:mm:ss'), '#ffffff', timeZone.centroidPolygon.id());
    }
  }, 1000);

  // Load the map image
  fetch('/api/map?centerLat=' + centerLat + '&centerLng=' + centerLng + '&zoom=' + zoom + '&width=' + width + '&height=' + height)
  .then(function (response) {
    if (!response.ok) {
      console.log('Something went wrong trying to load the map iamge...');
      return;
    }
    response.text().then(function (mapUrl) {
      renderer.loadImage(mapUrl);
    })
  });
  // Load the time zones
  timeZoneService.setup(centerLat, centerLng, zoom);
  timeZoneService.loadTimeZones(function(errorMessage) {
    console.log(errorMessage);
  }, self.timeZones);

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
    for (var i = 0; i < self.timeZones().length; i++) {
      var zone = self.timeZones()[i];
      var boundingBox = zone.boundingBox;
      if (mouseY > boundingBox.xyMin.y && mouseY < boundingBox.xyMax.y && mouseX > boundingBox.xyMin.x && mouseX < boundingBox.xyMax.x) {
        // Mouse is in the zone bounds
        console.log('You are in the ' + zone.name + ' zone!');
        return;
      }
    }
  });
};
