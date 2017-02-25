function TimeZone(name, coords) {
  var self = this;

  self.name = name;
  self.coords = coords;
  self.polygons = undefined;
  self.centroidPolygon = undefined;
  self.boundingBox = undefined;

  self.matchesId = function(idToMatch) {
    return self.id() === idToMatch.replace(/\/|_/g, '-');
  };

  self.id = ko.pureComputed(function() {
    return self.name.replace(/\/|_/g, '-');
  });
}