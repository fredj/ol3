// FIXME draw drag box
// FIXME works for View2D only

goog.provide('ol.interaction.DragZoom');

goog.require('goog.asserts');
goog.require('ol.Size');
goog.require('ol.View2D');
goog.require('ol.control.DragBox');
goog.require('ol.extent');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.condition');


/**
 * @define {number} Hysterisis pixels.
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED =
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS *
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;



/**
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.interaction.condition} that limits
 * it to when the shift key is held down.
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.DragZoomOptions=} opt_options Options.
 */
ol.interaction.DragZoom = function(opt_options) {

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.shiftKeyOnly;

  /**
   * @type {ol.control.DragBox}
   * @private
   */
  this.dragBox_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.pointerId_ = undefined;

  this.startCoordinate_ = null;

};
goog.inherits(ol.interaction.DragZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.handleDragEnd = function(mapBrowserEvent) {
  if (this.pointerId_ == mapBrowserEvent.pointerId) {
    this.dragBox_.setMap(null);
    this.dragBox_ = null;
    var offset = mapBrowserEvent.getPixel(); // FIXME
    var deltaX = offset[0] - this.startOffset_[0];
    var deltaY = offset[1] - this.startOffset_[1];

    if (deltaX * deltaX + deltaY * deltaY >=
        ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED) {
      var map = mapBrowserEvent.map;
      var extent = ol.extent.boundingExtent([
        this.startCoordinate_, mapBrowserEvent.getCoordinate()
      ]);
      map.withFrozenRendering(function() {
        // FIXME works for View2D only
        var view = map.getView();
        goog.asserts.assertInstanceof(view, ol.View2D);
        var mapSize = /** @type {ol.Size} */ (map.getSize());
        view.fitExtent(extent, mapSize);
        // FIXME we should preserve rotation
        view.setRotation(0);
      });
    }
    this.pointerId_ = undefined;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragZoom.prototype.handleDragStart = function(mapBrowserEvent) {
  if (!goog.isDef(this.pointerId_) && this.condition_(mapBrowserEvent)) {
    var pointerId = this.pointerId_ = mapBrowserEvent.pointerId;
    this.startCoordinate_ = mapBrowserEvent.getCoordinate();
    this.startOffset_ = mapBrowserEvent.getPixel();
    this.dragBox_ = new ol.control.DragBox({
      startCoordinate: this.startCoordinate_,
      condition: function(mapBrowserEvent) {
        return pointerId == mapBrowserEvent.pointerId;
      }
    });
    this.dragBox_.setMap(mapBrowserEvent.map);
    return true;
  }
};
