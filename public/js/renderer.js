var Renderer = function() {
  var self = this;

  const width = 1024, height = 512;
  var canvas = $('#theCanvas')[0];
  var context = canvas.getContext('2d');
  var imageBackground;
  var matrix = [1, 0, 0, 1, 0, 0];

  // TODO Make color a property here (observable?)
  // Then I can just set the color before calling a drawing function

  // Loads a url into an image, draws that image to the canvas, then calls the callback function once everything is complete.
  self.loadImage = function(url, callback) {
    imageBackground = new Image();
    imageBackground.onload = function() {
      // Normally, 0,0 would be the top left of the canvas.
      // I need to translate the canvas and the map image so that the center of the canvas is 0,0
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;
      
      // Save the translate in the matrix
      matrix[4] += matrix[0] * centerX + matrix[2] * centerY;
      matrix[5] += matrix[1] * centerX + matrix[3] * centerY;

      context.translate(centerX, centerY);
      context.drawImage(imageBackground, (centerX) * -1, (centerY) * -1, width, height);
      callback();
    };
    imageBackground.src = url;
  }

  self.drawImageBackground = function() {
    if (!imageBackground) return;
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    context.beginPath();
    context.drawImage(imageBackground, (centerX) * -1, (centerY) * -1, width, height);
    context.closePath();
  }

  self.ellipse = function(x, y, width, height, color) {
    color = convertHex(color, 255);
    context.beginPath();
    // Ellipse: void context.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    context.ellipse(x, y, width / 2, height / 2, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
  }

  self.polygon = function(points, color) {
    var polygonPoints = points.slice(0);  // Need a copy of the points here
    context.beginPath();
    color = convertHex(color, 98);
    context.fillStyle = color;

    var firstPoint = polygonPoints[0];
    var separatePoints = [];
    for (var i = 0; i < polygonPoints.length; i++) {
      var point = polygonPoints[i];
      if (i == 0) {
        context.moveTo(point.x, point.y);
      } else {
        if (point.x === firstPoint.x && point.y === firstPoint.y && i < polygonPoints.length - 1) {
          // Need to create a separate polygon for these points
          separatePoints = polygonPoints.splice(i + 1, polygonPoints.length - i);
        }
        context.lineTo(point.x, point.y);
      }
    }

    context.fill();
    context.closePath();

    if (separatePoints.length > 0)
      self.polygon(separatePoints, color);
  }

  self.text = function(x, y, text, color, id) {
    var element = $('#' + id)
    if (element[0] === undefined) {
      element = jQuery('<span/>', {
        id: id,
        style: 'position: absolute; left: ' + x + 'px; top: ' + y + 'px; color: ' + color
      }).appendTo('#timeContainer');
    }
    element.text(text);
  }

  self.clear = function() {
    context.clearRect(0 - canvas.width / 2, 0 - canvas.height / 2, canvas.width, canvas.height);
  }

  self.width = function() {
    return width;
  }

  self.height = function() {
    return height;
  }
  
  self.addMouseOverEvent = function(event) {
    canvas.addEventListener('mousemove', event, false);
  }

  self.getPosition = function(event) {
    var rect = canvas.getBoundingClientRect();
    
    var x = (event.clientX * matrix[0] + event.clientY * matrix[2]) + matrix[4];
    var y = (event.clientX * matrix[1] + event.clientY * matrix[3]) + matrix[5];
    
    // The canvas uses the center as it's (0, 0) point
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    return {
      x: x,//event.clientX - centerX,
      y: y//centerY - event.clientY
    }
  }

  function convertHex(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var a = parseInt(alpha, 16)/255;
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }
}