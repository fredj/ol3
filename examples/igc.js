goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.IGC');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.layer.Heatmap');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var colors = {
  'Clement Latour': 'rgba(0, 0, 0, 0.101)',
  'Damien de Baesnt': 'rgba(0, 0, 0, 0.102)',
  'Sylvain Dhonneur': 'rgba(0, 0, 0, 0.103)',
  'Tom Payne': 'rgba(0, 0, 0, 0.104)',
  'Ulrich Prinz': 'rgba(0, 0, 0, 0.105)'
};

// var colors = {
//   'Clement Latour': 'rgba(0, 0, 255, 0.1)',
//   'Damien de Baesnt': 'rgba(0, 215, 255, 0.1)',
//   'Sylvain Dhonneur': 'rgba(0, 165, 255, 0.1)',
//   'Tom Payne': 'rgba(0, 255, 255, 0.1)',
//   'Ulrich Prinz': 'rgba(0, 215, 255, 0.1)'
// };

var styleCache = {};
var styleFunction = function(feature) {
  var color = colors[feature.get('PLT')];
  var style = styleCache[color];
  if (!style) {
    style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 4
      })
    });
    styleCache[color] = style;
  }
  return style;
};

var vectorSource = new ol.source.Vector();

var igcUrls = [
  'data/igc/Clement-Latour.igc',
  'data/igc/Damien-de-Baenst.igc',
  'data/igc/Sylvain-Dhonneur.igc',
  'data/igc/Tom-Payne.igc',
  'data/igc/Ulrich-Prinz.igc'
];

function get(url, callback) {
  var client = new XMLHttpRequest();
  client.open('GET', url);
  client.onload = function() {
    callback(client.responseText);
  };
  client.send();
}

var igcFormat = new ol.format.IGC();
for (var i = 0; i < igcUrls.length; ++i) {
  get(igcUrls[i], function(data) {
    var features = igcFormat.readFeatures(data,
        {featureProjection: 'EPSG:3857'});
    vectorSource.addFeatures(features);
  });
}

var time = {
  start: Infinity,
  stop: -Infinity,
  duration: 0
};
vectorSource.on('addfeature', function(event) {
  var geometry = event.feature.getGeometry();
  time.start = Math.min(time.start, geometry.getFirstCoordinate()[2]);
  time.stop = Math.max(time.stop, geometry.getLastCoordinate()[2]);
  time.duration = time.stop - time.start;
});


var map = new ol.Map({
  layers: [
    new ol.layer.Heatmap({
      source: vectorSource
    })
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [703365.7089403362, 5714629.865071137],
    zoom: 9
  })
});


var point = null;
var line = null;
var displaySnap = function(coordinate) {
  var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
  var info = document.getElementById('info');
  if (closestFeature === null) {
    point = null;
    line = null;
    info.innerHTML = '&nbsp;';
  } else {
    var geometry = closestFeature.getGeometry();
    var closestPoint = geometry.getClosestPoint(coordinate);
    if (point === null) {
      point = new ol.geom.Point(closestPoint);
    } else {
      point.setCoordinates(closestPoint);
    }
    var date = new Date(closestPoint[2] * 1000);
    info.innerHTML =
        closestFeature.get('PLT') + ' (' + date.toUTCString() + ')';
    var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];
    if (line === null) {
      line = new ol.geom.LineString(coordinates);
    } else {
      line.setCoordinates(coordinates);
    }
  }
  map.render();
};
