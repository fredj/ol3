goog.require('ol.AnchoredElement');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.BingMaps');


var layer = new ol.layer.TileLayer({
  source: new ol.source.BingMaps({
    key: 'AgtFlPYDnymLEe9zJ5PCkghbNiFZE9aAtTy3mPaEnEBXqLHtFuTcKoZ-miMC3w7R',
    style: 'Aerial'
  })
});

var map = new ol.Map({
  layers: new ol.Collection([layer]),
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map'
});
var view = map.getView();

var transformCoords = ol.projection.getTransform(
    ol.projection.getFromCode('EPSG:4326'), view.getProjection());

var xhr = new XMLHttpRequest();
xhr.open('GET',
    'http://api.tiles.mapbox.com/v3/examples.map-zr0njcqy/markers.geojson',
    true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status === 200) {
    var positions = [];
    var collection = JSON.parse(xhr.response);
    for (var i = 0; i < collection.features.length; i++) {
      var feature = collection.features[i];
      var props = feature.properties;

      var size = props['marker-size'].charAt(0) || 'm';
      var symbol = props['marker-symbol'];
      var color = (props['marker-color'] || '#7e7e7e').slice(1);

      var filename = 'pin-' + size + '-' + symbol + '+' + color + '.png';
      var img = document.createElement('img');
      img.src = 'http://api.tiles.mapbox.com/v3/marker/' + filename;
      img.className = 'marker ' + size;
      img.draggable = false;
      img.title = props.title;

      var coords = feature.geometry.coordinates;
      var vertex = [coords[0], coords[1]];
      vertex = transformCoords(vertex, vertex, 2);
      var position = new ol.Coordinate(vertex[0], vertex[1]);
      positions.push(position);
      //extent = extent.boundingExtent(position);

      new ol.AnchoredElement({
        map: map,
        element: img,
        position: position
      });
    }
    var extent = ol.Extent.boundingExtent.apply(null, positions);
    view.fitExtent(extent, map.getSize());
  }
};
xhr.send();
