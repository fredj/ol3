goog.provide('ol.style.Shape');

goog.require('ol.style.Image');
goog.require('ol.style.ImageState');



/**
 * @constructor
 * @param {olx.style.ShapeOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @api
 */
ol.style.Shape = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};
};
goog.inherits(ol.style.Shape, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getAnchor = function() {

};


/**
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Shape.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.getHitDetectionImage = function(pixelRatio) {

};


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getImage = function(pixelRatio) {

};


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.getImageState = function() {
  return ol.style.ImageState.LOADED;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Shape.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.listenImageChange = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.load = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.unlistenImageChange = goog.nullFunction;
