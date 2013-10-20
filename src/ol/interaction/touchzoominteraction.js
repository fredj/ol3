// FIXME works for View2D only

goog.provide('ol.interaction.TouchZoom');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Coordinate');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.Interaction');



/**
 * Allows the user to zoom the map by pinching with two fingers
 * on a touch screen.
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.TouchZoomOptions=} opt_options Options.
 */
ol.interaction.TouchZoom = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = goog.isDef(options.duration) ? options.duration : 400;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastDistance_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.lastScaleDelta_ = 1;


  this.positions_ = {};

};
goog.inherits(ol.interaction.TouchZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleDrag = function(event) {
  var pointerId = event.pointerId;
  if (goog.object.containsKey(this.positions_, pointerId)) {
    this.positions_[pointerId] = event.getPixel();
  }
  if (goog.object.getCount(this.positions_) == 2) {
    var scaleDelta = 1.0;
    var touches = goog.object.getValues(this.positions_);
    var dx = touches[0][0] - touches[1][0];
    var dy = touches[0][1] - touches[1][1];
    // distance between touches
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (goog.isDef(this.lastDistance_)) {
      scaleDelta = this.lastDistance_ / distance;
    }
    this.lastDistance_ = distance;
    if (scaleDelta != 1.0) {
      this.lastScaleDelta_ = scaleDelta;
    }
    var map = event.map;
    // FIXME works for View2D only
    var view = map.getView().getView2D();
    var view2DState = view.getView2DState();

    // scale anchor point.
    var viewportPosition = goog.style.getClientPosition(map.getViewport());
    var centroid = [
      (touches[0][0] + touches[1][0]) / 2,
      (touches[0][1] + touches[1][1]) / 2
    ];
    centroid[0] -= viewportPosition.x;
    centroid[1] -= viewportPosition.y;
    this.anchor_ = map.getCoordinateFromPixel(centroid);

    // scale, bypass the resolution constraint
    map.requestRenderFrame();
    ol.interaction.Interaction.zoomWithoutConstraints(
        map, view, view2DState.resolution * scaleDelta, this.anchor_);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleDragEnd = function(event) {
  goog.object.remove(this.positions_, event.pointerId);
  if (goog.object.getCount(this.positions_) == 1) {
    var map = event.map;
    // FIXME works for View2D only
    var view = map.getView().getView2D();
    var view2DState = view.getView2DState();
    // Zoom to final resolution, with an animation, and provide a
    // direction not to zoom out/in if user was pinching in/out.
    // Direction is > 0 if pinching out, and < 0 if pinching in.
    var direction = this.lastScaleDelta_ - 1;
    ol.interaction.Interaction.zoom(map, view, view2DState.resolution,
        this.anchor_, this.duration_, direction);
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, -1);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchZoom.prototype.handleDown = function(event) {
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
    this.lastDistance_ = undefined;
    this.lastScaleDelta_ = 1;
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, +1);
  }
};
