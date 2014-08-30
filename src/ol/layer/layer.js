goog.provide('ol.layer.Layer');
goog.provide('ol.layer.LayerOptions');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.layer.Base');
goog.require('ol.source.Source');


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     hue: (number|undefined),
 *     opacity: (number|undefined),
 *     saturation: (number|undefined),
 *     source: ol.source.Source,
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 */
ol.layer.LayerOptions;



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * @constructor
 * @extends {ol.layer.Base}
 * @fires ol.render.Event
 * @fires change Triggered when the state of the source changes.
 * @param {ol.layer.LayerOptions} options Layer options.
 * @api stable
 */
ol.layer.Layer = function(options) {

  goog.base(this, {
    brightness: options.brightness,
    contrast: options.contrast,
    hue: options.hue,
    opacity: options.opacity,
    saturation: options.saturation,
    visible: options.visible,
    extent: options.extent,
    minResolution: options.minResolution,
    maxResolution: options.maxResolution
  });

  /**
   * @private
   * @type {ol.source.Source}
   */
  this.source_ = options.source;

  goog.events.listen(this.source_, goog.events.EventType.CHANGE,
      this.handleSourceChange_, false, this);

};
goog.inherits(ol.layer.Layer, ol.layer.Base);


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
ol.layer.Layer.visibleAtResolution = function(layerState, resolution) {
  return layerState.visible && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
};


/**
 * @inheritDoc
 */
ol.layer.Layer.prototype.getLayersArray = function(opt_array) {
  var array = (goog.isDef(opt_array)) ? opt_array : [];
  array.push(this);
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.Layer.prototype.getLayerStatesArray = function(opt_states) {
  var states = (goog.isDef(opt_states)) ? opt_states : [];
  states.push(this.getLayerState());
  return states;
};


/**
 * @return {ol.source.Source} Source.
 * @api stable
 */
ol.layer.Layer.prototype.getSource = function() {
  return this.source_;
};


/**
  * @inheritDoc
  */
ol.layer.Layer.prototype.getSourceState = function() {
  return this.getSource().getState();
};


/**
 * @private
 */
ol.layer.Layer.prototype.handleSourceChange_ = function() {
  this.dispatchChangeEvent();
};
