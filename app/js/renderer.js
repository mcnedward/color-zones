function Renderer() {
  var self = this;

  const width = 1200, height = 700;
  var canvas = $('#theCanvas')[0];
  var context = canvas.getContext('2d');
  var imageBackground;
  var matrix = [1, 0, 0, 1, 0, 0];
  var transformApplied = false;

  // TODO Make color a property here (observable?)
  // Then I can just set the color before calling a drawing function

  self.renderFunction = ko.observable();

  function render() {
    requestAnimationFrame(render);
    
    // Clear the canvas each frame
    clear();
    drawImageBackground();

    if (self.renderFunction())
      self.renderFunction()();
  }
  render();

  // Loads a url into an image then draws that image to the canvas
  self.loadImage = function(url) {
    if (imageBackground === undefined)
      imageBackground = new Image();
    imageBackground.onload = function() {
      // Normally, 0,0 would be the top left of the canvas.
      // I need to translate the canvas and the map image so that the center of the canvas is 0,0
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;
      if (!transformApplied) {
        // Save the translate in the matrix
        matrix[4] += matrix[0] * centerX + matrix[2] * centerY;
        matrix[5] += matrix[1] * centerX + matrix[3] * centerY;
        context.translate(centerX, centerY);
        transformApplied = true;
      }
      context.drawImage(imageBackground, (centerX) * -1, (centerY) * -1, width, height);
    };
    imageBackground.src = url;
  };

  function drawImageBackground() {
    if (!imageBackground) return;
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    context.beginPath();
    context.drawImage(imageBackground, (centerX) * -1, (centerY) * -1, width, height);
    context.closePath();
  }

  self.ellipse = function(x, y, width, height, color) {
    color = convertHex(color, 100);
    context.beginPath();
    // Ellipse: void context.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    context.ellipse(x, y, width / 2, height / 2, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
  };

  self.polygon = function(points, color, alpha) {
    var polygonPoints = points.slice(0);  // Need a copy of the points here
    context.beginPath();
    color = convertHex(color, alpha);
    context.fillStyle = color;

    var firstPoint = polygonPoints[0];
    var separatePoints = [];
    for (var i = 0; i < polygonPoints.length; i++) {
      var point = polygonPoints[i];
      if (i === 0) {
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
  };

  self.text = function(x, y, text, color, centerText) {
    context.font = 'bold 16px Segoe UI';
    context.fillStyle = color;
    if (centerText) {
      var metrics = context.measureText(text);
      x -= metrics.width / 2;
    }
    context.fillText(text, x, y);
  };

  function clear() {
    context.clearRect(0 - canvas.width / 2, 0 - canvas.height / 2, canvas.width, canvas.height);
  }

  self.width = function() {
    return width;
  };

  self.height = function() {
    return height;
  };
  
  var _mouseOverEvent, _centerLat, _centerLng;
  self.addMouseOverEvent = function(mouseOverEvent, centerLat, centerLng) {
    _mouseOverEvent = mouseOverEvent;
    _centerLat = centerLat;
    _centerLng = centerLng;
    canvas.addEventListener('mousemove', function(event) {
      var rect = canvas.getBoundingClientRect();
      
      // The canvas uses the center as its (0, 0) point
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;
      
      var x = event.clientX - rect.left - centerX;
      var y = event.clientY - rect.top - centerY;
      _mouseOverEvent(x, y);
    }, false);
  };

  var _scrollCallback;
  self.addMouseScrollEvent = function(callback) {
    _scrollCallback = callback;
    canvas.addEventListener('mousewheel', function() {
     var wheel = event.wheelDelta / 120;
     _scrollCallback(1 + wheel / 2);
    }, false);
  };

  function convertHex(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var a = parseInt(alpha, 16)/255;
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }
}