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

var styleFunction = function(feature) {
  var geometry = feature.getGeometry();
  var styles = [
    // linestring
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
      })
    })
  ];

  geometry.forEachSegment(function(start, end) {
    var dx = end[0] - start[0];
    var dy = end[1] - start[1];
    var rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(new ol.style.Style({
      geometry: new ol.geom.Point(end),
      image: new ol.style.RegularShape({
        fill: new ol.style.Stroke({
          color: '#ffcc33'
        }),
        radius: 6,
        points: 3,
        angle: Math.PI / 2,
        rotation: -rotation
      })
    }));
  });

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
