// FIXME works for View2D only

goog.provide('ol.interaction.TouchPan');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Kinetic');
goog.require('ol.Pixel');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Touch');



/**
 * @constructor
 * @extends {ol.interaction.Touch}
 */
ol.interaction.TouchPan = function() {

  goog.base(this);

  /**
   * @private
   * @type {ol.Kinetic}
   */
  this.kinetic_ = new ol.Kinetic(-0.005, 0.05, 100);

  /**
   * @type {ol.Pixel}
   */
  this.lastCentroid = null;

};
goog.inherits(ol.interaction.TouchPan, ol.interaction.Touch);


/**
 * @inheritDoc
 */
ol.interaction.TouchPan.prototype.handleTouchMove = function(mapBrowserEvent) {
  goog.asserts.assert(this.targetTouches.length >= 1);
  var centroid = ol.interaction.Touch.centroid(this.targetTouches);
  if (!goog.isNull(this.lastCentroid)) {
    this.kinetic_.update(centroid.x, centroid.y);
    var map = mapBrowserEvent.map;
    var view = map.getView();
    var resolution = view.getResolution();
    var rotation = view.getRotation();
    var center = view.getCenter();

    var deltaX = this.lastCentroid.x - centroid.x;
    var deltaY = centroid.y - this.lastCentroid.y;
    var newCenter = new ol.Coordinate(deltaX, deltaY)
      .scale(view.getResolution())
      .rotate(view.getRotation());
    // FIXME: nice to have center.add(...);
    newCenter.x += center.x;
    newCenter.y += center.y;
    view.setCenter(newCenter);
  } else {
    this.kinetic_.begin(centroid.x, centroid.y);
  }
  this.lastCentroid = centroid;
};


/**
 * @inheritDoc
 */
ol.interaction.TouchPan.prototype.handleTouchEnd =
    function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (this.targetTouches.length == 0) {
    view.setHint(ol.ViewHint.PANNING, -1);
    if (this.kinetic_.end()) {
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = view.getCenter();
      map.addPreRenderFunction(this.kinetic_.pan(center));
      var centerpx = map.getPixelFromCoordinate(center);
      var destpx = new ol.Pixel(
          centerpx.x - distance * Math.cos(angle),
          centerpx.y - distance * Math.sin(angle));
      var dest = map.getCoordinateFromPixel(destpx);
      view.setCenter(dest);
    }
    return false;
  } else {
    this.lastCentroid = null;
    return true;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.TouchPan.prototype.handleTouchStart =
    function(mapBrowserEvent) {
  if (this.targetTouches.length >= 1) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.lastCentroid = null;
    view.setHint(ol.ViewHint.PANNING, 1);
    return true;
  } else {
    return false;
  }
};
