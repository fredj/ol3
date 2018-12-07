/**
 * @module ol/layer/Vector
 */
import BaseVectorLayer from './BaseVector.js';
import CanvasVectorLayerRenderer from '../renderer/canvas/VectorLayer.js';


/**
 * @typedef {import("./BaseVector.js").Options} Options
 */


/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @api
 */
class VectorLayer extends BaseVectorLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * Create a renderer for this layer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   * @protected
   */
  createRenderer() {
    return new CanvasVectorLayerRenderer(this);
  }

  /**
   * Return the associated {@link module:ol/source/Vector vectorsource} of the layer.
   * @return {import("../source/Vector.js").default} Source.
   * @api
   */
  getSource() {
    return /** @type {import("../source/Vector.js").default} */ (super.getSource());
  }

}


export default VectorLayer;
