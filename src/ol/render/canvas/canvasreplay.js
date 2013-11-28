// FIXME decide default snapToPixel behaviour
// FIXME add option to apply snapToPixel to all coordinates?
// FIXME can eliminate empty set styles and strokes (when all geoms skipped)

goog.provide('ol.render.canvas.ReplayGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.geom.flat');
goog.require('ol.render.IRender');
goog.require('ol.render.IReplayGroup');
goog.require('ol.render.canvas');
goog.require('ol.vec.Mat4');


/**
 * @enum {number}
 */
ol.render.canvas.Instruction = {
  BEGIN_GEOMETRY: 0,
  BEGIN_PATH: 1,
  CLOSE_PATH: 2,
  DRAW_IMAGE: 3,
  FILL: 4,
  MOVE_TO_LINE_TO: 5,
  SET_FILL_STYLE: 6,
  SET_STROKE_STYLE: 7,
  STROKE: 8
};



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @protected
 */
ol.render.canvas.Replay = function() {

  /**
   * @protected
   * @type {Array.<*>}
   */
  this.instructions = [];

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.coordinates = [];

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.renderedTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {{currentStyle: (string|undefined),
   *         style: (string|undefined)}|null}
   */
  this.fillState_ = {
    currentStyle: undefined,
    style: undefined
  };

  /**
   * @private
   * @type {{currentStyle: (string|undefined),
   *         currentLineCap: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         style: (string|undefined),
   *         lineCap: (string|undefined),
   *         lineWidth: (number|undefined)}|null}
   */
  this.strokeState_ = {
    currentStyle: undefined,
    currentLineCap: undefined,
    currentLineWidth: undefined,
    style: undefined,
    lineCap: undefined,
    lineWidth: undefined
  };

};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {boolean} close Close.
 * @protected
 * @return {number} My end.
 */
ol.render.canvas.Replay.prototype.appendFlatCoordinates =
    function(flatCoordinates, offset, end, stride, close) {
  var myEnd = this.coordinates.length;
  var i;
  for (i = offset; i < end; i += stride) {
    this.coordinates[myEnd++] = flatCoordinates[i];
    this.coordinates[myEnd++] = flatCoordinates[i + 1];
  }
  if (close) {
    this.coordinates[myEnd++] = flatCoordinates[offset];
    this.coordinates[myEnd++] = flatCoordinates[offset + 1];
  }
  return myEnd;
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {Array} Begin geometry instruction.
 */
ol.render.canvas.Replay.prototype.beginGeometry = function(geometry) {
  var beginGeometryInstruction =
      [ol.render.canvas.Instruction.BEGIN_GEOMETRY, geometry, 0, 0];
  this.instructions.push(beginGeometryInstruction);
  return beginGeometryInstruction;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 */
ol.render.canvas.Replay.prototype.replay =
    function(context, transform, renderGeometryFunction) {
  /** @type {Array.<number>} */
  var pixelCoordinates;
  if (ol.vec.Mat4.equal2D(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    pixelCoordinates = ol.geom.flat.transform2D(
        this.coordinates, 2, transform, this.pixelCoordinates_);
    goog.vec.Mat4.setFromArray(this.renderedTransform_, transform);
    goog.asserts.assert(pixelCoordinates === this.pixelCoordinates_);
  }
  var instructions = this.instructions;
  var i = 0; // instruction index
  var ii = instructions.length; // end of instructions
  var d = 0; // data index
  var dd; // end of per-instruction data
  while (i < ii) {
    var instruction = instructions[i];
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    if (type == ol.render.canvas.Instruction.BEGIN_GEOMETRY) {
      var geometry = /** @type {ol.geom.Geometry} */ (instruction[1]);
      if (renderGeometryFunction(geometry)) {
        ++i;
      } else {
        d = /** @type {number} */ (instruction[2]);
        i = /** @type {number} */ (instruction[3]);
      }
    } else if (type == ol.render.canvas.Instruction.BEGIN_PATH) {
      context.beginPath();
      ++i;
    } else if (type == ol.render.canvas.Instruction.CLOSE_PATH) {
      context.closePath();
      ++i;
    } else if (type == ol.render.canvas.Instruction.DRAW_IMAGE) {
      dd = /** @type {number} */ (instruction[1]);
      var anchorX = /** @type {number} */ (instruction[2]);
      var anchorY = /** @type {number} */ (instruction[3]);
      var width = /** @type {number} */ (instruction[4]);
      var height = /** @type {number} */ (instruction[5]);
      var image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
          (instruction[6]);
      var snapToPixel = /** @type {boolean|undefined} */ (instruction[7]);
      for (; d < dd; d += 2) {
        var x = pixelCoordinates[d] - anchorX;
        var y = pixelCoordinates[d + 1] - anchorY;
        if (snapToPixel) {
          x = (x + 0.5) | 0;
          y = (y + 0.5) | 0;
        }
        context.drawImage(image, x, y, width, height);
      }
      ++i;
    } else if (type == ol.render.canvas.Instruction.FILL) {
      context.fill();
      ++i;
    } else if (type == ol.render.canvas.Instruction.MOVE_TO_LINE_TO) {
      context.moveTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
      goog.asserts.assert(goog.isNumber(instruction[1]));
      dd = /** @type {number} */ (instruction[1]);
      for (d += 2; d < dd; d += 2) {
        context.lineTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
      }
      ++i;
    } else if (type == ol.render.canvas.Instruction.SET_FILL_STYLE) {
      goog.asserts.assert(goog.isString(instruction[1]));
      context.fillStyle = /** @type {string} */ (instruction[1]);
      ++i;
    } else if (type == ol.render.canvas.Instruction.SET_STROKE_STYLE) {
      goog.asserts.assert(goog.isString(instruction[1]));
      goog.asserts.assert(goog.isNumber(instruction[2]));
      goog.asserts.assert(goog.isString(instruction[3]));
      context.strokeStyle = /** @type {string} */ (instruction[1]);
      context.lineWidth = /** @type {number} */ (instruction[2]);
      context.lineCap = /** @type {string} */ (instruction[3]);
      ++i;
    } else if (type == ol.render.canvas.Instruction.STROKE) {
      context.stroke();
      ++i;
    } else {
      goog.asserts.fail();
      ++i; // consume the instruction anyway, to avoid an infinite loop
    }
  }
  // assert that all data were consumed
  goog.asserts.assert(d == pixelCoordinates.length);
  // assert that all instructions were consumed
  goog.asserts.assert(i == instructions.length);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawFeature = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawLineStringGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawMultiPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawPolygonGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawMultiPolygonGeometry =
    goog.abstractMethod;


/**
 * @param {Array} beginGeometryInstruction Begin geometry instruction.
 */
ol.render.canvas.Replay.prototype.endGeometry =
    function(beginGeometryInstruction) {
  beginGeometryInstruction[2] = this.coordinates.length;
  beginGeometryInstruction[3] = this.instructions.length;
};


/**
 * FIXME empty description for jsdoc
 */
ol.render.canvas.Replay.prototype.finish = goog.nullFunction;


/**
 * @return {ol.Extent} Extent.
 */
ol.render.canvas.Replay.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setFillStrokeStyle = function(fill, stroke) {
  if (!goog.isNull(fill)) {
    this.fillState_.style = ol.color.asString(!goog.isNull(fill.color) ?
        fill.color : ol.render.canvas.defaultFillStyle);
  } else {
    this.fillState_.style = undefined;
  }
  if (!goog.isNull(stroke)) {
    this.strokeState_.style = ol.color.asString(!goog.isNull(stroke.color) ?
        stroke.color : ol.render.canvas.defaultStrokeStyle);
    this.strokeState_.lineCap = goog.isDef(stroke.lineCap) ?
        stroke.lineCap : ol.render.canvas.defaultLineCap;
    this.strokeState_.lineWidth = goog.isDef(stroke.width) ?
        stroke.width : ol.render.canvas.defaultLineWidth;
  } else {
    this.strokeState_.style = undefined;
    this.strokeState_.lineCap = undefined;
    this.strokeState_.lineWidth = undefined;
  }
};


/**
 * @private
 */
ol.render.canvas.Replay.prototype.setFillStyle_ = function() {
  var state = this.fillState_;
  var style = state.style;
  if (goog.isDef(style) && state.currentStyle != style) {
     this.instructions.push(
         [ol.render.canvas.Instruction.SET_FILL_STYLE, style]);
     state.currentStyle = state.style;
   }
};


/**
 * @private
 */
ol.render.canvas.Replay.prototype.setStrokeStyle_ = function() {
  var state = this.strokeState_;
  var style = state.style;
  var lineCap = state.lineCap;
  var lineWidth = state.lineWidth;
  goog.asserts.assert(goog.isDef(style));
  goog.asserts.assert(goog.isDef(lineCap));
  goog.asserts.assert(goog.isDef(lineWidth));
  if (state.currentStyle != style ||
      state.currentLineCap != lineCap ||
      state.currentLineWidth != lineWidth) {
    if (this.lastStroke_ != this.coordinates.length) {
      this.instructions.push([ol.render.canvas.Instruction.STROKE]);
      this.lastStroke_ = this.coordinates.length;
    }
    this.instructions.push([
      ol.render.canvas.Instruction.SET_STROKE_STYLE,
      style, lineWidth, lineCap
    ], [
      ol.render.canvas.Instruction.BEGIN_PATH
    ]);
    state.currentStyle = style;
    state.currentLineCap = lineCap;
    state.currentLineWidth = lineWidth;
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setImageStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setTextStyle = goog.abstractMethod;



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @protected
 */
ol.render.canvas.ImageReplay = function() {

  goog.base(this);

  /**
   * @private
   * @type {number|undefined}
   */
  this.anchorX_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.anchorY_ = undefined;

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.height_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.width_ = undefined;

  /**
   * @private
   * @type {boolean|undefined}
   */
  this.snapToPixel_ = undefined;

};
goog.inherits(ol.render.canvas.ImageReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} My end.
 */
ol.render.canvas.ImageReplay.prototype.drawCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  return this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawPointGeometry =
    function(pointGeometry) {
  if (goog.isNull(this.image_)) {
    return;
  }
  goog.asserts.assert(goog.isDef(this.anchorX_));
  goog.asserts.assert(goog.isDef(this.anchorY_));
  goog.asserts.assert(goog.isDef(this.height_));
  goog.asserts.assert(goog.isDef(this.width_));
  ol.extent.extend(this.extent_, pointGeometry.getExtent());
  var beginGeometryInstruction = this.beginGeometry(pointGeometry);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myEnd,
    this.anchorX_, this.anchorY_, this.width_, this.height_,
    this.image_, this.snapToPixel_
  ]);
  this.endGeometry(beginGeometryInstruction);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
  if (goog.isNull(this.image_)) {
    return;
  }
  goog.asserts.assert(goog.isDef(this.anchorX_));
  goog.asserts.assert(goog.isDef(this.anchorY_));
  goog.asserts.assert(goog.isDef(this.height_));
  goog.asserts.assert(goog.isDef(this.width_));
  ol.extent.extend(this.extent_, multiPointGeometry.getExtent());
  var beginGeometryInstruction = this.beginGeometry(multiPointGeometry);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myEnd,
    this.anchorX_, this.anchorY_, this.width_, this.height_,
    this.image_, this.snapToPixel_
  ]);
  this.endGeometry(beginGeometryInstruction);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.finish = function() {
  // FIXME this doesn't really protect us against further calls to draw*Geometry
  this.anchorX_ = undefined;
  this.anchorY_ = undefined;
  this.image_ = null;
  this.height_ = undefined;
  this.width_ = undefined;
  this.snapToPixel_ = undefined;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  goog.asserts.assert(!goog.isNull(imageStyle));
  goog.asserts.assert(!goog.isNull(imageStyle.anchor));
  goog.asserts.assert(goog.isDef(imageStyle.size));
  goog.asserts.assert(!goog.isNull(imageStyle.image));
  this.anchorX_ = imageStyle.anchor[0];
  this.anchorY_ = imageStyle.anchor[1];
  this.image_ = imageStyle.image;
  this.width_ = imageStyle.size[0];
  this.height_ = imageStyle.size[1];
  this.snapToPixel_ = imageStyle.snapToPixel;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @protected
 */
ol.render.canvas.LineStringReplay = function() {

  goog.base(this);

  /**
   * @private
   * @type {number}
   */
  this.lastStroke_ = 0;

};
goog.inherits(ol.render.canvas.LineStringReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
ol.render.canvas.LineStringReplay.prototype.drawFlatCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  var myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
  this.instructions.push([ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myEnd]);
  return end;
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  var state = this.strokeState_;
  goog.asserts.assert(!goog.isNull(this.strokeState_));
  var style = state.style;
  var lineWidth = state.lineWidth;
  if (!goog.isDef(style) || !goog.isDef(lineWidth)) {
    return;
  }
  ol.extent.extend(this.extent_, lineStringGeometry.getExtent());
  this.setStrokeStyle_();
  var beginGeometryInstruction = this.beginGeometry(lineStringGeometry);
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.endGeometry(beginGeometryInstruction);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
  var state = this.strokeState_;
  goog.asserts.assert(!goog.isNull(state));
  var style = state.style;
  var lineWidth = state.lineWidth;
  if (!goog.isDef(style) || !goog.isDef(lineWidth)) {
    return;
  }
  ol.extent.extend(this.extent_, multiLineStringGeometry.getExtent());
  this.setStrokeStyle_();
  var beginGeometryInstruction = this.beginGeometry(multiLineStringGeometry);
  var ends = multiLineStringGeometry.getEnds();
  var flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  var stride = multiLineStringGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.drawFlatCoordinates_(
        flatCoordinates, offset, ends[i], stride);
  }
  this.endGeometry(beginGeometryInstruction);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.finish = function() {
  if (this.lastStroke_ != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
  goog.asserts.assert(!goog.isNull(this.strokeState_));
  this.strokeState_ = null;
};


/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @protected
 */
ol.render.canvas.PolygonReplay = function() {

  goog.base(this);

};
goog.inherits(ol.render.canvas.PolygonReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
ol.render.canvas.PolygonReplay.prototype.drawFlatCoordinatess_ =
    function(flatCoordinates, offset, ends, stride) {
  var fillState = this.fillState_;
  var strokeState = this.strokeState_;
  this.instructions.push([ol.render.canvas.Instruction.BEGIN_PATH]);
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var myEnd =
        this.appendFlatCoordinates(flatCoordinates, offset, end, stride, true);
    this.instructions.push(
        [ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myEnd],
        [ol.render.canvas.Instruction.CLOSE_PATH]);
    offset = end;
  }
  // FIXME is it quicker to fill and stroke each polygon individually,
  // FIXME or all polygons together?
  if (goog.isDef(fillState)) {
    this.instructions.push([ol.render.canvas.Instruction.FILL]);
  }
  if (goog.isDef(strokeState.style)) {
    goog.asserts.assert(goog.isDef(strokeState.lineWidth));
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
  return offset;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
  goog.asserts.assert(!goog.isNull(this.fillState_));
  goog.asserts.assert(!goog.isNull(this.strokeState_));
  var fillStyle = this.fillState_.style;
  var strokeStyle = this.strokeState_.style;
  if (!goog.isDef(fillStyle) && !goog.isDef(strokeStyle)) {
    return;
  }
  if (goog.isDef(strokeStyle)) {
    goog.asserts.assert(goog.isDef(this.strokeState_.lineWidth));
  }
  ol.extent.extend(this.extent_, polygonGeometry.getExtent());
  this.setFillStyle_();
  this.setStrokeStyle_();
  var beginGeometryInstruction = this.beginGeometry(polygonGeometry);
  var ends = polygonGeometry.getEnds();
  var flatCoordinates = polygonGeometry.getFlatCoordinates();
  var stride = polygonGeometry.getStride();
  this.drawFlatCoordinatess_(flatCoordinates, 0, ends, stride);
  this.endGeometry(beginGeometryInstruction);
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
  goog.asserts.assert(!goog.isNull(this.fillState_));
  goog.asserts.assert(!goog.isNull(this.strokeState_));
  var fillStyle = this.fillState_.style;
  var strokeStyle = this.strokeState_.style;
  if (!goog.isDef(fillStyle) && !goog.isDef(strokeStyle)) {
    return;
  }
  if (goog.isDef(strokeStyle)) {
    goog.asserts.assert(goog.isDef(this.strokeState_.lineWidth));
  }
  ol.extent.extend(this.extent_, multiPolygonGeometry.getExtent());
  this.setFillStyle_();
  this.setStrokeStyle_();
  var beginGeometryInstruction = this.beginGeometry(multiPolygonGeometry);
  var endss = multiPolygonGeometry.getEndss();
  var flatCoordinates = multiPolygonGeometry.getFlatCoordinates();
  var stride = multiPolygonGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    offset = this.drawFlatCoordinatess_(
        flatCoordinates, offset, endss[i], stride);
  }
  this.endGeometry(beginGeometryInstruction);
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.finish = function() {
  goog.asserts.assert(!goog.isNull(this.fillState_));
  goog.asserts.assert(!goog.isNull(this.strokeState_));
  this.fillState_ = null;
  this.strokeState_ = null;
};



/**
 * @constructor
 * @implements {ol.render.IReplayGroup}
 */
ol.render.canvas.ReplayGroup = function() {

  /**
   * @private
   * @type {Object.<string,
   *        Object.<ol.render.ReplayType, ol.render.canvas.Replay>>}
   */
  this.replayesByZIndex_ = {};

};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 */
ol.render.canvas.ReplayGroup.prototype.replay =
    function(context, extent, transform, renderGeometryFunction) {
  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.replayesByZIndex_), Number);
  goog.array.sort(zs);
  var i, ii;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    var replayes = this.replayesByZIndex_[zs[i].toString()];
    var replayType;
    for (replayType in replayes) {
      var replay = replayes[replayType];
      if (ol.extent.intersects(extent, replay.getExtent())) {
        replay.replay(context, transform, renderGeometryFunction);
      }
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.finish = function() {
  var zKey;
  for (zKey in this.replayesByZIndex_) {
    var replayes = this.replayesByZIndex_[zKey];
    var replayKey;
    for (replayKey in replayes) {
      replayes[replayKey].finish();
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.getReplay =
    function(zIndex, replayType) {
  var zIndexKey = goog.isDef(zIndex) ? zIndex.toString() : '0';
  var replayes = this.replayesByZIndex_[zIndexKey];
  if (!goog.isDef(replayes)) {
    replayes = {};
    this.replayesByZIndex_[zIndexKey] = replayes;
  }
  var replay = replayes[replayType];
  if (!goog.isDef(replay)) {
    var constructor = ol.render.canvas.BATCH_CONSTRUCTORS_[replayType];
    goog.asserts.assert(goog.isDef(constructor));
    replay = new constructor();
    replayes[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.replayesByZIndex_);
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType, function(new: ol.render.canvas.Replay)>}
 */
ol.render.canvas.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.canvas.ImageReplay,
  'LineString': ol.render.canvas.LineStringReplay,
  'Polygon': ol.render.canvas.PolygonReplay
};
