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
  console.log(obj);
  if ('message' in obj) {
	  // add new player to player list
	  //li.innerHTML = esc(obj.message[0]);
	  //document.getElementById('init_list_players').appendChild(li);
	  $('#init_list_players').append($('<li></li>').text(obj.message[0]));
  }
  // add new games and players to list
  else if (obj.type == 'game'){
	  // add to games list
	  for(my_game in obj.arguments){
		  games.arguments[my_game] = obj.arguments[my_game];  
	  }
	  console.log('add new players');
	  // clear player list
	  $('#game_list_players').html('');
	  // rebuild player list
	  for(my_game in obj.arguments){
		  for(my_players in obj.arguments[my_game].players){
			  console.log('add new player');
			  console.log(my_players);
			  $('#game_list_players').append('<li>'+my_players+'</li>');
		  }
	  }
	  // add new game
	  for(my_game in obj.arguments){
		  console.log('add new game: ' + my_game);
		  $('#join_list_games').append('<option>'+my_game+'</option>');
	  }
  }
  //add all games to select list
  else if (obj.type == 'games_list') {
	  // copy games list
	  games = obj;
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
	console.log("Received "+obj.type+"-event from " + obj.arguments.player + ", plain: "+data);
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
	// game name
	var key = selectElement.options[selectElement.selectedIndex].text;
	// clear players list
	$('#join_list_players').html('');
	// add players of selected game
	console.log(games);
	console.log(key);
	for(player in games.arguments[key].players){
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
	// clear player list
	$('#game_list_players').html('');
	// add yourself to player list
	console.log('add new player');
	$('#game_list_players').append('<li>'+player+'</li>');
}

/**
 * send "join game" form data via web socket server
 */
function join_game(){
	var name = document.getElementById('join_list_games').value;
	var player = document.getElementById('join_player').value;
	setGame(name, player);
	send("join_game");
	// clear player list
	$('#game_list_players').html('');
	// rebuild player list
	for(my_players in games.arguments[name].players){
		$('#game_list_players').append('<li>'+my_players+'</li>');
	}
	// add yourself to player list
	$('#game_list_players').append('<li>'+player+'</li>');
};

/**
 * initiator starts the game and switches to canvas view
 */
function start_game(){
	send('start_game');
	switch_play_game();
};

/**
 * current player passes the game on to the next player and sees what the next users draw
 */
function pass_on(){
	send('pass_on');
	//switch_play_game();
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
