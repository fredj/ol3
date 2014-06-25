goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

map.addControl({
  setMap: function(map) {
    $('#barrel-roll').on('click', function(event) {
      map.beforeRender(ol.animation.rotate({
        duration: 2000,
        rotation: 2 * Math.PI
      }));
    });
  }
});
