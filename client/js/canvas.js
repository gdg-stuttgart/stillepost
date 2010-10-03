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
	line = [lastMousePosition, current];
	lastMousePosition = current;
	drawLine(line);
	send_neu("draw", line);
};

var canvasOnMouseUp = function(e) {
	lastMousePosition = null;
};

if ('attachEvent' in window) {
	window.attachEvent('onload', canvasRegistrationFn);
} else {
	window.addEventListener('load', canvasRegistrationFn, false);
}

function drawLine(line, canvas) {
	if (canvas == null) {
		canvas = document.getElementById('canvas'); 
	}
	context = canvas.getContext("2d");
	context.beginPath();
	from = line[0];
	to = line[1];
	context.moveTo(from[0], from[1]);
	context.lineTo(to[0], to[1]);
	context.stroke();
	context.closePath();
}

function clear_canvas() {
	var context = $('#canvas')[0].getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
}

function getHistory(player) {
	var result = app.game.draw_history[player] ;
	if (result == null) {
		result = [];
		app.game.draw_history[player] = result;
	}
	return result;
}

function showAll() {
	$('#canvas')[0].className='hide';
	var section = document.getElementById("sectionCanvas");
	var home = document.createElement('button');
	home.setAttribute("onclick", "switch_options_game();return false");
	home.setAttribute("type", "button");
	home.setAttribute("name", "submit");
	home.setAttribute("value", "Home");
	section.appendChild(home);
	for (player in app.game.draw_history) {
		drawCanvas(createCanvas(player), player);
	}
}

function drawCanvas(canvas, player) {
	var lines = getHistory(player);
	for (i = 0; i < lines.length; i++) {
		drawLine(lines[i], canvas);
	}	
}

function createCanvas(player) {
	var section = document.getElementById("sectionCanvas");
	var playerCanvas = document.createElement('canvas');
	playerCanvas.setAttribute('width', canvas.width);
	playerCanvas.setAttribute('height', canvas.height);
	playerCanvas.setAttribute('id', 'canvas' + player);
	section.appendChild(playerCanvas);
	var ctx = playerCanvas.getContext("2d");
	ctx.fillText(player, 10, 10);
	return playerCanvas;
}

