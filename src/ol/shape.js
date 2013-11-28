// FIXME check size when stroked
// FIXME move to ol.render?
// FIXME find a sensible caching strategy

goog.provide('ol.shape');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.color');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');


/**
 * @param {number} radius Radius.
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 * @return {ol.style.Image} Image.
 */
ol.shape.renderCircle = function(radius, fillStyle, strokeStyle) {

  var canvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  var size = 2 * radius + 1;
  if (!goog.isNull(strokeStyle) && goog.isDef(strokeStyle.width)) {
    size += strokeStyle.width;
  }
  canvas.height = size;
  canvas.width = size;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  context.arc(size / 2, size / 2, radius, 0, 2 * Math.PI, true);

  if (goog.isDefAndNotNull(fillStyle)) {
    context.fillStyle = ol.color.asString(fillStyle.color);
    context.fill();
  }
  if (goog.isDefAndNotNull(strokeStyle)) {
    context.strokeStyle = ol.color.asString(strokeStyle.color);
    context.lineWidth = goog.isDef(strokeStyle.width) ? strokeStyle.width : 1;
    context.stroke();
  }

  return new ol.style.Image({
    anchor: [size / 2, size / 2],
    size: [size, size],
    image: canvas,
    imageState: ol.style.ImageState.LOADED,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  });

};


/**
 * @param {ol.Size} size Size.
 * @param {Array.<Array.<number>>} coordinates Coordinates.
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 * @return {ol.style.Image} Image.
 */
ol.shape.renderPath = function(size, coordinates, fillStyle, strokeStyle) {

  var canvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  var width = size[0];
  var height = size[1];
  canvas.height = width;
  canvas.width = height;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));

  context.moveTo(coordinates[0][0] * width, coordinates[0][1] * height);
  for (var i = 1; i < coordinates.length; i++) {
    context.lineTo(coordinates[i][0] * width, coordinates[i][1] * height);
  }

  if (goog.isDefAndNotNull(fillStyle)) {
    context.fillStyle = ol.color.asString(fillStyle.color);
    context.fill();
  }
  if (goog.isDefAndNotNull(strokeStyle)) {
    context.strokeStyle = ol.color.asString(strokeStyle.color);
    context.lineWidth = goog.isDef(strokeStyle.width) ? strokeStyle.width : 1;
    context.stroke();
  }

  return new ol.style.Image({
    anchor: [width / 2, height / 2],
    size: size,
    image: canvas,
    imageState: ol.style.ImageState.LOADED,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  });

};
