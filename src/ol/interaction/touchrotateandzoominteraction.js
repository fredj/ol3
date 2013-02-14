// FIXME works for View2D only

goog.provide('ol.interaction.TouchRotateAndZoom');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Pixel');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Touch');



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 */
ol.interaction.TouchRotateAndZoom = function() {

  goog.base(this);

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastDistance_;

};
goog.inherits(ol.interaction.TouchRotateAndZoom, ol.interaction.Touch);


/**
 * @private
 */
ol.interaction.TouchRotateAndZoom.prototype.reset_ = function() {
  this.lastDistance_ = undefined;
  this.lastAngle_ = undefined;
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotateAndZoom.prototype.handleTouchMove = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 2);
  var scaleDelta = 1.0;
  var rotationDelta = 0.0;

  var centroid = ol.interaction.Touch.centroid(this.targetTouches);

  var touch0 = this.targetTouches[0];
  var touch1 = this.targetTouches[1];
  var dx = touch0.clientX - touch1.clientX;
  var dy = touch0.clientY - touch1.clientY;

  // angle between touches
  var angle = Math.atan2(
      touch1.clientY - touch0.clientY,
      touch1.clientX - touch0.clientX);

  // distance between touches
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (goog.isDef(this.lastDistance_)) {
    scaleDelta = this.lastDistance_ / distance;
  }
  this.lastDistance_ = distance;

  if (goog.isDef(this.lastAngle_)) {
    rotationDelta = angle - this.lastAngle_;
  }
  this.lastAngle_ = angle;

  var map = mapBrowserEvent.map;
  var view = map.getView();

  // rotate / scale anchor point.
  // FIXME: should be the intersection point between the lines:
  //     touch0,touch1 and previousTouch0,previousTouch1
  var viewportPosition = goog.style.getClientPosition(map.getViewport());
  centroid.x -= viewportPosition.x;
  centroid.y -= viewportPosition.y;
  var anchor = map.getCoordinateFromPixel(centroid);

  //var anchor = ol.Projection.transformWithCodes(new ol.Coordinate(-0.12755, 51.507222), 'EPSG:4326', 'EPSG:3857');

  // scale
  view.zoom_(map, view.getResolution() * scaleDelta, anchor);

  // rotate
  view.rotate(map, view.getRotation() + rotationDelta, anchor);

};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotateAndZoom.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  if (this.targetTouches.length < 2) {
    var view = mapBrowserEvent.map.getView();
    view.setHint(ol.ViewHint.PANNING, -1);
    return false;
  } else {
    this.reset_();
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotateAndZoom.prototype.handleTouchStart =
    function(mapBrowserEvent) {
  if (this.targetTouches.length >= 2) {
    var view = mapBrowserEvent.map.getView();
    this.reset_();
    view.setHint(ol.ViewHint.PANNING, 1);
    return true;
  } else {
    return false;
  }
};
