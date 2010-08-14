var canvas = null;
var lastMousePosition= null;
var canvasRegistrationFn = function() {
	canvas = document.getElementById('canvas');
	canvas.addEventListener('mousedown', canvasOnMouseDown, false);
	canvas.addEventListener('mousemove', canvasOnMouseMove, false);
	canvas.addEventListener('mouseup', canvasOnMouseUp, false);
	// TODO: if we do not set it here, the actual size will be different from
	// the size given in style.css. Why?
	canvas.height = 400;
	canvas.width = 600;
};

function convertToCanvasCoordinates(absX, absY) {
	return [absX - canvas.offsetLeft, absY - canvas.offsetTop];
}

var canvasOnMouseDown = function(e) {
	from = convertToCanvasCoordinates(e.pageX, e.pageY) ;
	lastMousePosition = from;
};

var canvasOnMouseMove = function(e) {
	if (lastMousePosition == null) {
		return;
	}
	current = convertToCanvasCoordinates(e.pageX, e.pageY);
	drawLine([lastMousePosition, current]);
	lastMousePosition = current;
};

var canvasOnMouseUp = function(e) {
	lastMousePosition = null;
};

if ('attachEvent' in window) {
	window.attachEvent('onload', canvasRegistrationFn);
} else {
	window.addEventListener('load', canvasRegistrationFn, false);
}

function drawLine(line) {
	context = document.getElementById('canvas').getContext("2d");
	context.beginPath();
	context.moveTo(line[0][0], line[0][1]);
	context.lineTo(line[1][0], line[1][1]);
	context.stroke();
	context.closePath();
	var data = new Object();
	data.type = "draw"
	data.arguments = new Object();
	data.game = game;
	data.player = player;
	data.line = line;
	socket.send(JSON.stringify(data));
}
