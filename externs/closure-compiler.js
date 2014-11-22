/**
 * @fileoverview Definitions for externs that are either missing or incorrect
 * in the current release version of the closure compiler we use.
 *
 * The entries must be removed once they are available/correct in the
 * version we use.
 *
 * @externs
 */

/** @type {number} */
Touch.prototype.force;


/** @type {number} */
Touch.prototype.radiusX;


/** @type {number} */
Touch.prototype.radiusY;


/** @type {number} */
Touch.prototype.webkitForce;


/** @type {number} */
Touch.prototype.webkitRadiusX;


/** @type {number} */
Touch.prototype.webkitRadiusY;


/**
 * @constructor
 */
function ObjectNotifier() {};

/**
 * @param {Object} notification
 */
ObjectNotifier.prototype.notify = function(notification) {};

/**
 * @param {Object} obj
 * @return {ObjectNotifier}
 * @see http://wiki.ecmascript.org/doku.php?id=harmony:observe_public_api#object.getnotifier
 */
Object.getNotifier = function(obj) {};
