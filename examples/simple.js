goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.FPS');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.FPS()
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
