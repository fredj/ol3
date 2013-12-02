goog.provide('ol.canvas');

goog.require('goog.dom');
goog.require('goog.dom.TagName');


/**
 * Is supported.
 * @const
 * @type {boolean}
 */
ol.canvas.SUPPORTED = (function() {
  if (!('HTMLCanvasElement' in goog.global)) {
    return false;
  }
  try {
    var canvas = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));
    return !goog.isNull(canvas.getContext('2d'));
  } catch (e) {
    return false;
  }
})();


/**
 * @param {ol.Size} size Canvas size.
 * @return {CanvasRenderingContext2D}
 */
ol.canvas.create = function(size) {
  var canvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  canvas.width = size[0];
  canvas.height = size[1];

  return /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
};
