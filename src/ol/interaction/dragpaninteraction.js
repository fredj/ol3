// FIXME works for View2D only

goog.provide('ol.interaction.DragPan');

goog.require('goog.asserts');
goog.require('ol.Kinetic');
goog.require('ol.PreRenderFunction');
goog.require('ol.View2D');
goog.require('ol.ViewHint');
goog.require('ol.coordinate');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.condition');



/**
 * Allows the user to pan the map by clickng and dragging.
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.DragPanOptions=} opt_options Options.
 */
ol.interaction.DragPan = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.noModifierKeys;

  /**
   * @private
   * @type {ol.Kinetic|undefined}
   */
  this.kinetic_ = options.kinetic;

  /**
   * @private
   * @type {?ol.PreRenderFunction}
   */
  this.kineticPreRenderFn_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.pointerId_ = undefined;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.lastPixel_ = null;

};
goog.inherits(ol.interaction.DragPan, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  if (this.pointerId_ == mapBrowserEvent.pointerId) {
    var offset = mapBrowserEvent.getPixel();
    if (this.kinetic_) {
      this.kinetic_.update(offset[0], offset[1]);
    }
    var deltaX = this.lastPixel_[0] - offset[0];
    var deltaY = offset[1] - this.lastPixel_[1];
    var map = mapBrowserEvent.map;
    // FIXME works for View2D only
    var view = map.getView();
    goog.asserts.assertInstanceof(view, ol.View2D);
    var view2DState = view.getView2DState();
    var center = [deltaX, deltaY];
    ol.coordinate.scale(center, view2DState.resolution);
    ol.coordinate.rotate(center, view2DState.rotation);
    ol.coordinate.add(center, view2DState.center);
    center = view.constrainCenter(center);
    map.requestRenderFrame();
    view.setCenter(center);
    this.lastPixel_ = offset;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragEnd = function(mapBrowserEvent) {
  if (this.pointerId_ == mapBrowserEvent.pointerId) {
    // FIXME works for View2D only
    var map = mapBrowserEvent.map;
    var view = map.getView().getView2D();

    if (this.kinetic_ && this.kinetic_.end()) {
      var view2DState = view.getView2DState();
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      this.kineticPreRenderFn_ = this.kinetic_.pan(view2DState.center);
      map.beforeRender(this.kineticPreRenderFn_);

      var centerpx = map.getPixelFromCoordinate(view2DState.center);
      var dest = map.getCoordinateFromPixel([
        centerpx[0] - distance * Math.cos(angle),
        centerpx[1] - distance * Math.sin(angle)
      ]);
      dest = view.constrainCenter(dest);
      view.setCenter(dest);
    }
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, -1);

    this.pointerId_ = undefined;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  if (!goog.isDef(this.pointerId_) && this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    var view = map.getView().getView2D();
    this.pointerId_ = mapBrowserEvent.pointerId;
    this.lastPixel_ = mapBrowserEvent.getPixel();  // FIXME: null
    if (this.kinetic_) {
      this.kinetic_.begin();
      this.kinetic_.update(this.lastPixel_[0], this.lastPixel_[1]);
    }
    map.requestRenderFrame();
    view.setHint(ol.ViewHint.INTERACTING, +1);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDown = function(mapBrowserEvent) {
  // FIXME: reset lastPixel_ ?
  var map = mapBrowserEvent.map;
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assertInstanceof(view, ol.View2D);
  goog.asserts.assert(!goog.isNull(mapBrowserEvent.frameState));
  if (!goog.isNull(this.kineticPreRenderFn_) &&
      map.removePreRenderFunction(this.kineticPreRenderFn_)) {
    map.requestRenderFrame();
    view.setCenter(mapBrowserEvent.frameState.view2DState.center);
    this.kineticPreRenderFn_ = null;
  }
};
