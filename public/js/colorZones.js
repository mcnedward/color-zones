var ColorZones = function (renderer, timeZoneService, colorPicker) {
  var self = this;

  const width = renderer.width(), height = renderer.height();
  const zoom = 1;
  const centerLat = 20;
  const centerLng = 5;
  const color = '#a01111';
  const gmaps = google.maps;

  self.colorPicker = ko.observable(colorPicker);
  self.timeZones = ko.observableArray();
  self.width = ko.observable(width + 'px');
  self.height = ko.observable(height + 'px');
  self.opacity = ko.observable(80);
  self.showTimes = ko.observable(true);

  // Draw Loop
  setInterval(() => {
    if (self.timeZones().length == 0) return;

    // Clear the canvas each frame
    renderer.clear();
    renderer.drawImageBackground();

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

      if (timeZone.centroidPolygon === undefined || !self.showTimes()) continue;
      timeTexts.push({
        textX: timeZone.centroidPolygon.centroid.x,
        textY: timeZone.centroidPolygon.centroid.y,
        time: current.format('HH:mm:ss')
      });
    }
    // Need to do this in a separate loop here to have the times drawn on top
    for (var i = 0; i < timeTexts.length; i++) {
      renderer.text(timeTexts[i].textX, timeTexts[i].textY, timeTexts[i].time, '#ffffff');
    }
  }, 100);

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
        console.log('Could not find an interval for: ' + interval + '...');
    }
  }

  renderer.addMouseOverEvent(function(event) {
    if (self.timeZones().length === 0) return;
    var mousePosition = renderer.getPosition(event);
    var mouseX = mousePosition.x;
    var mouseY = mousePosition.y;
    // console.log('MouseX: ' + mouseX + ' MouseY: ' + mouseY);
    for (var i = 0; i < self.timeZones().length; i++) {
      var zone = self.timeZones()[i];
      var boundingBox = zone.boundingBox;
      if (boundingBox === undefined) return;
      if (mouseY > boundingBox.xyMin.y && mouseY < boundingBox.xyMax.y && mouseX > boundingBox.xyMin.x && mouseX < boundingBox.xyMax.x) {
        // Mouse is in the zone bounds
        console.log('You are in the ' + zone.name + ' zone!');
        return;
      }
    }
  });
};
