var Color = function() {
  var self = this;

  self.currentTime = ko.observable();

  function checkInterval(interval) {
    if (interval < 10) {
      interval = "0" + interval;
    }
    return interval;
  }

  setInterval(() => {
    var date = new Date();
    var hours = checkInterval(date.getHours());
    var minutes = checkInterval(date.getMinutes());
    var seconds = checkInterval(date.getSeconds());

    var time = hours + ":" + minutes + ":" + seconds;
    self.currentTime(time);
  }, 1000);
};
