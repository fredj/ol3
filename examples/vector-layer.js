import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {Stroke, Style} from '../src/ol/style.js';
import {getVectorContext} from '../src/ol/render.js';

const strokeStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(0, 159, 128, 1)',
    width: 2,
  }),
});

const innerStrokenStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(0, 159, 128, 0.5)',
    width: 22,
    lineJoin: 'bevel',
  }),
});

const countriesLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON(),
  }),
  style: strokeStyle,
});

const innerStrokeLayer = new TileLayer({
  source: new XYZ(),
});

const osm = new TileLayer({
  source: new OSM(),
});

innerStrokeLayer.on('postrender', function (event) {
  const vectorContext = getVectorContext(event);
  countriesLayer.getSource().forEachFeature(feature => {
    setClippingGeometry(vectorContext, feature.getGeometry());
    vectorContext.drawFeature(feature, innerStrokenStyle);
    resetClipping(vectorContext);
  });
});

const map = new Map({
  layers: [osm, innerStrokeLayer, countriesLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

function setClippingGeometry(vectorContext, geometry) {
  const context = vectorContext.context_;
  const type = geometry.getType();
  const flatCoordinates = geometry.getOrientedFlatCoordinates();
  const stride = geometry.getStride();

  context.save();
  context.beginPath();
  if (type === 'Polygon') {
    const ends = geometry.getEnds();
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      vectorContext.moveToLineTo_(flatCoordinates, 0, ends[i], stride, true);
    }
  } else if (type === 'MultiPolygon') {
    let offset = 0;
    const endss = geometry.getEndss();
    for (let i = 0, ii = endss.length; i < ii; ++i) {
      const ends = endss[i];
      offset = vectorContext.drawRings_(flatCoordinates, offset, ends, stride);
    }
  } else {
    console.error('Unsupported geometry type', type);
  }
  context.clip();
}

function resetClipping(vectorContext) {
  vectorContext.context_.restore();
  // the save/restore mess with fill and stroke state.
  vectorContext.contextStrokeState_ = null;
  vectorContext.contextFillState_ = null;
}
