function Polygon(name, coords, centroid) {
  var self = this;

  self.name = name;
  self.coords = coords;
  self.centroid = centroid;

  self.id = ko.pureComputed(function() {
    return self.name.replace(/\/|_/g, '-');
  });
}