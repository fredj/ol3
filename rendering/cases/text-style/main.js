import Map from '../../../src/ol/CompositeMap.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Text from '../../../src/ol/style/Text.js';
import Style from '../../../src/ol/style/Style.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';


const vectorSource = new VectorSource();
let feature;

feature = new Feature({
  geometry: new Point([-40, 38])
});
feature.setStyle(new Style({
  text: new Text({
    scale: 1,
    text: 'hello',
    font: '12px sans-serif'
  })
}));
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new Point([-30, 0])
});
feature.setStyle(new Style({
  text: new Text({
    scale: 1,
    text: 'hello',
    fill: new Fill({
      color: 'red',
      font: '14px sans-serif'
    }),
    stroke: new Stroke({
      color: '#000',
      width: 3
    })
  })
}));
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new Point([40, 30])
});
feature.setStyle(new Style({
  text: new Text({
    scale: 1,
    rotateWithView: true,
    text: 'hello',
    font: '12px sans-serif',
    stroke: new Stroke({
      color: [10, 10, 10, 0.5]
    })
  })
}));
vectorSource.addFeature(feature);

new Map({
  layers: [
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1
  })
});

render();
