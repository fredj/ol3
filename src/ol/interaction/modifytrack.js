goog.provide('ol.interaction.ModifyTrack');

goog.require('goog.array');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Track');
goog.require('ol.style.Fill');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');



/**
 * Interaction to modify a track.
 *
 * @constructor
 * @extends {ol.interaction.Track}
 * @param {ol.interaction.TrackOptions=} opt_options Options
 * @api
 */
ol.interaction.ModifyTrack = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, /** @type {ol.interaction.TrackOptions} */ (options));

  var defaultModifyStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#7E0000'
    }),
    stroke: new ol.style.Stroke({
      color: '#7E0000',
      width: 3
    }),
    image: new ol.style.RegularShape({
      fill: new ol.style.Fill({
        color: '#7E0000'
      }),
      stroke: new ol.style.Stroke({
        color: '#7E0000',
        width: 1
      }),
      points: 4,
      radius: 8,
      angle: Math.PI / 4
    })
  });

  this.modifyFeatures_ = new ol.Collection();
  this.modifyInteraction_ = new ol.interaction.Modify({
    features: this.modifyFeatures_,
    style: [defaultModifyStyle]
  });

};
goog.inherits(ol.interaction.ModifyTrack, ol.interaction.Track);


/**
 * @inheritDoc
 */
ol.interaction.ModifyTrack.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);

  var prevMap = this.modifyInteraction_.getMap();
  if (!goog.isNull(prevMap)) {
    prevMap.removeInteraction(this.modifyInteraction_);
  }

  if (!goog.isNull(map)) {
    map.addInteraction(this.modifyInteraction_);
  }
};


/**
 * @param {Array.<ol.Feature>} controlPoints Control points.
 * @param {Array.<ol.Feature>} segments Segments.
 * @api
 */
ol.interaction.ModifyTrack.prototype.setTrack =
    function(controlPoints, segments) {
  this.controlPoints = controlPoints;
  this.segments = segments;
  this.modifyFeatures_.clear();

  goog.array.forEach(controlPoints, function(controlPoint) {
    this.modifyFeatures_.push(controlPoint);
  }, this);

  this.pointOverlay.setFeatures(this.modifyFeatures_);
  // this.pointOverlay.setFeatures(new ol.Collection(controlPoints));
  this.segmentOverlay.setFeatures(new ol.Collection(segments));

};
