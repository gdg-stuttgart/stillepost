// setup socket
io.setPath('/js/');


// open socket
var socket = new io.Socket(null, {port: 8080});
var con = socket.connect();
// call message function when receiving new data through socket
socket.on('message', function(data){
  var obj = JSON.parse(data);
  if (obj.type == "draw") {
	  
	  drawLine(obj.arguments[0], obj.arguments[1]);
  }
}); 

function drawLine(from, to) {
	context = document.getElementById('canvas').getContext("2d");
	context.beginPath();
    context.moveTo(from[0], from[1]);
    context.lineTo(to[0], to[1]);
    context.closePath();
    context.stroke();
}

/**
 * init a game
 */
function switch_init_game(){
	document.getElementById('options_game').className='hide';
	document.getElementById('init').className='';
}

/**
 * join a game
 */
function switch_join_game(){
	document.getElementById('options_game').className='hide';
	document.getElementById('join').className='';
}

/**
 * send "create game" form data via web socket to server
 */
function create_game(){
	var game = document.getElementById('game').value;
	var player = document.getElementById('player').value;
	var json = "{ \"type\": \"create_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	socket.send(json); // asynchronous call
}

/**
 * send "join game" form data via web socket server
 */
function join_game(){
	var game = document.getElementById('game').value;
	var player = document.getElementById('player').value;
	var json = "{ \"type\": \"join_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	alert(json);
	socket.send(json);
}