import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import XYZ from '../src/ol/source/XYZ.js';

const key = 'pk.eyJ1IjoidHNjaGF1YiIsImEiOiJjaW5zYW5lNHkxMTNmdWttM3JyOHZtMmNtIn0.CDIBD8H-G2Gf-cPkIuWtRg';

const urls = [
  'https://{a-c}.tiles.mapbox.com/v4/mapbox.blue-marble-topo-jan/{z}/{x}/{y}.png?access_token=' + key,
  'https://{a-c}.tiles.mapbox.com/v4/mapbox.blue-marble-topo-bathy-jan/{z}/{x}/{y}.png?access_token=' + key,
  'https://{a-c}.tiles.mapbox.com/v4/mapbox.blue-marble-topo-jul/{z}/{x}/{y}.png?access_token=' + key,
  'https://{a-c}.tiles.mapbox.com/v4/mapbox.blue-marble-topo-bathy-jul/{z}/{x}/{y}.png?access_token=' + key
];

const source = new XYZ();

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: source
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});


function updateUrl(index) {
  source.setUrl(urls[index]);
}

const buttons = document.getElementsByClassName('switcher');
for (let i = 0, ii = buttons.length; i < ii; ++i) {
  const button = buttons[i];
  button.addEventListener('click', updateUrl.bind(null, Number(button.value)));
}

updateUrl(0);
