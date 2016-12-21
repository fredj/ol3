goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Image');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.render');



/**
 * @constructor
 */
FlightStyle = function(feature) {

  this.size_ = [140, 100];

  this.anchor_ = [28, 72];

  this.canvas_ = document.createElement('CANVAS');
  this.canvas_.width = this.size_[0];
  this.canvas_.height = this.size_[1];

  var render = ol.render.toContext(this.canvas_.getContext('2d'));

  // <debug>
  var context = this.canvas_.getContext('2d')
  context.strokeStyle = 'red';
  context.rect(0, 0, this.canvas_.width, this.canvas_.height);
  context.stroke();
  // </debug>

  var status_colors = [
    'green', 'orange', 'red'
  ];


  // draw plane and status message
  render.setStyle(new ol.style.Style({
    image: new ol.style.RegularShape({
      radius: 12 * feature.get('scale'),
      points: 3,
      rotation: ol.math.toRadians(feature.get('course')),
      fill: new ol.style.Fill({color: 'blue'})
    }),
    text: new ol.style.Text({
      text: '\u2022' + feature.get('statusMsg'),
      font: 'italic small-caps bold 10px arial',
      textAlign: 'left',
      offsetX: -20,
      offsetY: 20,
      fill: new ol.style.Fill({color: status_colors[feature.get('status')]}),
      stroke: new ol.style.Stroke({color: 'rgb(255,255,255)', width: 1})
    })
  }));
  render.drawGeometry(new ol.geom.Point(this.anchor_));

  // draw flight id
  render.setStyle(new ol.style.Style({
    text: new ol.style.Text({
      text: feature.get('flightId'),
      textAlign: 'left',
      font: 'italic small-caps bold 10px arial',
      stroke: new ol.style.Stroke({color: 'rgb(255,255,255)', width: 1})
    })
  }));
  render.drawGeometry(new ol.geom.Point([76, 28]));

  // draw flight eta
  render.setStyle(new ol.style.Style({
    text: new ol.style.Text({
      text: 'ETA: ' + feature.get('eta'),
      textAlign: 'left',
      stroke: new ol.style.Stroke({color: 'rgb(255,255,255)', width: 1})
    })
  }));
  render.drawGeometry(new ol.geom.Point([76, 38]));

  // line between plane and flight id
  render.setStyle(new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#000',
      width: 1
    })
  }));
  render.drawGeometry(new ol.geom.LineString([[38, 58], [60, 32], [72, 32] ]));
  

  ol.style.Image.call(this, {
    opacity: 1,
    rotateWithView: false,
    rotation: 0,
    scale: 1,
    snapToPixel: true
  });

};
ol.inherits(FlightStyle, ol.style.Image);

FlightStyle.prototype.getImageState = function() {
  return 2; // ol.Image.State.LOADED
};

FlightStyle.prototype.getOrigin = function() {
  return [0, 0];
};

FlightStyle.prototype.getAnchor = function() {
  return this.anchor_;
};

FlightStyle.prototype.getSize = function() {
  return this.size_;
};

FlightStyle.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};

FlightStyle.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.canvas_;
};


var vectorSource = new ol.source.Vector({
  features: [
    new ol.Feature({
      geometry: new ol.geom.Point([425000, 2388000]),
      course: 43,
      flightId: 'AF024',
      eta: '22:14',
      scale: 0.75,
      status: 1,
      statusMsg: '15mn delay'
    }),
    new ol.Feature({
      geometry: new ol.geom.Point([1925000, 1088000]),
      course: 340,
      flightId: 'BA056',
      eta: '23:36',
      scale: 0.75,
      status: 2,
      statusMsg: '2h delay'
    }),
    new ol.Feature({
      geometry: new ol.geom.Point([3425000, 2088000]),
      course: 300,
      flightId: 'GH038',
      eta: '18:32',
      scale: 0.5,
      status: 0,
      statusMsg: 'On time'
    })
  ]
});

var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: function(feature, resolution) {
    return new ol.style.Style({
      image: new FlightStyle(feature)
    });
  }
});

var rasterLayer = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var map = new ol.Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [0, 0],
    zoom: 3
  })
});
