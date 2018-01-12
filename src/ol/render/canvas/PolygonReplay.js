/**
 * @module ol/render/canvas/PolygonReplay
 */
import {inherits} from '../../index.js';
import {asString} from '../../color.js';
import _ol_geom_flat_simplify_ from '../../geom/flat/simplify.js';
import _ol_render_canvas_ from '../canvas.js';
import _ol_render_canvas_Instruction_ from '../canvas/Instruction.js';
import _ol_render_canvas_Replay_ from '../canvas/Replay.js';

/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @param {?} declutterTree Declutter tree.
 * @struct
 */
const _ol_render_canvas_PolygonReplay_ = function(
  tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  _ol_render_canvas_Replay_.call(this,
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};

inherits(_ol_render_canvas_PolygonReplay_, _ol_render_canvas_Replay_);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
_ol_render_canvas_PolygonReplay_.prototype.drawFlatCoordinatess_ = function(flatCoordinates, offset, ends, stride) {
  const state = this.state;
  const fill = state.fillStyle !== undefined;
  const stroke = state.strokeStyle != undefined;
  const numEnds = ends.length;
  const beginPathInstruction = [_ol_render_canvas_Instruction_.BEGIN_PATH];
  this.instructions.push(beginPathInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction);
  for (let i = 0; i < numEnds; ++i) {
    const end = ends[i];
    const myBegin = this.coordinates.length;
    const myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, true, !stroke);
    const moveToLineToInstruction =
        [_ol_render_canvas_Instruction_.MOVE_TO_LINE_TO, myBegin, myEnd];
    this.instructions.push(moveToLineToInstruction);
    this.hitDetectionInstructions.push(moveToLineToInstruction);
    if (stroke) {
      // Performance optimization: only call closePath() when we have a stroke.
      // Otherwise the ring is closed already (see appendFlatCoordinates above).
      const closePathInstruction = [_ol_render_canvas_Instruction_.CLOSE_PATH];
      this.instructions.push(closePathInstruction);
      this.hitDetectionInstructions.push(closePathInstruction);
    }
    offset = end;
  }
  const fillInstruction = [_ol_render_canvas_Instruction_.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (fill) {
    this.instructions.push(fillInstruction);
  }
  if (stroke) {
    const strokeInstruction = [_ol_render_canvas_Instruction_.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  return offset;
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.drawCircle = function(circleGeometry, feature) {
  const state = this.state;
  const fillStyle = state.fillStyle;
  const strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  this.setFillStrokeStyles_(circleGeometry);
  this.beginGeometry(circleGeometry, feature);
  // always fill the circle for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    asString(_ol_render_canvas_.defaultFillStyle)
  ]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  const flatCoordinates = circleGeometry.getFlatCoordinates();
  const stride = circleGeometry.getStride();
  const myBegin = this.coordinates.length;
  this.appendFlatCoordinates(
    flatCoordinates, 0, flatCoordinates.length, stride, false, false);
  const beginPathInstruction = [_ol_render_canvas_Instruction_.BEGIN_PATH];
  const circleInstruction = [_ol_render_canvas_Instruction_.CIRCLE, myBegin];
  this.instructions.push(beginPathInstruction, circleInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction, circleInstruction);
  const fillInstruction = [_ol_render_canvas_Instruction_.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (state.fillStyle !== undefined) {
    this.instructions.push(fillInstruction);
  }
  if (state.strokeStyle !== undefined) {
    const strokeInstruction = [_ol_render_canvas_Instruction_.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  this.endGeometry(circleGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.drawPolygon = function(polygonGeometry, feature) {
  const state = this.state;
  this.setFillStrokeStyles_(polygonGeometry);
  this.beginGeometry(polygonGeometry, feature);
  // always fill the polygon for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    asString(_ol_render_canvas_.defaultFillStyle)]
  );
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  const ends = polygonGeometry.getEnds();
  const flatCoordinates = polygonGeometry.getOrientedFlatCoordinates();
  const stride = polygonGeometry.getStride();
  this.drawFlatCoordinatess_(flatCoordinates, 0, ends, stride);
  this.endGeometry(polygonGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {
  const state = this.state;
  const fillStyle = state.fillStyle;
  const strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  this.setFillStrokeStyles_(multiPolygonGeometry);
  this.beginGeometry(multiPolygonGeometry, feature);
  // always fill the multi-polygon for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    asString(_ol_render_canvas_.defaultFillStyle)
  ]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  const endss = multiPolygonGeometry.getEndss();
  const flatCoordinates = multiPolygonGeometry.getOrientedFlatCoordinates();
  const stride = multiPolygonGeometry.getStride();
  let offset = 0;
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    offset = this.drawFlatCoordinatess_(flatCoordinates, offset, endss[i], stride);
  }
  this.endGeometry(multiPolygonGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.finish = function() {
  this.reverseHitDetectionInstructions();
  this.state = null;
  // We want to preserve topology when drawing polygons.  Polygons are
  // simplified using quantization and point elimination. However, we might
  // have received a mix of quantized and non-quantized geometries, so ensure
  // that all are quantized by quantizing all coordinates in the batch.
  const tolerance = this.tolerance;
  if (tolerance !== 0) {
    const coordinates = this.coordinates;
    for (let i = 0, ii = coordinates.length; i < ii; ++i) {
      coordinates[i] = _ol_geom_flat_simplify_.snap(coordinates[i], tolerance);
    }
  }
};


/**
 * @private
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 */
_ol_render_canvas_PolygonReplay_.prototype.setFillStrokeStyles_ = function(geometry) {
  const state = this.state;
  const fillStyle = state.fillStyle;
  if (fillStyle !== undefined) {
    this.updateFillStyle(state, this.createFill, geometry);
  }
  if (state.strokeStyle !== undefined) {
    this.updateStrokeStyle(state, this.applyStroke);
  }
};
export default _ol_render_canvas_PolygonReplay_;
