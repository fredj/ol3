goog.require('ol.Graticule');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.GeoJSON');

Proj4js.defs['ESRI:53009'] = '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +a=6371000 ' +
    '+b=6371000 +units=m +no_defs';

// Configure the Sphere Mollweide projection object with an extent,
// and max/min lon/lat values. These are required for the Graticule.
var sphereMollweideProjection = ol.proj.configureProj4jsProjection({
  code: 'ESRI:53009',
  extent: [-9009954.605703328, -9009954.605703328,
           9009954.605703328, 9009954.605703328],
  maxLat: 90,
  maxLon: 179,
  minLat: -90,
  minLon: -179
});

ol.proj.configureProj4jsProjection({
  code: 'EPSG:4326',
  extent: [-180, -90, 180, 90],
  maxLat: 90,
  maxLon: 180,
  minLat: -90,
  minLon: -180
});

var map = new ol.Map({
  keyboardEventTarget: document,
  layers: [
    new ol.layer.Vector({
      source: new ol.source.GeoJSON({
        projection: sphereMollweideProjection,
        url: 'data/geojson/countries-110m.geojson'
      })
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    projection: sphereMollweideProjection,
    resolutions: [65536, 32768, 16384, 8192, 4096, 2048],
    zoom: 0
  })
});

var graticule = new ol.Graticule({
  map: map,
  projection: 'ESRI:53009'
});
