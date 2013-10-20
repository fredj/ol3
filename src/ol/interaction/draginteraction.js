goog.provide('ol.interaction.Drag');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.interaction.Interaction');



/**
 * Base class for interactions that drag the map.
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.Drag = function() {
  goog.base(this);

  // FIXME: save pointers ?
};
goog.inherits(ol.interaction.Drag, ol.interaction.Interaction);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Drag.prototype.handleDrag = goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Drag.prototype.handleDragEnd = goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean|undefined} Capture dragging. Default is `false`.
 */
ol.interaction.Drag.prototype.handleDragStart = goog.functions.FALSE;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Drag.prototype.handleDown = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.interaction.Drag.prototype.handleMapBrowserEvent = function(event) {
  var map = event.map;
  if (!map.isDef()) {
    return true;
  }
  var capture = false;
  if (event.type == ol.MapBrowserEvent.EventType.DOWN) {
    this.handleDown(event);
  } else if (event.type == ol.MapBrowserEvent.EventType.DRAGSTART) {
    capture = this.handleDragStart(event);
  } else if (event.type == ol.MapBrowserEvent.EventType.DRAG) {
    this.handleDrag(event);
  } else if (event.type == ol.MapBrowserEvent.EventType.DRAGEND) {
    this.handleDragEnd(event);
  }

  return !(capture);
};
