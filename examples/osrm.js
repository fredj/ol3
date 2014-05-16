goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.Polyline');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Select');
goog.require('ol.interaction.Modify');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.style.Text');

function computeRoute(features) {
  var params = features.sort(function(a, b) {
    return a.get('order') - b.get('order')
  }).map(function(feature) {
    var coordinates = feature.getGeometry().getCoordinates();
    var lonlat = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
    return 'loc=' + lonlat.reverse().join(',');
  });
  params.push('instructions=true');
  params.push('jsonp=?');
  params.push('z=18'); // FIXME

  return $.ajax({
    url: 'http://routing.osm.ch/routed-bike/viaroute',
    dataType: 'json',
    data: params.join('&'),
    cache: true
  }).then(function(result) {
    if (result.status == 0) {
      var polyline = new ol.format.Polyline({
        factor: 1e6
      });
      var line = polyline.readGeometry(result.route_geometry);
      line.transform('EPSG:4326', 'EPSG:3857');
      var feature = new ol.Feature(line);
      route.clear(); // FIXME
      route.addFeature(feature); // FIXME

      // var flatCoordinates = line.getFlatCoordinates();
      // var stride = line.getStride();
      // var totalDistance = result.route_summary.total_distance;
      // var routeInstructions = result.route_instructions;
      // var distance = 0;
      // for (var i = 0, ii = routeInstructions.length; i < ii; ++i) {
      //   var instructions = routeInstructions[i];
      //   distance += instructions[2];
      //   var coordinates = ol.geom.flat.interpolate.lineString(flatCoordinates, 0, flatCoordinates.length, stride, distance / totalDistance);
      //   var point = new ol.Feature(new ol.geom.Point(coordinates));
      //   vectorSource.addFeature(point);
      // }

    }
  });
}

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


var route = new ol.source.Vector();
map.addLayer(new ol.layer.Vector({
  source: route,
  style: function(feature) {
    return [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          width: 5,
          color: '#319FD3'
        })
      })
    ];
  }
}));
var stops = new ol.source.Vector();
map.addLayer(new ol.layer.Vector({
  source: stops,
  style: function(feature) {
    return [
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({color: '#fff'}),
          stroke: new ol.style.Stroke({color: '#000'})
        }),
        text: new ol.style.Text({
          text: String(feature.get('order')),
          fill: new ol.style.Fill({color: '#000'}),
          stroke: new ol.style.Stroke({color: '#fff'}),
          offsetY: -10
        })

      })
    ];
  }
}));


var draw = new ol.interaction.Draw({
  type: 'Point',
  source: stops
});
map.getInteractions().push(draw);

// var select = new ol.interaction.Select();
// var modify = new ol.interaction.Modify({
//   features: select.getFeatures()
// });
// map.getInteractions().extend([draw, select]);

stops.on('addfeature', function(event) {
  var length = this.getFeatures().length;
  var feature = event.feature;
  feature.set('order', length);

  if (length >= 2) {
    //map.removeInteraction(draw);
    var promise = computeRoute(this.getFeatures());
  }
});
