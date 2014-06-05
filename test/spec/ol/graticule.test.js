goog.provide('ol.test.Graticule');

describe('ol.Graticule', function() {
  var graticule;

  beforeEach(function() {
    graticule = new ol.Graticule({
      map: new ol.Map({})
    });
  });

  describe('#createGraticule', function() {
    it('creates the graticule', function() {
      var projection = ol.proj.get('EPSG:3857');
      var resolution = 39135.75848201024;
      var squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_([0, 0], resolution, squaredTolerance);
      expect(graticule.getMeridians().length).to.be(13);
      expect(graticule.getParallels().length).to.be(7);
    });
  });

});

goog.require('ol.Graticule');
goog.require('ol.Map');
goog.require('ol.proj');
