goog.provide('ol.control.FPS');

goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('ol.control.Control');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.FPSOptions=} opt_options options.
 */
ol.control.FPS = function(opt_options) {

  var options = opt_options || {};

  var className = goog.isDef(options.className) ?
      options.className : 'ol-fps';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className
  });

  goog.base(this, {
    element: element,
    target: options.target
  });

  var interval = goog.isDef(options.interval) ? options.interval : 250;

  this.timer_ = new goog.Timer(interval);
  goog.events.listen(this.timer_, goog.Timer.TICK,
      this.updateHTML_, false, this);

  /**
   * @private
   * @type {number}
   */
  this.frameCount_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.last_ = 0;
};
goog.inherits(ol.control.FPS, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.FPS.prototype.handleMapPostrender = function(mapEvent) {
  this.frameCount_++;
};


/**
 * @inheritDoc
 */
ol.control.FPS.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
    this.timer_.start();
    this.last_ = goog.now();
  } else {
    this.timer_.stop();
  }
};


/**
 * @param {goog.events.Event} event Tick event.
 * @private
 */
ol.control.FPS.prototype.updateHTML_ = function(event) {
  var now = goog.now();
  var duration = (now - this.last_) / 1000.0;
  var fps = this.frameCount_ / duration;

  this.last_ = now;
  this.frameCount_ = 0;
  this.element.innerHTML = fps.toFixed(1) + ' fps';
};
