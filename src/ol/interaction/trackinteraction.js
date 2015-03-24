goog.provide('ol.interaction.Track');
goog.provide('ol.interaction.TrackEventType');
goog.provide('ol.interaction.TrackOptions');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.interaction.Pointer');
goog.require('ol.style.Fill');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


/**
 * @typedef {{
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
  TRACKCHANGED: 'trackchanged'
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

  goog.base(this, {});

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
  this.osrmProfile = 'quiet';
  // this.osrmProfile = 'neutral';

  // this.baseOsrmUrl = 'http://chmobil-osrm.dev.bgdi.ch/';
  this.baseOsrmUrl =
      'http://provelobern-geomapfish.prod.sig.cloud.camptocamp.net/';

  this.osrmLocateUrl = this.baseOsrmUrl + '{profile}/nearest?loc={point}';

  this.osrmRoutingUrl =
      this.baseOsrmUrl +
      '{profile}/viaroute?loc={from}&loc={to}&instructions=false&alt=false' +
      '&z={zoom}&output=json';

  var defaulStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#d80000',
      width: 2
    }),
    image: new ol.style.RegularShape(
        /** @type {olx.style.RegularShapeOptions} */({
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
        }))
  });

  var defaulSketchStyle = new ol.style.Style({
    image: new ol.style.RegularShape(
        /** @type {olx.style.RegularShapeOptions} */({
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
        }))
  });

  this.style = goog.isDef(options.style) ? options.style : [defaulStyle];
  this.sketchStyle = goog.isDef(options.sketchStyle) ?
      options.sketchStyle : [defaulSketchStyle];

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
