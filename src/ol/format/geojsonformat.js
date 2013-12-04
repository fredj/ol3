// FIXME coordinate order
// FIXME reprojection
// FIXME GeometryCollection

goog.provide('ol.format.GeoJSON');
goog.provide('ol.format.GeoJSONFeature');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.format.ISerializableFeature');
goog.require('ol.format.JSON');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.Feature}
 * @implements {ol.format.ISerializableFeature}
 * @param {Object} object Object.
 */
ol.format.GeoJSONFeature = function(object) {

  goog.base(this, null);

  this.read(object);

};
goog.inherits(ol.format.GeoJSONFeature, ol.Feature);


/**
 * @inheritDoc
 */
ol.format.GeoJSONFeature.prototype.read = function(source) {
  goog.asserts.assert(goog.isObject(source));
  var feature = /** @type {GeoJSONFeature} */ (source);
  var geometry = ol.format.GeoJSON.readGeometry_(feature.geometry);
  this.setGeometry(geometry);
  this.setId(feature.id);
  if (goog.isDef(feature.properties)) {
    this.setValues(feature.properties);
  }
  return this;
};


/**
 * @inheritDoc
 */
ol.format.GeoJSONFeature.prototype.write = function() {
  var object = {
    'type': 'Feature'
  };
  var id = this.getId();
  if (goog.isDefAndNotNull(id)) {
    goog.object.set(object, 'id', id);
  }
  var geometry = this.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    goog.object.set(
        object, 'geometry', ol.format.GeoJSON.writeGeometry_(geometry));
  }
  var properties = this.getProperties();
  goog.object.remove(properties, 'geometry');
  if (!goog.object.isEmpty(properties)) {
    goog.object.set(object, 'properties', properties);
  }
  return object;
};



/**
 * @constructor
 * @extends {ol.format.JSON}
 * @param {ol.format.GeoJSONOptions=} opt_options Options.
 */
ol.format.GeoJSON = function(opt_options) {
};
goog.inherits(ol.format.GeoJSON, ol.format.JSON);


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.GeoJSON.readGeometry_ = function(object) {
  var geometryReader = ol.format.GeoJSON.GEOMETRY_READERS_[object.type];
  goog.asserts.assert(goog.isDef(geometryReader));
  return geometryReader(object);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Point} Point.
 */
ol.format.GeoJSON.readPointGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'Point');
  return new ol.geom.Point(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
ol.format.GeoJSON.readLineStringGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'LineString');
  return new ol.geom.LineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiLineString} MultiLineString.
 */
ol.format.GeoJSON.readMultiLineStringGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'MultiLineString');
  return new ol.geom.MultiLineString(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPoint} MultiPoint.
 */
ol.format.GeoJSON.readMultiPointGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'MultiPoint');
  return new ol.geom.MultiPoint(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.MultiPolygon} MultiPolygon.
 */
ol.format.GeoJSON.readMultiPolygonGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'MultiPolygon');
  return new ol.geom.MultiPolygon(object.coordinates);
};


/**
 * @param {GeoJSONGeometry} object Object.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
ol.format.GeoJSON.readPolygonGeometry_ = function(object) {
  goog.asserts.assert(object.type == 'Polygon');
  return new ol.geom.Polygon(object.coordinates);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeGeometry_ = function(geometry) {
  var geometryWriter = ol.format.GeoJSON.GEOMETRY_WRITERS_[geometry.getType()];
  goog.asserts.assert(goog.isDef(geometryWriter));
  return geometryWriter(geometry);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeLineStringGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'LineString',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeMultiLineStringGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString);
  goog.asserts.assert(
      geometry.getType() == ol.geom.GeometryType.MULTI_LINE_STRING);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'MultiLineString',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeMultiPointGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPoint);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'MultiPoint',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writeMultiPolygonGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.MultiPolygon);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'MultiPolygon',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writePointGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Point);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'Point',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @private
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
ol.format.GeoJSON.writePolygonGeometry_ = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
  return /** @type {GeoJSONGeometry} */ ({
    'type': 'Polygon',
    'coordinates': geometry.getCoordinates()
  });
};


/**
 * @const
 * @private
 * @type {Object.<string, function(GeoJSONGeometry): ol.geom.Geometry>}
 */
ol.format.GeoJSON.GEOMETRY_READERS_ = {
  'Point': ol.format.GeoJSON.readPointGeometry_,
  'LineString': ol.format.GeoJSON.readLineStringGeometry_,
  'Polygon': ol.format.GeoJSON.readPolygonGeometry_,
  'MultiPoint': ol.format.GeoJSON.readMultiPointGeometry_,
  'MultiLineString': ol.format.GeoJSON.readMultiLineStringGeometry_,
  'MultiPolygon': ol.format.GeoJSON.readMultiPolygonGeometry_
};


/**
 * @const
 * @private
 * @type {Object.<string, function(ol.geom.Geometry): GeoJSONGeometry>}
 */
ol.format.GeoJSON.GEOMETRY_WRITERS_ = {
  'Point': ol.format.GeoJSON.writePointGeometry_,
  'LineString': ol.format.GeoJSON.writeLineStringGeometry_,
  'Polygon': ol.format.GeoJSON.writePolygonGeometry_,
  'MultiPoint': ol.format.GeoJSON.writeMultiPointGeometry_,
  'MultiLineString': ol.format.GeoJSON.writeMultiLineStringGeometry_,
  'MultiPolygon': ol.format.GeoJSON.writeMultiPolygonGeometry_
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readFeatureFromObject = function(object) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  goog.asserts.assert(geoJSONObject.type == 'Feature');
  return new ol.format.GeoJSONFeature(geoJSONObject);
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readFeaturesFromObject = function(object) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  if (geoJSONObject.type == 'Feature') {
    return [this.readFeatureFromObject(object)];
  } else if (geoJSONObject.type == 'FeatureCollection') {
    var geoJSONFeatureCollection = /** @type {GeoJSONFeatureCollection} */
        (object);
    /** @type {Array.<ol.Feature>} */
    var features = [];
    var geoJSONFeatures = geoJSONFeatureCollection.features;
    var i, ii;
    for (i = 0, ii = geoJSONFeatures.length; i < ii; ++i) {
      features.push(this.readFeatureFromObject(geoJSONFeatures[i]));
    }
    return features;
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readGeometryFromObject = function(object) {
  return ol.format.GeoJSON.readGeometry_(
      /** @type {GeoJSONGeometry} */ (object));
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.readProjection = function(object) {
  var geoJSONObject = /** @type {GeoJSONObject} */ (object);
  var crs = geoJSONObject.crs;
  if (goog.isDefAndNotNull(crs)) {
    if (crs.type == 'name') {
      return ol.proj.get(crs.properties.name);
    } else {
      goog.asserts.fail();
      return null;
    }
  } else {
    return ol.proj.get('EPSG:4326');
  }
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.writeFeatureObject = function(feature) {
  var geoJSONFeature = feature instanceof ol.format.GeoJSONFeature ?
      feature : new ol.format.GeoJSONFeature(feature.getProperties());
  return geoJSONFeature.write();
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.writeFeaturesObject = function(features) {
  var objects = [];
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    objects.push(this.writeFeatureObject(features[i]));
  }
  return /** @type {GeoJSONFeatureCollection} */ ({
    'type': 'FeatureCollection',
    'features': objects
  });
};


/**
 * @inheritDoc
 */
ol.format.GeoJSON.prototype.writeGeometryObject =
    ol.format.GeoJSON.writeGeometry_;
