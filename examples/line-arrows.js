goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Draw');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var source = new ol.source.Vector();

var styleFunction = function(feature, resolution) {
  var styles = [];
  styles.push(
    // linestring
     new ol.style.Style({
       stroke: new ol.style.Stroke({
         color: '#ffcc33',
         width: 1
       })
     })
  );

  var geometry = feature.getGeometry();

  // pixels between points
  var repeat = 20;

  // line length in pixel
  var length = geometry.getLength() / resolution;

  // number of points along the line
  var count = Math.ceil(length / repeat);

  for (var i = 0; i <= 1; i += 1 / count) {
    var point = geometry.getCoordinateAt(i);
    var before = geometry.getCoordinateAt(Math.max(i - 0.1, 0));
    var after = geometry.getCoordinateAt(Math.min(i + 0.1, 1));
    var rotation = Math.atan2(after[1] - before[1], after[0] - before[0]);

    styles.push(new ol.style.Style({
      geometry: new ol.geom.Point(point),
      image: new ol.style.RegularShape({
        fill: new ol.style.Fill({color: '#ffcc33'}),
        stroke: new ol.style.Stroke({color: 'black', width: 2}),
        points: 3,
        radius: 5,
        angle: -rotation + Math.PI / 2
      })
    }));
  }

  return styles;
};
var vector = new ol.layer.Vector({
  source: source,
  style: styleFunction
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

map.addInteraction(new ol.interaction.Draw({
  source: source,
  type: /** @type {ol.geom.GeometryType} */ ('LineString')
}));
