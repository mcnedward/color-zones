var Renderer = function() {
  var self = this;

  var canvas = $('#theCanvas')[0];
  var context = canvas.getContext('2d');

  // TODO Make color a property here (observable?)
  // Then I can just set the color before calling a drawing function

  // Loads a url into an image, draws that image to the canvas, then calls the callback function once everything is complete.
  self.drawImage = function(url, callback) {
    var image = new Image();
    image.onload = function() {
      // Normally, 0,0 would be the top left of the canvas.
      // I need to translate the canvas and the map image so that the center of the canvas is 0,0
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;
      context.translate(centerX, centerY);
      context.drawImage(image, (centerX) * -1, (centerY) * -1, 1024, 512);
      callback();
    };
    image.src = url;
  }

  self.ellipse = function(x, y, width, height, color) {
    context.beginPath();
    // Ellipse: void context.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    context.ellipse(x, y, width / 2, height / 2, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
  }

  self.polygon = function(points, color) {
    context.fillStyle = color;
    context.beginPath();

    var firstPoint = points[0];
    var separatePoints = [];
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      if (i == 0) {
        context.moveTo(point.x, point.y);
      } else {
        if (point.x === firstPoint.x && point.y === firstPoint.y && i < points.length - 1) {
          // Need to create a separate polygon for these points
          separatePoints = points.splice(i + 1, points.length - i);
        }
        context.lineTo(point.x, point.y);
      }
    }

    context.closePath();
    context.fill();

    if (separatePoints.length > 0)
      self.polygon(separatePoints, color);
  }

  self.width = function() {
    return canvas.width;
  }

  self.height = function() {
    return canvas.height;
  }
}