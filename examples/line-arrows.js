goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.interaction.Draw');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var source = new ol.source.Vector();

var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2,
      icons: [{
        image: new ol.style.Icon({
          src: 'data/arrow.png',
          anchor: [0.75, 0.5],
          rotateWithView: false
        }),
        repeat: 50
      }]
    })
  })
});

var map = new ol.Map({
  layers: [raster, vector],
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
