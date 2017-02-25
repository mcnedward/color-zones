function ColorPicker () {
  var self = this;

  self.hours = 'hours';
  self.minutes = 'minutes';
  self.seconds = 'seconds';
  self.red = 'red';
  self.green = 'green';
  self.blue = 'blue';
  self.colors = ko.observable({
    red: {
      class: 'btn-danger',
      interval: self.hours
    },
    green: {
      class: 'btn-success',
      interval: self.minutes
    },
    blue: {
      class: 'btn-primary',
      interval: self.seconds
    }
  });
  self.hoursColor = ko.observable(self.colors().red.class);
  self.minutesColor = ko.observable(self.colors().green.class);
  self.secondsColor = ko.observable(self.colors().blue.class);

  self.update = function (intervalName, color) {
    // Update the selected interval observable property (self.hours, self.minutes, self.seconds) and color
    self[intervalName + 'Color'](self.colors()[color].class);

    // Get the original interval's color key
    var originalColorKey;
    for (var key in self.colors()) {
      if (!self.colors().hasOwnProperty(key)) continue;

      if (self.colors()[key].interval === intervalName) {
        originalColorKey = key;
        break;
      }
    }

    var overriden = self.colors()[color];
    self[overriden.interval + 'Color'](self.colors()[originalColorKey].class);

    var temp = self.colors()[color].interval;
    self.colors()[color].interval = intervalName;
    self.colors()[originalColorKey].interval = temp;
  };

}