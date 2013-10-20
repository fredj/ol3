// FIXME: simulate CLICK event
// FIXME: simulate DBLCLICK event

goog.provide('ol.MapBrowserEvent');
goog.provide('ol.MapBrowserEvent.EventType');
goog.provide('ol.MapBrowserEventHandler');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Coordinate');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');



/**
 * @constructor
 * @extends {ol.MapEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {number=} opt_pointerId Pointer identifier.
 */
ol.MapBrowserEvent = function(type, map, browserEvent, opt_pointerId) {

  goog.base(this, type, map);

  /**
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  /**
   * @type {number}
   */
  this.pointerId = opt_pointerId || 0;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.coordinate_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.pixel_ = null;

};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * @return {ol.Coordinate} Coordinate.
 */
ol.MapBrowserEvent.prototype.getCoordinate = function() {
  if (goog.isNull(this.coordinate_)) {
    this.coordinate_ = this.map.getEventCoordinate(
        this.browserEvent.getBrowserEvent());
  }
  return this.coordinate_;
};


/**
 * Get pixel offset of the event from the top-left corner of the map viewport.
 * @return {ol.Pixel} Pixel offset.
 */
ol.MapBrowserEvent.prototype.getPixel = function() {
  if (goog.isNull(this.pixel_)) {
    this.pixel_ = this.map.getEventPixel(this.browserEvent.getBrowserEvent());
  }
  return this.pixel_;
};


/**
 * Prevents the default browser action.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/event.preventDefault
 * @override
 */
ol.MapBrowserEvent.prototype.preventDefault = function() {
  goog.base(this, 'preventDefault');
  this.browserEvent.preventDefault();
};


/**
 * Prevents further propagation of the current event.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/event.stopPropagation
 * @override
 */
ol.MapBrowserEvent.prototype.stopPropagation = function() {
  goog.base(this, 'stopPropagation');
  this.browserEvent.stopPropagation();
};



/**
 * @param {ol.Map} map The map with the viewport to listen to events on.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.MapBrowserEventHandler = function(map) {

  goog.base(this);

  /**
   * This is the element that we will listen to the real events on.
   * @type {ol.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.listenerKeys_ = null;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.dragListenerKeys_ = null;

  /**
   * List of pointer id currently dragging.
   * @type {Array.<number>}
   * @private
   */
  this.dragging_ = [];

  /**
   * @type {Object}
   * @private
   */
  this.trackedPointers_ = {};

  var element = this.map_.getViewport();
  this.listenerKeys_ = [
    goog.events.listen(element,
        goog.events.EventType.MOUSEDOWN,
        this.handleMouseDown_, false, this),
    goog.events.listen(element,
        goog.events.EventType.TOUCHSTART,
        this.handleTouchStart_, false, this),
    goog.events.listen(element,
        goog.events.EventType.MSPOINTERDOWN,
        this.handlePointerDown_, false, this)
  ];
};
goog.inherits(ol.MapBrowserEventHandler, goog.events.EventTarget);


/**
 * FIXME empty description for jsdoc
 */
ol.MapBrowserEventHandler.prototype.disposeInternal = function() {
  if (!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(this.listenerKeys_, goog.events.unlistenByKey);
    this.listenerKeys_ = null;
  }
  if (!goog.isNull(this.dragListenerKeys_)) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @param {number} pointerId Pointer identifier.
 * @param {string} type Event type.
 * @private
 */
ol.MapBrowserEventHandler.prototype.dispatchMapBrowserEvent_ =
    function(event, pointerId, type) {
  var newEvent = new ol.MapBrowserEvent(type, this.map_, event, pointerId);
  this.dispatchEvent(newEvent);
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleMouseDown_ = function(event) {
  this.dispatchMapBrowserEvent_(event, 0, ol.MapBrowserEvent.EventType.DOWN);
  if (event.isMouseActionButton() && goog.isNull(this.dragListenerKeys_)) {
    goog.asserts.assert(this.dragging_.length == 0);
    this.dragListenerKeys_ = [
      goog.events.listen(goog.global.document, goog.events.EventType.MOUSEMOVE,
          this.handleMouseMove_, false, this),
      goog.events.listen(goog.global.document, goog.events.EventType.MOUSEUP,
          this.handleMouseUp_, false, this)
    ];
  }
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleMouseMove_ = function(event) {
  if (!goog.array.contains(this.dragging_, 0)) {
    this.dispatchMapBrowserEvent_(event, 0,
        ol.MapBrowserEvent.EventType.DRAGSTART);
    this.dragging_.push(0);
  }
  this.dispatchMapBrowserEvent_(event, 0, ol.MapBrowserEvent.EventType.DRAG);
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleMouseUp_ = function(event) {
  if (goog.array.contains(this.dragging_, 0)) {
    this.dispatchMapBrowserEvent_(event, 0,
        ol.MapBrowserEvent.EventType.DRAGEND);
    goog.array.remove(this.dragging_, 0);
  }
  goog.asserts.assert(this.dragging_.length == 0);
  goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
  this.dragListenerKeys_ = null;
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleTouchStart_ = function(event) {
  var pointerId = event.getBrowserEvent().changedTouches.item(0).identifier;
  this.dispatchMapBrowserEvent_(event, pointerId,
      ol.MapBrowserEvent.EventType.DOWN);

  if (goog.isNull(this.dragListenerKeys_)) {
    goog.asserts.assert(this.dragging_.length == 0);
    this.dragListenerKeys_ = [
      goog.events.listen(goog.global.document, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_, false, this),
      goog.events.listen(goog.global.document, goog.events.EventType.TOUCHEND,
          this.handleTouchEnd_, false, this)
    ];
  }
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleTouchMove_ = function(event) {
  // prevent page move
  event.preventDefault();

  var changedTouches = event.getBrowserEvent().changedTouches;
  for (var i = 0, len = changedTouches.length; i < len; i++) {
    var pointerId = changedTouches.item(i);
    if (!goog.array.contains(this.dragging_, pointerId)) {
      this.dispatchMapBrowserEvent_(event, pointerId,
          ol.MapBrowserEvent.EventType.DRAGSTART);
      this.dragging_.push(pointerId);
    }
    this.dispatchMapBrowserEvent_(event, pointerId,
        ol.MapBrowserEvent.EventType.DRAG);
  }
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleTouchEnd_ = function(event) {
  var browserEvent = event.getBrowserEvent();
  var pointerId = browserEvent.changedTouches.item(0).identifier;

  if (goog.array.contains(this.dragging_, pointerId)) {
    this.dispatchMapBrowserEvent_(event, pointerId,
        ol.MapBrowserEvent.EventType.DRAGEND);
    goog.array.remove(this.dragging_, pointerId);
  }

  if (browserEvent.targetTouches.length == 0) {
    goog.asserts.assert(this.dragging_.length == 0);
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
  }
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerDown_ = function(event) {
  var browserEvent = event.getBrowserEvent();
  var pointerId = browserEvent.pointerId;

  this.dispatchMapBrowserEvent_(event, pointerId,
      ol.MapBrowserEvent.EventType.DOWN);
  if (event.isMouseActionButton()) {
    this.trackedPointers_[pointerId] = browserEvent;

    if (goog.isNull(this.dragListenerKeys_)) {
      goog.asserts.assert(this.dragging_.length == 0);
      this.dragListenerKeys_ = [
        goog.events.listen(goog.global.document,
            goog.events.EventType.MSPOINTERMOVE,
            this.handlePointerMove_, false, this),
        goog.events.listen(goog.global.document,
            goog.events.EventType.MSPOINTERUP,
            this.handlePointerUp_, false, this)
      ];
    }
  }
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerMove_ = function(event) {
  // check if the pointer really moved
  var browserEvent = event.getBrowserEvent();
  var pointerId = browserEvent.pointerId;

  var previousEvent = this.trackedPointers_[pointerId];
  goog.asserts.assert(goog.isDef(previousEvent));
  var movedX = browserEvent.clientX != previousEvent.clientX;
  var movedY = browserEvent.clientY != previousEvent.clientY;
  if (movedX || movedY) {
    if (!goog.array.contains(this.dragging_, pointerId)) {
      this.dispatchMapBrowserEvent_(event, pointerId,
          ol.MapBrowserEvent.EventType.DRAGSTART);
      this.dragging_.push(pointerId);
    }
    this.dispatchMapBrowserEvent_(event, pointerId,
        ol.MapBrowserEvent.EventType.DRAG);
  }
  goog.asserts.assert(this.trackedPointers_[pointerId]);
  this.trackedPointers_[pointerId] = browserEvent;
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerUp_ = function(event) {
  var browserEvent = event.getBrowserEvent();
  var pointerId = browserEvent.pointerId;

  delete this.trackedPointers_[pointerId];
  if (goog.array.contains(this.dragging_, pointerId)) {
    this.dispatchMapBrowserEvent_(event, pointerId,
        ol.MapBrowserEvent.EventType.DRAGEND);
    goog.array.remove(this.dragging_, pointerId);
  }
  if (goog.object.isEmpty(this.trackedPointers_)) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
  }
};


/**
 * Constants for event names.
 * @enum {string}
 */
ol.MapBrowserEvent.EventType = {

  DOWN: 'down',
  CLICK: goog.events.EventType.CLICK,
  DBLCLICK: goog.events.EventType.DBLCLICK,

  // start dragging with the mouse (action button), touch or pointer
  DRAGSTART: 'dragstart',
  // repeatedly fired while dragging
  DRAG: 'drag',
  // stop dragging, no more pointer interacting
  DRAGEND: 'dragend'
};
