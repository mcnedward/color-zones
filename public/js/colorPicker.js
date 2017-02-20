var ColorPicker = function () {
  var self = this;

  self.colors = ko.observable({
    red: {
      class: 'btn-danger',
      interval: 'hours'
    },
    green: {
      class: 'btn-success',
      interval: 'minutes'
    },
    blue: {
      class: 'btn-primary',
      interval: 'seconds'
    }
  });

  self.hours = ko.observable(self.colors().red.class);
  self.minutes = ko.observable(self.colors().green.class);
  self.seconds = ko.observable(self.colors().blue.class);

  self.update = function (intervalName, color) {
    // Update the selected interval observable property (self.hours, self.minutes, self.seconds) and color
    self[intervalName](self.colors()[color].class);

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
    self[overriden.interval](self.colors()[originalColorKey].class);

    var temp = self.colors()[color].interval;
    self.colors()[color].interval = intervalName;
    self.colors()[originalColorKey].interval = temp;
  }

}