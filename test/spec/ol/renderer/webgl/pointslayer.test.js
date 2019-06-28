import Feature from '../../../../../src/ol/Feature.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import WebGLPointsLayerRenderer from '../../../../../src/ol/renderer/webgl/PointsLayer.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import ViewHint from '../../../../../src/ol/ViewHint.js';
import {POINT_VERTEX_STRIDE, WebGLWorkerMessageType} from '../../../../../src/ol/renderer/webgl/Layer.js';
import {create as createTransform, translate as translateTransform} from '../../../../../src/ol/transform.js';


describe('ol.renderer.webgl.PointsLayer', function() {

  describe('constructor', function() {

    let target;

    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function() {
      document.body.removeChild(target);
    });

    it('creates a new instance', function() {
      const layer = new VectorLayer({
        source: new VectorSource()
      });
      const renderer = new WebGLPointsLayerRenderer(layer);
      expect(renderer).to.be.a(WebGLPointsLayerRenderer);
    });

  });

  describe('#prepareFrame', function() {
    let layer, renderer, frameState;

    beforeEach(function() {
      layer = new VectorLayer({
        source: new VectorSource()
      });
      renderer = new WebGLPointsLayerRenderer(layer);
      const projection = getProjection('EPSG:3857');
      frameState = {
        skippedFeatureUids: {},
        viewHints: [],
        viewState: {
          projection: projection,
          resolution: 1,
          rotation: 0,
          center: [0, 0]
        },
        size: [2, 2],
        extent: [-100, -100, 100, 100]
      };
    });

    it('calls WebGlHelper#prepareDraw', function() {
      const spy = sinon.spy(renderer.helper, 'prepareDraw');
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(true);
    });

    it('fills up a buffer with 2 triangles per point', function(done) {
      layer.getSource().addFeature(new Feature({
        geometry: new Point([10, 20])
      }));
      layer.getSource().addFeature(new Feature({
        geometry: new Point([30, 40])
      }));
      renderer.prepareFrame(frameState);

      const attributePerVertex = POINT_VERTEX_STRIDE;

      renderer.worker_.addEventListener('message', function(event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_BUFFERS) {
          return;
        }
        expect(renderer.verticesBuffer_.getArray().length).to.eql(2 * 4 * attributePerVertex);
        expect(renderer.indicesBuffer_.getArray().length).to.eql(2 * 6);

        expect(renderer.verticesBuffer_.getArray()[0]).to.eql(10);
        expect(renderer.verticesBuffer_.getArray()[1]).to.eql(20);
        expect(renderer.verticesBuffer_.getArray()[4 * attributePerVertex + 0]).to.eql(30);
        expect(renderer.verticesBuffer_.getArray()[4 * attributePerVertex + 1]).to.eql(40);
        done();
      });
    });

    it('clears the buffers when the features are gone', function(done) {
      const source = layer.getSource();
      source.addFeature(new Feature({
        geometry: new Point([10, 20])
      }));
      source.removeFeature(source.getFeatures()[0]);
      source.addFeature(new Feature({
        geometry: new Point([10, 20])
      }));
      renderer.prepareFrame(frameState);

      renderer.worker_.addEventListener('message', function(event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_BUFFERS) {
          return;
        }
        const attributePerVertex = 12;
        expect(renderer.verticesBuffer_.getArray().length).to.eql(4 * attributePerVertex);
        expect(renderer.indicesBuffer_.getArray().length).to.eql(6);
        done();
      });
    });

    it('rebuilds the buffers only when not interacting or animating', function() {
      const spy = sinon.spy(renderer, 'rebuildBuffers_');

      frameState.viewHints[ViewHint.INTERACTING] = 1;
      frameState.viewHints[ViewHint.ANIMATING] = 0;
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(false);

      frameState.viewHints[ViewHint.INTERACTING] = 0;
      frameState.viewHints[ViewHint.ANIMATING] = 1;
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(false);

      frameState.viewHints[ViewHint.INTERACTING] = 0;
      frameState.viewHints[ViewHint.ANIMATING] = 0;
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(true);
    });

    it('rebuilds the buffers only when the frame extent changed', function() {
      const spy = sinon.spy(renderer, 'rebuildBuffers_');

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      frameState.extent = [10, 20, 30, 40];
      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(2);
    });
  });

  describe('#forEachFeatureAtCoordinate', function() {
    let layer, renderer, feature;

    beforeEach(function() {
      feature = new Feature(new Point([0, 0]));
      layer = new VectorLayer({
        source: new VectorSource({
          features: [feature]
        })
      });
      renderer = new WebGLPointsLayerRenderer(layer, {
        sizeCallback: function() {
          return 4;
        }
      });
    });

    it('correctly hit detects a feature', function(done) {
      const transform = translateTransform(createTransform(), 20, 20);
      const projection = getProjection('EPSG:3857');
      const frameState = {
        viewState: {
          projection: projection,
          resolution: 1,
          rotation: 0,
          center: [0, 0]
        },
        layerStatesArray: [{}],
        layerIndex: 0,
        extent: [-20, -20, 20, 20],
        size: [40, 40],
        viewHints: [],
        coordinateToPixelTransform: transform
      };
      let found;
      const cb = function(feature) {
        found = feature;
      };

      renderer.prepareFrame(frameState);
      renderer.worker_.addEventListener('message', function() {
        if (!renderer.hitRenderInstructions_) {
          return;
        }
        renderer.renderFrame(frameState);

        function checkHit(x, y, expected) {
          found = null;
          renderer.forEachFeatureAtCoordinate([x, y], frameState, 0, cb, null);
          expect(found).to.be(expected ? feature : null);
        }

        checkHit(0, 0, true);
        checkHit(1, -2, true);
        checkHit(-2, 1, true);
        checkHit(2, 0, false);
        checkHit(1, -3, false);

        done();
      });
    });
  });

});
