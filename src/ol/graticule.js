goog.provide('ol.Graticule');

goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.flat.geodesic');
goog.require('ol.proj');
goog.require('ol.render.EventType');
goog.require('ol.style.Stroke');



/**
 * @constructor
 * @param {olx.GraticuleOptions=} opt_options Options.
 * @todo api
 */
ol.Graticule = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {ol.Map}
   * @private
   */
  this.map_ = null;

  /**
   * @type {ol.proj.Projection}
   * @private
   */
  this.projection_ = null;

  /**
   * @type {number}
   * @private
   */
  this.maxLat_ = Infinity;

  /**
   * @type {number}
   * @private
   */
  this.maxLon_ = Infinity;

  /**
   * @type {number}
   * @private
   */
  this.minLat_ = -Infinity;

  /**
   * @type {number}
   * @private
   */
  this.minLon_ = -Infinity;

  /**
   * @type {number}
   * @private
   */
  this.targetSize_ = goog.isDef(options.targetSize) ?
      options.targetSize : 100;

  /**
   * @type {Array.<ol.geom.LineString>}
   * @private
   */
  this.meridians_ = [];

  /**
   * @type {Array.<ol.geom.LineString>}
   * @private
   */
  this.parallels_ = [];

  /**
   * TODO can be configurable
   * @type {ol.style.Stroke}
   * @private
   */
  this.strokeStyle_ = new ol.style.Stroke({
    color: 'rgba(0,0,0,0.2)'
  });

  /**
   * @type {ol.TransformFunction|undefined}
   * @private
   */
  this.fromLonLatTransform_ = undefined;

  /**
   * @type {ol.TransformFunction|undefined}
   * @private
   */
  this.toLonLatTransform_ = undefined;

  /**
   * @type {ol.Coordinate}
   * @private
   */
  this.projectionCenterLonLat_ = null;

  this.setMap(goog.isDef(options.map) ? options.map : null);
};


/**
 * TODO can be configurable
 * @type {Array.<number>}
 * @private
 */
ol.Graticule.intervals_ = [90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05,
  0.01, 0.005, 0.002, 0.001];


/**
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} squaredTolerance Squared tolerance.
 * @private
 */
ol.Graticule.prototype.createGraticule_ =
    function(center, resolution, squaredTolerance) {

  var interval = this.getInterval_(resolution);
  if (interval == -1) {
    this.meridians_.length = this.parallels_.length = 0;
    return;
  }

  var centerLonLat = this.toLonLatTransform_(center);
  var centerLon = centerLonLat[0];
  var centerLat = centerLonLat[1];
  var cnt, lat, lon;

  // Create meridians

  centerLon = Math.floor(centerLon / interval) * interval;
  lon = goog.math.clamp(centerLon, this.minLon_, this.maxLon_);

  cnt = 0;
  this.meridians_[cnt++] = this.getMeridian_(lon, squaredTolerance);

  while (lon != this.minLon_) {
    lon = Math.max(lon - interval, this.minLon_);
    this.meridians_[cnt++] = this.getMeridian_(lon, squaredTolerance);
  }

  lon = goog.math.clamp(centerLon, this.minLon_, this.maxLon_);

  while (lon != this.maxLon_) {
    lon = Math.min(lon + interval, this.maxLon_);
    this.meridians_[cnt++] = this.getMeridian_(lon, squaredTolerance);
  }

  this.meridians_.length = cnt;

  // Create parallels

  centerLat = Math.floor(centerLat / interval) * interval;
  lat = goog.math.clamp(centerLat, this.minLat_, this.maxLat_);

  cnt = 0;
  this.parallels_[cnt++] = this.getParallel_(lat, squaredTolerance);

  while (lat != this.minLat_) {
    lat = Math.max(lat - interval, this.minLat_);
    this.parallels_[cnt++] = this.getParallel_(lat, squaredTolerance);
  }

  lat = goog.math.clamp(centerLat, this.minLat_, this.maxLat_);

  while (lat != this.maxLat_) {
    lat = Math.min(lat + interval, this.maxLat_);
    this.parallels_[cnt++] = this.getParallel_(lat, squaredTolerance);
  }

  this.parallels_.length = cnt;
};


/**
 * @param {number} resolution Resolution.
 * @return {number} The interval in degrees.
 * @private
 */
ol.Graticule.prototype.getInterval_ = function(resolution) {
  var centerLon = this.projectionCenterLonLat_[0];
  var centerLat = this.projectionCenterLonLat_[1];
  var interval = -1;
  var i, ii, delta, dist;
  var target = Math.pow(this.targetSize_ * resolution, 2);
  /** @type {Array.<number>} **/
  var p1 = [];
  /** @type {Array.<number>} **/
  var p2 = [];
  for (i = 0, ii = ol.Graticule.intervals_.length; i < ii; ++i) {
    delta = ol.Graticule.intervals_[i] / 2;
    p1[0] = centerLon - delta;
    p1[1] = centerLat - delta;
    p2[0] = centerLon + delta;
    p2[1] = centerLat + delta;
    this.fromLonLatTransform_(p1, p1);
    this.fromLonLatTransform_(p2, p2);
    dist = Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2);
    if (dist <= target) {
      break;
    }
    interval = ol.Graticule.intervals_[i];
  }
  return interval;
};


/**
 * @return {ol.Map} The map.
 * @todo api
 */
ol.Graticule.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {number} lon Longitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.LineString} The meridian line string.
 * @private
 */
ol.Graticule.prototype.getMeridian_ = function(lon, squaredTolerance) {
  goog.asserts.assert(lon >= this.minLon_);
  goog.asserts.assert(lon <= this.maxLon_);
  var flatCoordinates = ol.geom.flat.geodesic.meridian(lon,
      this.minLat_, this.maxLat_, this.projection_, squaredTolerance);
  goog.asserts.assert(flatCoordinates.length > 0);
  var lineString = new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * @return {Array.<ol.geom.LineString>} The meridians.
 * @todo api
 */
ol.Graticule.prototype.getMeridians = function() {
  return this.meridians_;
};


/**
 * @param {number} lat Latitude.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.LineString} The parallel line string.
 * @private
 */
ol.Graticule.prototype.getParallel_ = function(lat, squaredTolerance) {
  goog.asserts.assert(lat >= this.minLat_);
  goog.asserts.assert(lat <= this.maxLat_);
  var flatCoordinates = ol.geom.flat.geodesic.parallel(lat,
      this.minLon_, this.maxLon_, this.projection_, squaredTolerance);
  goog.asserts.assert(flatCoordinates.length > 0);
  var lineString = new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return lineString;
};


/**
 * @return {Array.<ol.geom.LineString>} The parallels.
 * @todo api
 */
ol.Graticule.prototype.getParallels = function() {
  return this.parallels_;
};


/**
 * @param {ol.render.Event} e Event.
 * @private
 */
ol.Graticule.prototype.handlePostCompose_ = function(e) {
  var vectorContext = e.vectorContext;
  var frameState = e.frameState;
  var view2DState = frameState.view2DState;
  var center = view2DState.center;
  var projection = view2DState.projection;
  var resolution = view2DState.resolution;
  var pixelRatio = frameState.pixelRatio;
  var squaredTolerance =
      resolution * resolution / (4 * pixelRatio * pixelRatio);

  if (goog.isNull(this.projection_) ||
      !ol.proj.equivalent(this.projection_, projection)) {
    this.updateProjectionInfo_(projection);
  }

  // Create the graticule
  this.createGraticule_(center, resolution, squaredTolerance);

  // Draw the lines
  vectorContext.setFillStrokeStyle(null, this.strokeStyle_);
  var i, l, line;
  for (i = 0, l = this.meridians_.length; i < l; ++i) {
    line = this.meridians_[i];
    vectorContext.drawLineStringGeometry(line, null);
  }
  for (i = 0, l = this.parallels_.length; i < l; ++i) {
    line = this.parallels_[i];
    vectorContext.drawLineStringGeometry(line, null);
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @private
 */
ol.Graticule.prototype.updateProjectionInfo_ = function(projection) {
  goog.asserts.assert(!goog.isNull(projection));

  var extent = projection.getExtent();
  var maxLat = projection.getMaxLat();
  var maxLon = projection.getMaxLon();
  var minLat = projection.getMinLat();
  var minLon = projection.getMinLon();

  goog.asserts.assert(!goog.isNull(extent));
  goog.asserts.assert(goog.isDef(maxLat));
  goog.asserts.assert(goog.isDef(maxLon));
  goog.asserts.assert(goog.isDef(minLat));
  goog.asserts.assert(goog.isDef(minLon));

  this.maxLat_ = maxLat;
  this.maxLon_ = maxLon;
  this.minLat_ = minLat;
  this.minLon_ = minLon;

  var epsg4326Projection = ol.proj.get('EPSG:4326');

  this.fromLonLatTransform_ = ol.proj.getTransform(
      epsg4326Projection, projection);

  this.toLonLatTransform_ = ol.proj.getTransform(
      projection, epsg4326Projection);

  this.projectionCenterLonLat_ = this.toLonLatTransform_(
      ol.extent.getCenter(extent));

  this.projection_ = projection;
};


/**
 * @param {ol.Map} map Map.
 * @todo api
 */
ol.Graticule.prototype.setMap = function(map) {
  if (!goog.isNull(this.map_)) {
    this.map_.un(ol.render.EventType.POSTCOMPOSE,
        this.handlePostCompose_, this);
    this.map_.render();
  }
  if (!goog.isNull(map)) {
    map.on(ol.render.EventType.POSTCOMPOSE,
        this.handlePostCompose_, this);
    map.render();
  }
  this.map_ = map;
};
