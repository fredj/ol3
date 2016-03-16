import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Circle, LineString} from '../src/ol/geom.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {get as getProjection} from '../src/ol/proj.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.world-dark.json'
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const style = new Style({
  stroke: new Stroke({
    color: 'rgba(20, 77, 148, 0.6)',
    width: 3
  }),
  fill: new Fill({
    color: 'rgba(20, 77, 148, 0.6)'
  })
});

function addLater(feature, timeout) {
  window.setTimeout(function() {
    feature.set('start', new Date().getTime());
    flightsSource.addFeature(feature);
  }, timeout);
}

const pointsPerMs = 0.01;
function animateFlights(event) {
  const vectorContext = event.vectorContext;
  const frameState = event.frameState;
  vectorContext.setStyle(style);

  event.context.shadowColor = '#95c6fe';
  event.context.shadowBlur = 10;
  event.context.globalCompositeOperation = 'lighter';
  const features = flightsSource.getFeatures();
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const coords = feature.getGeometry().getCoordinates();
    const elapsedTime = frameState.time - feature.get('start');
    const elapsedPoints = Math.floor(elapsedTime * pointsPerMs);

    if (elapsedPoints >= coords.length) {
      feature.set('finished', true);
    }

    coords.length = Math.min(elapsedPoints, coords.length);
    const currentLine = new LineString(coords);

    // directly draw the line with the vector context
    vectorContext.drawGeometry(currentLine);
    if (feature.get('finished')) {
      const coordinate = feature.getGeometry().getLastCoordinate();
      vectorContext.drawGeometry(new Circle(coordinate, 300000));
    }
  }
  event.context.shadowBlur = 0;
  event.context.globalCompositeOperation = 'source-over';
  // tell OpenLayers to continue the animation
  map.render();
};

const flightsSource = new VectorSource({
  wrapX: false,
  attributions: 'Flight data by <a href="http://openflights.org/data.html">OpenFlights</a>,',
  loader: function() {
    fetch('data/openflights/flights.json').then(function(response) {
      return response.json();
    }).then(function(json) {
      const flightsData = json.flights;
      for (let i = 0; i < flightsData.length; i++) {
        const flight = flightsData[i];
        const from = flight[0];
        const to = flight[1];

        // create an arc circle between the two locations
        const arcGenerator = new arc.GreatCircle(
          {x: from[1], y: from[0]},
          {x: to[1], y: to[0]}
        );

        const arcLine = arcGenerator.Arc(100, {offset: 10});
        if (arcLine.geometries.length === 1) {
          const line = new LineString(arcLine.geometries[0].coords);
          line.transform(getProjection('EPSG:4326'), getProjection('EPSG:3857'));

          const feature = new Feature({
            geometry: line,
            finished: false
          });
          // add the feature with a delay so that the animation
          // for all features does not start at the same time
          addLater(feature, i * 50);
        }
      }
      map.on('postcompose', animateFlights);
    });
  }
});

const flightsLayer = new VectorLayer({
  source: flightsSource,
  style: null
});
map.addLayer(flightsLayer);
