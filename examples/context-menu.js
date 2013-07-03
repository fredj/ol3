goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
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

var menu = new ol.Overlay({
  map: map,
  element: document.getElementById('menu')
});

map.on('contextmenu', function(event) {
  event.preventDefault();
  menu.setPosition(event.getCoordinate());
  $(menu.getElement()).popover('show');
});
map.on('click', function(event) {
  $(menu.getElement()).popover('destroy');
});


// simulate the context menu on touch devices (long press)
var holdTimeout;
map.on('touchstart', function(event) {
  holdTimeout = window.setTimeout(function() {
    // after 750ms, trigger a 'contextmenu' event using the touchstart event.
    event.type = 'contextmenu';
    map.trigger(event);
  }, 750);
});
map.on(['touchmove', 'touchend'], function(event) {
  window.clearTimeout(holdTimeout);
});
