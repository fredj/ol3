import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const layer1 = new TileLayer({
  source: new OSM()
});

const layer2 = new TileLayer({
  source: new OSM()
});

const view = new View({
  center: [0, 0],
  zoom: 1
});

const map1 = new Map({
  target: 'layer1',
  layers: [layer1],
  view: view
});

const map2 = new Map({
  target: 'layer2',
  layers: [layer2],
  view: view
});
