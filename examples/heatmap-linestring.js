goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Heatmap');
goog.require('ol.layer.Tile');
goog.require('ol.source.IGC');
goog.require('ol.source.Stamen');


var vector = new ol.layer.Heatmap({
  source: new ol.source.IGC({
    projection: 'EPSG:3857',
    urls: [
      'data/igc/Clement-Latour.igc',
      'data/igc/Damien-de-Baenst.igc',
      'data/igc/Sylvain-Dhonneur.igc',
      'data/igc/Tom-Payne.igc',
      'data/igc/Ulrich-Prinz.igc'
    ]
  }),
  radius: 5
});

var raster = new ol.layer.Tile({
  source: new ol.source.Stamen({
    layer: 'toner'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [703365.7089403362, 5714629.865071137],
    zoom: 9
  })
});
