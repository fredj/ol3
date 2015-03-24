goog.provide('ol.interaction.DrawTrack');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.math.Coordinate');
goog.require('goog.net.XhrIo');
goog.require('ol.DrawEventType');
goog.require('ol.Feature');
goog.require('ol.format.Polyline');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Track');
goog.require('ol.proj');



/**
 * Interaction to draw a track.
 *
 * @constructor
 * @extends {ol.interaction.Track}
 * @param {ol.interaction.TrackOptions=} opt_options Options
 * @api
 */
ol.interaction.DrawTrack = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, /** @type {ol.interaction.TrackOptions} */ (options));

  /**
   * @type {ol.Feature}
   * @private
   */
  this.lastPoint_ = null;

  /**
   * @type {ol.interaction.Draw}
   * @private
   */
  this.drawInteraction_ = new ol.interaction.Draw(
      /** @type {olx.interaction.DrawOptions} */ ({
        type: 'Point',
        style: this.sketchStyle
      }));

  goog.events.listen(this.drawInteraction_, ol.DrawEventType.DRAWEND,
      this.onDrawEnd_, false, this);

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChanged_, false, this);

};
goog.inherits(ol.interaction.DrawTrack, ol.interaction.Track);


/**
 * @private
 */
ol.interaction.DrawTrack.prototype.handleActiveChanged_ = function() {
  this.drawInteraction_.setActive(this.getActive());
};


/**
 * @return {boolean} Does the track have points?
 * @api
 */
ol.interaction.DrawTrack.prototype.hasPoints = function() {
  return this.controlPoints.length > 0;
};


/**
 * @inheritDoc
 */
ol.interaction.DrawTrack.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);

  var prevMap = this.drawInteraction_.getMap();
  if (!goog.isNull(prevMap)) {
    prevMap.removeInteraction(this.drawInteraction_);
  }

  if (!goog.isNull(map)) {
    map.addInteraction(this.drawInteraction_);
  }
};


/**
 * @param {ol.DrawEvent} evt
 * @private
 */
ol.interaction.DrawTrack.prototype.onDrawEnd_ = function(evt) {
  var feature = evt.feature;
  this.controlPoints.push(feature);
  this.refreshOverlays_(false);
};


/**
 * Remove the last control point.
 * @api
 */
ol.interaction.DrawTrack.prototype.removeLastPoint = function() {
  if (this.controlPoints.length === 0 || this.lastPoint_ === null) {
    return;
  }
  this.controlPoints.pop();
  this.segments.pop();
  this.segmentOverlay.removeFeature(/** @type {ol.Feature} */ (
      this.lastPoint_.get('segment')));
  this.refreshOverlays_(true);
};


/**
 * @param {boolean} removing
 * @private
 */
ol.interaction.DrawTrack.prototype.refreshOverlays_ = function(removing) {
  this.pointOverlay.getFeatures().clear();
  this.lastPoint_ = null;
  if (this.controlPoints.length > 0) {
    // always show the last control point
    var lastIndex = this.controlPoints.length - 1;
    var currentPoint = this.controlPoints[lastIndex];
    this.pointOverlay.addFeature(currentPoint);
    this.lastPoint_ = currentPoint;

    if (!removing) {
      if (this.controlPoints.length >= 2) {
        var previousPoint = this.controlPoints[lastIndex - 1];
        this.addSegment_(previousPoint, currentPoint);
      }

      if (this.snap) {
        this.requestSnapPoint_(currentPoint);
      }
    }
  }
  this.dispatchChangeEvent();
};


/**
 * @param {ol.Feature} featureFrom
 * @param {ol.Feature} featureTo
 * @private
 */
ol.interaction.DrawTrack.prototype.addSegment_ =
    function(featureFrom, featureTo) {
  var pointFrom = /** @type {ol.geom.Point} */ (featureFrom.getGeometry());
  var pointTo = /** @type {ol.geom.Point} */ (featureTo.getGeometry());

  var segment = new ol.Feature({
    geometry: new ol.geom.LineString([
      pointFrom.getCoordinates(),
      pointTo.getCoordinates()
    ])
  });

  featureTo.set('previousPoint', featureFrom);
  featureTo.set('segment', segment);
  featureTo.set('snapped', false);

  this.segments.push(segment);
  this.segmentOverlay.addFeature(segment);
};


/**
 * @param {ol.Feature} feature
 * @private
 */
ol.interaction.DrawTrack.prototype.requestSnapPoint_ = function(feature) {
  var point = /** @type {ol.geom.Point} */ (feature.getGeometry());
  var location = ol.proj.transform(
      point.getCoordinates(),
      this.getMap().getView().getProjection(), 'EPSG:4326');

  var url = this.osrmLocateUrl
    .replace('{profile}', this.osrmProfile)
    .replace('{point}', location[1] + ',' + location[0]);

  goog.net.XhrIo.send(url, goog.bind(function(e) {
    var xhr = /** @type {goog.net.XhrIo} */ (e.target);
    if (this.lastPoint_ !== feature || !xhr.isSuccess()) {
      return;
    }

    var response = xhr.getResponseJson();
    if (response['status'] === 0) {
      var mappedCoordinate = response['mapped_coordinate'];
      var mappedPoint = new ol.geom.Point(ol.proj.transform(
          [mappedCoordinate[1], mappedCoordinate[0]],
          'EPSG:4326', this.getMap().getView().getProjection()));
      this.snapPoint_(feature, mappedPoint);
    }
    // if the request was not successful simply keep the original point
  }, this));
};


/**
 * @param {ol.Feature} feature
 * @param {ol.geom.Point} mappedPoint
 * @private
 */
ol.interaction.DrawTrack.prototype.snapPoint_ = function(feature, mappedPoint) {
  var point = /** @type {ol.geom.Point} */ (feature.getGeometry());
  if (!this.isValidSnap_(point, mappedPoint)) {
    return;
  }
  feature.set('snapped', true);

  // use the mapped point
  feature.setGeometry(mappedPoint);

  if (goog.isDef(feature.get('previousPoint'))) {
    // update the segment leading to this point
    var previousFeature = /** @type {ol.Feature} */ (
        feature.get('previousPoint'));
    var previousPoint = /** @type {ol.geom.Point} */ (
        previousFeature.getGeometry());
    feature.get('segment').setGeometry(new ol.geom.LineString([
      previousPoint.getCoordinates(),
      mappedPoint.getCoordinates()
    ]));

    // if the previous point was also snapped, we can try to find a route
    // between the points
    if (previousFeature.get('snapped') && feature.get('snapped')) {
      this.requestRoute_(previousFeature, feature);
    }
  }
  this.dispatchChangeEvent();
};


/**
 * @param {ol.Feature} featureFrom
 * @param {ol.Feature} featureTo
 * @private
 */
ol.interaction.DrawTrack.prototype.requestRoute_ =
    function(featureFrom, featureTo) {
  var pointFrom = /** @type {ol.geom.Point} */ (featureFrom.getGeometry());
  var from = ol.proj.transform(
      pointFrom.getCoordinates(),
      this.getMap().getView().getProjection(), 'EPSG:4326');
  var pointTo = /** @type {ol.geom.Point} */ (featureTo.getGeometry());
  var to = ol.proj.transform(
      pointTo.getCoordinates(),
      this.getMap().getView().getProjection(), 'EPSG:4326');

  var url = this.osrmRoutingUrl
    .replace('{elevation}', this.elevation ? 'true' : 'false')
    .replace('{profile}', this.osrmProfile)
    .replace('{from}', from[1] + ',' + from[0])
    .replace('{to}', to[1] + ',' + to[0])
    .replace('{zoom}', '18');

  goog.net.XhrIo.send(url, goog.bind(function(e) {
    var xhr = /** @type {goog.net.XhrIo} */ (e.target);
    if (this.lastPoint_ !== featureTo || !xhr.isSuccess()) {
      return;
    }

    var response = xhr.getResponseJson();
    if (response['status'] === 0) {
      var format = new ol.format.Polyline({
        factor: 1e6,
        geometryLayout: this.elevation ?
            ol.geom.GeometryLayout.XYZ : ol.geom.GeometryLayout.XY
      });
      var route = format.readGeometry(response['route_geometry'], {
        dataProjection: 'EPSG:4326',
        featureProjection: this.getMap().getView().getProjection()
      });
      featureTo.get('segment').setGeometry(route);
      this.dispatchChangeEvent();
    }
  }, this));
};


/**
 * @param {ol.geom.Point} originalPoint
 * @param {ol.geom.Point} mappedPoint
 * @return {boolean}
 * @private
 */
ol.interaction.DrawTrack.prototype.isValidSnap_ =
    function(originalPoint, mappedPoint) {
  var map = this.getMap();

  var originalPointPx =
      map.getPixelFromCoordinate(originalPoint.getCoordinates());
  var mappedPointPx =
      map.getPixelFromCoordinate(mappedPoint.getCoordinates());

  var distance = goog.math.Coordinate.distance(
      new goog.math.Coordinate(originalPointPx[0], originalPointPx[1]),
      new goog.math.Coordinate(mappedPointPx[0], mappedPointPx[1]));

  return distance < this.snapTolerance;
};
