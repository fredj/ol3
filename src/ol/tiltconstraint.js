goog.provide('ol.TiltConstraint');
goog.provide('ol.TiltConstraintType');


/**
 * @typedef {function((number|undefined), number): (number|undefined)}
 */
ol.TiltConstraintType;


/**
 * @param {number} min Minimum tilt.
 * @param {number} max Maximum tilt.
 * @return {ol.TiltConstraintType} Tilt constraint.
 */
ol.TiltConstraint.createRange = function(min, max) {
  return function(tilt, delta) {
    if (goog.isDef(tilt)) {
      return Math.min(Math.max(min, tilt + delta), max);
    } else {
      return undefined;
    }
  };
};
