goog.provide('ol.format.ISerializableFeature');



/**
 * @interface
 */
ol.format.ISerializableFeature = function() {
};


/**
 * @param {Node|Object} source Source.
 * @return {ol.Feature} Feature.
 */
ol.format.ISerializableFeature.prototype.read = function(source) {
};


/**
 * @return {Node|Object} Node or object.
 */
ol.format.ISerializableFeature.prototype.write = function() {
};
