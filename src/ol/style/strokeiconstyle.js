goog.provide('ol.style.StrokeIcon');



/**
 * @constructor
 * @param {olx.style.StrokeIconOptions=} opt_options Options.
 * @todo api
 */
ol.style.StrokeIcon = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.style.Image}
   */
  this.image_ = goog.isDef(options.image) ? options.image : null;

  /**
   * @private
   * @type {number}
   */
  this.offset_ = goog.isDef(options.offset) ? options.offset : 1;

  /**
   * @private
   * @type {number}
   */
  this.repeat_ = goog.isDef(options.repeat) ? options.repeat : 0;


};
