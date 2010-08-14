// setup socket
io.setPath('/js/');

function esc(msg){
    return msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

/**
 * parse incoming messages
 * 
 * @param obj
 */
function message(obj){
  alert('got message');
  var el = document.createElement('p');
  if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
  else if ('message' in obj) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
  //document.getElementById('chat').appendChild(el);
  //document.getElementById('chat').scrollTop = 1000000;
  if('message' in obj) {
	  alert(obj.message[0]);
	  var li = document.createElement('li');
	  li.innerHTML = esc(obj.message[0]);
	  document.getElementById('init_list_players').appendChild(li);
  }
}

// open socket
var socket = new io.Socket(null, {port: 8080});
var con = socket.connect();
// call message function when receiving new data through socket
socket.on('message', function(data){
  var obj = JSON.parse(data);
  alert(data);
  if ('buffer' in obj){
  	// @todo: disable form 
	  alert('got message 2');
    for (var i in obj.buffer) message(obj.buffer[i]);
  } else message(obj);
});  

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
	alert('create game');
	var game = document.getElementById('init_new_game').value;
	var player = document.getElementById('init_player').value;
	var json = "{ \"type\": \"create_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	socket.send(json); // asynchronous call
	document.getElementById('init_new_game').disabled=true;
	document.getElementById('init_player').disabled=true;
	document.getElementById('init_register').disabled=true;
	var li = document.createElement('li');
	li.innerHTML = player;
	document.getElementById('init_list_players').appendChild(li);
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