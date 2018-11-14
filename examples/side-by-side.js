import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const source = new OSM();

const layer1 = new TileLayer({
  source: source
});

const layer2 = new TileLayer({
  source: source
});

const view = new View({
  center: [0, 0],
  zoom: 1
});

const map1 = new Map({
  target: 'map1',
  layers: [layer1],
  view: view
});

const map2 = new Map({
  target: 'map2',
  layers: [layer2],
  view: view
});
