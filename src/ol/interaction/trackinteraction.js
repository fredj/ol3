goog.provide('ol.interaction.Track');
goog.provide('ol.interaction.TrackEventType');
goog.provide('ol.interaction.TrackOptions');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.coordinate');
goog.require('ol.geom.LineString');
goog.require('ol.interaction.Pointer');
goog.require('ol.style.Fill');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


/**
 * @typedef {{
 *    elevation: (boolean),
 *    snap: (boolean),
 *    style:(ol.style.Style|Array.<ol.style.Style>|ol.style.StyleFunction|undefined),
 *    sketchStyle:(ol.style.Style|Array.<ol.style.Style>|ol.style.StyleFunction|undefined)
 * }}
 * @api
 */
ol.interaction.TrackOptions;


/**
 * @enum {string}
 */
ol.interaction.TrackEventType = {
  /**
   * Triggered when the track has changed.
   * @event goog.events.Event#trackchanged
   */
  TRACKCHANGED: 'trackchanged',

  /**
   * Triggered when a segment has changed.
   * @event goog.events.Event#trackchanged
   */
  SEGMENTCHANGED: 'segmentchanged'
};



/**
 * Base interaction to draw or modify a track.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {ol.interaction.TrackOptions=} opt_options Options
 * @api
 */
ol.interaction.Track = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * Request elevation data from OSRM?
   * @type {boolean}
   */
  this.elevation = goog.isDef(options.elevation) ? options.elevation : true;

  /**
   * Should the points and segments be snapped?
   * @type {boolean}
   */
  this.snap = goog.isDef(options.snap) ? options.snap : true;

  /**
   * If the distance between the original point and the mapped point
   * on the network is less than this tolerance, the point is snapped.
   * @type {number}
   */
  this.snapTolerance = 15;

  /**
   * @type {string}
   */
  this.osrmProfile = 'neutral';

  /**
   * @type {string}
   */
  this.baseOsrmUrl = 'http://chmobil-osrm.dev.bgdi.ch/';

  /**
   * @type {string}
   */
  this.osrmLocateUrl = this.baseOsrmUrl + '{profile}/nearest?loc={point}';

  /**
   * @type {string}
   */
  this.osrmRoutingUrl =
      this.baseOsrmUrl +
      '{profile}/viaroute?loc={from}&loc={to}&instructions=false&alt=false' +
      '&z={zoom}&output=json&elevation={elevation}';

  var defaultStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#d80000',
      width: 3
    }),
    image: new ol.style.RegularShape({
      stroke: new ol.style.Stroke({
        color: '#d80000',
        width: 2
      }),
      fill: new ol.style.Fill({
        color: 'rgba(216, 0, 0, 0.5)'
      }),
      points: 4,
      radius: 6,
      angle: Math.PI / 4
    })
  });

  var defaultSketchStyle = new ol.style.Style({
    image: new ol.style.RegularShape({
      stroke: new ol.style.Stroke({
        color: '#d80000',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(216, 0, 0, 0.5)'
      }),
      points: 4,
      radius: 6,
      angle: Math.PI / 4
    })
  });

  this.style = goog.isDef(options.style) ? options.style : [defaultStyle];
  this.sketchStyle = goog.isDef(options.sketchStyle) ?
      options.sketchStyle : [defaultSketchStyle];

  /**
   * The control points of the track.
   * @type {Array.<ol.Feature>}
   */
  this.controlPoints = [];

  /**
   * The segments of the track.
   * @type {Array.<ol.Feature>}
   */
  this.segments = [];

  /**
   * The overlay for the track control points.
   * @type {ol.FeatureOverlay}
   */
  this.pointOverlay = new ol.FeatureOverlay({
    style: this.style
  });

  /**
   * The overlay for the track segments.
   * @type {ol.FeatureOverlay}
   */
  this.segmentOverlay = new ol.FeatureOverlay({
    style: this.style
  });

};
goog.inherits(ol.interaction.Track, ol.interaction.Pointer);


/**
 * @api
 */
ol.interaction.Track.prototype.clear = function() {
  this.pointOverlay.getFeatures().clear();
  this.segmentOverlay.getFeatures().clear();
  this.controlPoints.length = 0;
  this.segments.length = 0;
};


/**
 * @return {boolean} Snap?
 * @api
 */
ol.interaction.Track.prototype.getSnap = function() {
  return this.snap;
};


/**
 * @param {boolean} snap Snap?
 * @api
 */
ol.interaction.Track.prototype.setSnap = function(snap) {
  this.snap = snap;
};


/**
 * @return {string} The OSRM profile used.
 * @api
 */
ol.interaction.Track.prototype.getProfile = function() {
  return this.osrmProfile;
};


/**
 * @param {string} profile The OSRM profile to use.
 * @api
 */
ol.interaction.Track.prototype.setProfile = function(profile) {
  this.osrmProfile = profile;
};


/**
 * Returns a single 'XY' ol.geom.LineString from the segments.
 * @return {ol.geom.LineString}
 * @api
 */
ol.interaction.Track.prototype.getLineString = function() {
  var flatCoordinates = [];
  var segment, geometry, flat, stride;
  for (var i = 0, ii = this.segments.length; i < ii; i++) {
    segment = this.segments[i];
    geometry = /** @type {ol.geom.LineString} */ (segment.getGeometry());
    flat = geometry.getFlatCoordinates();
    stride = geometry.getStride();
    if (stride == 3) {
      for (var j = 0, jj = flat.length - 1; j < jj; j += 3) {
        flatCoordinates = flatCoordinates.concat(flat.slice(j, j + 2));
      }
    } else {
      goog.asserts.assert(stride == 2);
    }
  }
  var line = new ol.geom.LineString(null);
  line.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  return line;
};


/**
 * @return {Array.<Array.<number>>}
 * @api
 */
ol.interaction.Track.prototype.getHeightProfile = function() {
  var distance = 0;
  var profile = [];
  var previous = null;

  for (var i = 0, ii = this.segments.length; i < ii; i++) {
    var linestring =
        /** @type {ol.geom.LineString} */ (this.segments[i].getGeometry());
    var coordinates = linestring.getCoordinates();
    for (var j = 0, jj = coordinates.length; j < jj; j++) {
      var coordinate = coordinates[j];
      if (!goog.isNull(previous)) {
        var squared = ol.coordinate.squaredDistance(coordinate, previous);
        distance += Math.sqrt(squared);
      }
      profile.push([
        coordinate[0],
        coordinate[1],
        coordinate[2] * 10000,
        distance
      ]);
      previous = coordinate;
    }
  }
  return profile;
};


/**
 * @return {boolean} Does the track have points?
 * @api
 */
ol.interaction.Track.prototype.hasPoints = function() {
  return this.controlPoints.length > 0;
};


/**
 * @inheritDoc
 */
ol.interaction.Track.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);

  this.pointOverlay.setMap(map);
  this.segmentOverlay.setMap(map);
};


/**
 * @protected
 */
ol.interaction.Track.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(new goog.events.Event(
      ol.interaction.TrackEventType.TRACKCHANGED));
};


/**
 * @protected
 */
ol.interaction.Track.prototype.dispatchSegmentChangeEvent = function() {
  this.dispatchEvent(new goog.events.Event(
      ol.interaction.TrackEventType.SEGMENTCHANGED));
};
