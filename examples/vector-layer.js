goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var vectorSource = new ol.source.Vector();
var styleArray = [new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  })
})];

var vectorLayer;
$.getJSON('data/countries.geojson', function(data) {
  var format = new ol.format.GeoJSON();
  var transformFn = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
  format.readObject(data, function(feature) {
    var geometry = feature.getGeometry();
    geometry.transform(transformFn);
    feature.setGeometry(geometry);
    vectorSource.addFeature(feature);
  });
  vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    styleFunction: function(feature, resolution) {
      return styleArray;
    }
  });
  map.getLayers().push(vectorLayer);
});

var highlight;
var displayFeatureInfo = function(coordinate) {
  var oldHighlight = highlight;
  var features = vectorSource.getAllFeaturesAtCoordinate(coordinate);
  var info = document.getElementById('info');
  if (features.length > 0) {
    var feature = features[0];
    info.innerHTML = feature.getId() + ': ' + features[0].get('name');
    highlight = feature;
  } else {
    info.innerHTML = '&nbsp;';
    highlight = undefined;
  }
  if (highlight !== oldHighlight) {
    map.requestRenderFrame();
    if (highlight) {
      vectorLayer.setRenderGeometryFunction(function(geometry) {
        return geometry !== highlight.getGeometry();
      });
    } else {
      vectorLayer.setRenderGeometryFunction(undefined);
    }
  }
};

$(map.getViewport()).on('mousemove', function(evt) {
  var coordinate = map.getEventCoordinate(evt.originalEvent);
  displayFeatureInfo(coordinate);
});

map.on('singleclick', function(evt) {
  var coordinate = evt.getCoordinate();
  displayFeatureInfo(coordinate);
});

var highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#f00',
    width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,0,0,0.1)'
  }),
  text: new ol.style.Text({
    textAlign: 'center',
    fill: new ol.style.Fill({
      color: '#000'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
});

map.on('postcompose', function(evt) {
  if (highlight) {
    var render = evt.getRender();
    highlightStyle.text.text = highlight.getId();
    render.drawFeature(highlight, highlightStyle);
  }
});
