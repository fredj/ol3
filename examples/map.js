/*
 * author : CLS - Michael Nguyen
 */

var coorUpLeft = [];
var field = VectorField.read(localCurrentData, true);
var display = new MotionDisplay(field, 5000);
var i = 0;

var map = new ol.Map({
	layers : [new ol.layer.Tile({
		source : new ol.source.MapQuest({
			layer : 'sat'
		})
	})],
	renderer : 'canvas',
	target : 'map',
	view : new ol.View2D({
		center : [0, 0],
		zoom : 2
	})
});

var proj = map.getView().getProjection().getCode();

var view = map.getView();
	view.setCenter([37253888.8449901076, 211117.515792289]);
	view.setResolution(2200);


map.getWidth = function() {
	var me = this;
	var widthString = $('#map').css('width');
	var width = widthString.substring(0, widthString.indexOf('px'));
	return width;
};

map.getHeight = function() {
	var me = this;
	var heightString = $('#map').css('height');
	var height = heightString.substring(0, heightString.indexOf('px'));

	return height;
};

map.getCoorMin = function() {
	return map.getCoordinateFromPixel([0, map.getHeight()]);
};

map.getCoorMax = function() {
	return coorMax = map.getCoordinateFromPixel([map.getWidth(), 0]);
};

map.calculScale = function() {

	var coorMin = map.getCoorMin(), coorMax = map.getCoorMax();
	coorMin = ol.proj.transform(coorMin, proj, 'EPSG:4326');
	coorMax = ol.proj.transform(coorMax, proj, 'EPSG:4326');
	var widthSource = Math.ceil(Math.abs(coorMin[0] - coorMax[0]));
	return (map.getWidth() / widthSource);
};

map.getPixel = function(coordinate) {
	return map.getPixelFromCoordinate(ol.proj.transform(coordinate, 'EPSG:4326', proj));
};

//var field = VectorField.read(currentData, true);
var display = new MotionDisplay(field, 5000);

var start = (new Date()).getTime();

map.on('postcompose', function(event) {

	var canvasContext = event.context;

	display.animate(canvasContext);

	map.render();
});

map.on('moveend', function(evt) {

	var coorCurrent = map.getCoorMin();

	if (!(coorCurrent[0] === coorUpLeft[0] && coorCurrent[1] === coorUpLeft[1])) {

		coorUpLeft = coorCurrent;
		var coorCurrentMax = ol.proj.transform(map.getCoorMax(), proj, 'EPSG:4326');
		coorCurrent = ol.proj.transform(coorCurrent, proj, 'EPSG:4326');
		newBounds(coorCurrent, coorCurrentMax, display);
	}

});

$('#wind').on('click', function(){
	field = VectorField.read(windData, true);
	display = new MotionDisplay(field, 5000);
	display.speedScale = 45;
	var view = map.getView();
	view.setCenter([-3380405.8449901076, 6526847.515792289]);
	view.setResolution(4000);
	
});

$('#currents').on('click', function(){
	field = VectorField.read(currentData, true);
	display = new MotionDisplay(field, 5000);
	display.speedScale = 3000;
	var view = map.getView();
	view.setCenter([35253888.8449901076, 281217.515792289]);
	view.setResolution(2200);
});

$('#localCurrents').on('click', function(){
	field = VectorField.read(localCurrentData, true);
	display = new MotionDisplay(field, 5000);
	display.speedScale = 3000;
	var view = map.getView();
	view.setCenter([37253888.8449901076, 211117.515792289]);
	view.setResolution(2200);
});

$(map.getViewport()).on('mousemove', function(evt) {

	var field = display.field;
	var coor = map.getEventCoordinate(evt.originalEvent);
	coor = ol.proj.transform(coor, proj, 'EPSG:4326');

	if (field.inBounds(coor[0], coor[1])) {

		var v = field.getValue(coor[0], coor[1]);
		var length = v.length();

		$(document.getElementById('value')).html(length + ' m/s');

	}

});

newBounds = function(coorMin, coorMax, display) {
	var nx1, nx0, ny0, ny1;
	var field = display.field;

	if (!(coorMin[0] > field.x1 || coorMax[0] < field.x0 || coorMin[1] > field.y1 || coorMax[1] < field.y0)) {
		if (coorMin[0] < field.x0) {
			nx0 = field.x0;
		} else {
			nx0 = coorMin[0];
		}

		if (coorMax[0] > field.x1) {
			nx1 = field.x1;
		} else {
			nx1 = coorMax[0];
		}

		if (coorMin[1] < field.y0) {
			ny0 = field.y0;
		} else {
			ny0 = coorMin[1];
		}

		if (coorMax[1] > field.y1) {
			ny1 = field.y1;
		} else {
			ny1 = coorMax[1];
		}
		display.changeBounds(nx0, nx1, ny0, ny1);
	}

};

map.render();

