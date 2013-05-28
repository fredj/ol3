goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var exportJPEGElement = document.getElementById('export-jpeg');
exportJPEGElement.addEventListener('click', function(e) {
  e.target.href = map.getRenderer().getCanvas().toDataURL('image/jpeg');
}, false);

var exportPNGElement = document.getElementById('export-png');
exportPNGElement.addEventListener('click', function(e) {
  e.target.href = map.getRenderer().getCanvas().toDataURL('image/png');
}, false);

var exportPDFElement = document.getElementById('export-pdf');
exportPDFElement.addEventListener('click', function(e) {
  // FIXME: add attributions and logos
  // FIXME: map size
  var img = map.getRenderer().getCanvas().toDataURL('image/jpeg');
  var doc = new jsPDF('landscape', 'mm', 'a4');

  doc.addImage(img, 'jpeg', 10, 10);

  doc.setFont('courier');
  doc.setFontType('normal');
  doc.text(10, 200, "FIXME: map.get('attributions').join(', ')");

  e.target.href = doc.output('datauristring');
});

