var games = new Array();

// setup socket
io.setPath('/js/');

function esc(msg){
    return msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

/**
 * eval incoming messages
 * 
 * @param JSON parsed message from server 
 */
function message(obj){
  games = obj;
  if ('message' in obj) {
	  // add new player to player list
	  //li.innerHTML = esc(obj.message[0]);
	  //document.getElementById('init_list_players').appendChild(li);
	  $('#init_list_players').append($('<li></li>').text(obj.message[0]));
  }
  //add all games to select list
  else if (obj.type == 'games_list') {
	  for(key in obj.arguments){
		  console.log('add game:' + key);
		  //var option = document.createElement('option');
		  //option.value=key;
		  //option.text=key;
		  //console.log(option);
		  $('#join_list_games').append($('<option></option>').val(key).html(key));
		  //document.getElementById('join_list_games').appendChild(option);
	  }
	  //if(document.getElementById('join_list_games').childNodes.length>0){
	  //	document.getElementById('join_list_games').childNodes[0].selected=true;
  	  //}
  	  if ($('#join_list_games').length > 0) {
  	  	$("#join_list_games option:first").attr('selected','selected');
  	  }
  } else if (obj.type == "draw") {
	  drawLine(obj.arguments.line);
  }
}

// open socket
var socket = new io.Socket(null, {port: 8080});
var con = socket.connect();
var game = new Object();

function setGame(gameName, player) {
	game.player = player;
	game.name = gameName;
	var playerNode = document.createTextNode(player);
	document.getElementById('lblPlayer').appendChild(playerNode);
	var gameNode = document.createTextNode(game.name);
	document.getElementById('lblGame').appendChild(gameNode);
}

// call message function when receiving new data through socket
socket.on('message', function(data){
	if(data.length == 15) {
		// check if data is not empty (string with 15 chars means no valid JSON string)
		return;
	}
	var obj = JSON.parse(data);
	console.log("Received "+obj.type+"-event from " + obj.arguments.player);
	message(obj);
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
	document.getElementById('join_list_games').focus();
}

function switch_play_game() {
	document.getElementById('join').className='hide';
	document.getElementById('init').className='hide';
	document.getElementById('game').className='';	
}

/**
 * show players of selected game
 * @param selectElement
 */
function join_display_players(selectElement){
	console.log('join_display_players');
	var key = selectElement.options[selectElement.selectedIndex].text;
	for(i = 0; i< document.getElementById('join_list_players').childNodes.length; i++){
		document.getElementById('join_list_players').removeChild(document.getElementById('join_list_players').childNodes[i]);
	}
	for(player in games[key].players){
		var li = document.createElement('li');
		li.innerHTML = player;
		document.getElementById('join_list_players').appendChild(li);
	}
}

/**
 * send "create game" form data via web socket to server
 */
function create_game(){
	var name = document.getElementById('init_new_game').value;
	var player = document.getElementById('init_player').value;
	setGame(name, player);
	send("create_game");
	document.getElementById('init_new_game').disabled=true;
	document.getElementById('init_player').disabled=true;
	document.getElementById('init_register').disabled=true;
	var li = document.createElement('li');
	// TODO: is this still needed?
	li.innerHTML = player;
	document.getElementById('init_list_players').removeChild(document.getElementById('init_list_players').childNodes[1]);
	document.getElementById('init_list_players').appendChild(li);
}

/**
 * send "join game" form data via web socket server
 */
function join_game(){
	var name = document.getElementById('join_list_games').value;
	var player = document.getElementById('join_player').value;
	setGame(name, player);
	send("join_game");
};

function send(type, line) {
	var json = new Object();
	json.type = type;
	json.arguments = new Object();
	json.arguments.game = game.name;
	json.arguments.player = game.player;
	if (line != null) {
		json.arguments.line = line;
	}
	var ser = JSON.stringify(json);
	console.log(ser);
	socket.send(ser);
}
