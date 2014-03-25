goog.provide('ol.DeviceMotion');
goog.provide('ol.DeviceMotionProperty');

goog.require('goog.events');
goog.require('goog.math');
goog.require('ol.BrowserFeature');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.DeviceMotionProperty = {
  ALPHA: 'alpha',
  BETA: 'beta',
  GAMMA: 'gamma',
  X: 'x',
  Y: 'y',
  Z: 'z',
  TRACKING: 'tracking'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Object=} opt_options Options.
 */
ol.DeviceMotion = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.listenerKey_ = null;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.DeviceMotionProperty.TRACKING),
      this.handleTrackingChanged_, false, this);

  this.setTracking(goog.isDef(options.tracking) ? options.tracking : false);

};
goog.inherits(ol.DeviceMotion, ol.Object);


/**
 * @inheritDoc
 */
ol.DeviceMotion.prototype.disposeInternal = function() {
  this.setTracking(false);
  goog.base(this, 'disposeInternal');
};


/**
 * Are we tracking the device's motion?
 * @return {boolean} The current tracking state, true if tracking is on.
 * @todo stability experimental
 */
ol.DeviceMotion.prototype.getTracking = function() {
  return /** @type {boolean} */ (
      this.get(ol.DeviceMotionProperty.TRACKING));
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'getTracking',
    ol.DeviceMotion.prototype.getTracking);


/**
 * @private
 */
ol.DeviceMotion.prototype.handleTrackingChanged_ = function() {
  if (ol.BrowserFeature.HAS_DEVICE_MOTION) {
    var tracking = this.getTracking();
    if (tracking && goog.isNull(this.listenerKey_)) {
      this.listenerKey_ = goog.events.listen(goog.global, 'devicemotion',
          this.motionChange_, false, this);
    } else if (!tracking && !goog.isNull(this.listenerKey_)) {
      goog.events.unlistenByKey(this.listenerKey_);
      this.listenerKey_ = null;
    }
  }
};


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent Event.
 */
ol.DeviceMotion.prototype.motionChange_ = function(browserEvent) {
  var event = /** @type {DeviceMotionEvent} */ (browserEvent.getBrowserEvent());
  // goog.isNull(event);
  var rotation = event.rotationRate;
  this.set(ol.DeviceMotionProperty.ALPHA, goog.math.toRadians(rotation.alpha));
  this.set(ol.DeviceMotionProperty.BETA, goog.math.toRadians(rotation.beta));
  this.set(ol.DeviceMotionProperty.GAMMA, goog.math.toRadians(rotation.gamma));

  var acceleration = event.accelerationIncludingGravity;
  this.set(ol.DeviceMotionProperty.X, acceleration.x);
  this.set(ol.DeviceMotionProperty.Y, acceleration.y);
  this.set(ol.DeviceMotionProperty.Z, acceleration.z);

  // console.log(acceleration.x, acceleration.y, acceleration.z);

  this.dispatchChangeEvent();
};


/**
 * Enable or disable tracking of DeviceMotion events.
 * @param {boolean} tracking True to enable and false to disable tracking.
 * @todo stability experimental
 */
ol.DeviceMotion.prototype.setTracking = function(tracking) {
  this.set(ol.DeviceMotionProperty.TRACKING, tracking);
};
goog.exportProperty(
    ol.DeviceMotion.prototype,
    'setTracking',
    ol.DeviceMotion.prototype.setTracking);
