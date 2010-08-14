// setup socket
io.setPath('/js/');

/**
 * parse incoming messages
 * 
 * @param obj
 */
function message(obj){
  var el = document.createElement('p');
  if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
  else if ('message' in obj) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
  document.getElementById('chat').appendChild(el);
  document.getElementById('chat').scrollTop = 1000000;
}

// open socket
var socket = new io.Socket(null, {port: 8080});
socket.connect();
// call message function when receiving new data through socket
socket.on('message', function(data){
  var obj = JSON.parse(data);

  if ('buffer' in obj){
  	// @todo: disable form    
    for (var i in obj.buffer) message(obj.buffer[i]);
  } else message(obj);
});  

/**
 * send "create game" form data via web socket to server
 */
function create_game(){
	var game = document.getElementById('game').value;
	var player = document.getElementById('player').value;
	var json = "{ \"type\": \"create_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	alert(json);
	socket.send(json);
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