goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');


var field = VectorField.read(windData, true);
var display = new MotionDisplay(field, 5000);


var map = new ol.Map({
  layers : [new ol.layer.Tile({
    source : new ol.source.MapQuest({
      layer : 'sat'
    })
  })],
  renderer : 'canvas',
  target : 'map',
  view : new ol.View2D({
    center : [0, 0],
    zoom : 2
  })
});

map.on('postcompose', function(event) {
  display.animate(event.context);
});
