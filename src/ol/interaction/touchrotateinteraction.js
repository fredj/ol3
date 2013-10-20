// FIXME works for View2D only

goog.provide('ol.interaction.TouchRotate');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.Interaction');


/**
 * @define {number} Animation duration.
 */
ol.interaction.TOUCHROTATE_ANIMATION_DURATION = 250;



/**
 * Allows the user to rotate the map by twisting with two fingers
 * on a touch screen.
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.TouchRotateOptions=} opt_options Options.
 */
ol.interaction.TouchRotate = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

  /**
   * @private
   * @type {boolean}
   */
  this.rotating_ = false;

  /**
   * @private
   * @type {number}
   */
  this.rotationDelta_ = 0.0;

  /**
   * @private
   * @type {number}
   */
  this.threshold_ = goog.isDef(options.threshold) ? options.threshold : 0.3;

  this.positions_ = {};

};
goog.inherits(ol.interaction.TouchRotate, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleDrag = function(event) {
  var pointerId = event.pointerId;
  if (goog.object.containsKey(this.positions_, pointerId)) {
    this.positions_[pointerId] = event.getPixel();
  }
  if (goog.object.getCount(this.positions_) == 2) {
    var rotationDelta = 0.0;
    var touches = goog.object.getValues(this.positions_);
    // angle between touches
    var angle = Math.atan2(
        touches[1][1] - touches[0][1],
        touches[1][0] - touches[0][0]);
    if (goog.isDef(this.lastAngle_)) {
      var delta = angle - this.lastAngle_;
      this.rotationDelta_ += delta;
      if (!this.rotating_ &&
          Math.abs(this.rotationDelta_) > this.threshold_) {
        this.rotating_ = true;
      }
      rotationDelta = delta;
    }
    this.lastAngle_ = angle;

    var map = event.map;

    // rotate anchor point.
    // FIXME: should be the intersection point between the lines:
    //     touch0,touch1 and previousTouch0,previousTouch1
    var viewportPosition = goog.style.getClientPosition(map.getViewport());
    var centroid = [
      (touches[0][0] + touches[1][0]) / 2,
      (touches[0][1] + touches[1][1]) / 2
    ];
    centroid[0] -= viewportPosition.x;
    centroid[1] -= viewportPosition.y;
    this.anchor_ = map.getCoordinateFromPixel(centroid);

    // rotate
    if (this.rotating_) {
      // FIXME works for View2D only
      var view = map.getView().getView2D();
      var view2DState = view.getView2DState();
      map.requestRenderFrame();
      ol.interaction.Interaction.rotateWithoutConstraints(map, view,
          view2DState.rotation + rotationDelta, this.anchor_);
    }
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleDragEnd = function(event) {
  goog.object.remove(this.positions_, event.pointerId);
  if (goog.object.getCount(this.positions_) == 1) {
    var map = event.map;
    // FIXME works for View2D only
    var view = map.getView().getView2D();
    var view2DState = view.getView2DState();
    if (this.rotating_) {
      ol.interaction.Interaction.rotate(
          map, view, view2DState.rotation, this.anchor_,
          ol.interaction.TOUCHROTATE_ANIMATION_DURATION);
    }
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, -1);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchRotate.prototype.handleDown = function(event) {
  var pointerId = event.pointerId;
  // capture the first two touches
  if (goog.object.getCount(this.positions_) <= 2) {
    goog.asserts.assert(!goog.isDef(this.positions_[pointerId]));
    this.positions_[pointerId] = event.getPixel();
  }
  if (goog.object.getCount(this.positions_) == 2) {
    var map = event.map;
    // FIXME works for View2D only
    var view = map.getView().getView2D();
    this.anchor_ = null;
    this.lastAngle_ = undefined;
    this.rotating_ = false;
    this.rotationDelta_ = 0.0;
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, +1);
  }
};
