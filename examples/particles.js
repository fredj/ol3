// http://html5hub.com/build-a-javascript-particle-system/

goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');


function randomUniform(a, b) {
  return a + Math.random() * (b - a);
}

var vectorSource = new ol.source.Vector();
var vectorLayer = new ol.layer.Vector({
  renderOrder: null,
  source: vectorSource,
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 2,
      fill: new ol.style.Fill({color: 'yellow'}),
      stroke: null
    })
  })
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    }),
    vectorLayer
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

var extent = map.getView().getProjection().getExtent();

for (var i = 0; i < 500; i++) {
  var lon = randomUniform(extent[1] / 3, extent[3] / 3);
  var lat = randomUniform(extent[0] / 3, extent[2] / 3);
  var point = new ol.geom.Point([lon, lat]);
  var feature = new ol.Feature(point);

  feature.set('velocity', [0, 0]);
  feature.set('acceleration', [0, 0]);

  vectorSource.addFeature(feature);
}

map.on('postcompose', function(event) {
  var features = vectorSource.getFeatures();
  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    var velocity = feature.get('velocity');
    var acceleration = feature.get('acceleration');
    var geometry = feature.get('geometry');
    var coordinates = geometry.getCoordinates();

    ol.coordinate.add(velocity, acceleration);
    ol.coordinate.add(coordinates, velocity);

    if (ol.extent.containsCoordinate(extent, coordinates)) {
      geometry.setCoordinates(coordinates);
    } else {
      // FIXME
    }
  }
  map.render();
});

map.on('singleclick', function(evt) {
  var features = vectorSource.getFeatures();
  for (var i = 0, ii = features.length; i < ii; i++) {
    var feature = features[i];
    var coordinates = feature.getGeometry().getCoordinates();

    var dx = evt.coordinate[0] - coordinates[0];
    var dy = evt.coordinate[1] - coordinates[1];

    var force = - 1e9 / ol.coordinate.squaredDistance(evt.coordinate, coordinates);
    feature.set('acceleration', [dx * force, dy * force]);
  }
});

var prevContext;
vectorLayer.on('render', function(evt) {
  var context = evt.context;
  if (!prevContext) {
    prevContext = document.createElement('canvas').getContext('2d');
    prevContext.canvas.width = context.canvas.width;
    prevContext.canvas.height = context.canvas.height;
  }
  prevContext.globalCompositeOperation = 'destination-out';
  prevContext.fillStyle = 'rgba(0, 0, 0, .1)';
  prevContext.fillRect(0, 0, prevContext.canvas.width, prevContext.canvas.height);
  prevContext.globalCompositeOperation = 'lighter';

  prevContext.drawImage(context.canvas, 0, 0);

  context.drawImage(prevContext.canvas, 0, 0);
});
