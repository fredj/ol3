goog.provide('ol.control');

goog.require('ol.Collection');
goog.require('ol.control.Attribution');
goog.require('ol.control.Rotate');
goog.require('ol.control.Zoom');


/**
 * Set of controls included in maps by default. Unless configured otherwise,
 * this returns a collection containing an instance of each of the following
 * controls:
 * * {@link ol.control.Zoom}
 * * {@link ol.control.Rotate}
 * * {@link ol.control.Attribution}
 *
 * @param {olx.control.DefaultsOptions=} options Defaults options.
 * @return {ol.Collection.<ol.control.Control>} Controls.
 * @api
 */
ol.control.defaults = function(options = {zoom: true, rotate: true, attribution: true}) {

  var controls = new ol.Collection();

  if (options.zoom) {
    controls.push(new ol.control.Zoom(options.zoomOptions));
  }

  if (options.rotate) {
    controls.push(new ol.control.Rotate(options.rotateOptions));
  }

  if (options.attribution) {
    controls.push(new ol.control.Attribution(options.attributionOptions));
  }

  return controls;

};
