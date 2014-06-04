goog.provide('ol.test.Graticule');

describe('ol.Graticule', function() {
  var graticule;

  beforeEach(function() {
    var map = new ol.Map({});
    var projection = ol.proj.get('EPSG:3857');
    graticule = new ol.Graticule({
      map: map,
      projection: projection
    });
  });

  describe('#createGraticule', function() {
    it('creates the graticule', function() {
      var resolution = 39135.75848201024;
      var squaredTolerance = resolution * resolution / 4.0;
      graticule.createGraticule_([0, 0], resolution, squaredTolerance);
      expect(graticule.getMeridians().length).to.be(13);
      expect(graticule.getParallels().length).to.be(7);
    });
  });

});

goog.require('ol.Graticule');
goog.require('ol.Map');
goog.require('ol.proj');
