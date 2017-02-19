var TimeZone = function(name, coords) {
  var self = this;

  self.name = name;
  self.coords = coords;
  self.polygons;
  self.centroidPolygon;
  self.boundingBox;

  self.id = ko.pureComputed(function() {
    return self.name.replace(/\/|_/g, '-');
  });

  self.matchesId = function(idToMatch) {
    return self.id() === idToMatch.replace(/\/|_/g, '-');
  }
}