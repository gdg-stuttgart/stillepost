var games = new Array();

// setup socket
io.setPath('/js/');

/**
 * eval incoming messages
 * 
 * @param JSON parsed message from server 
 */
function message(obj){
	console.log(obj);
	if ('message' in obj) {
		// add new player to player list
		$('#init_list_players').append($('<li></li>').text(obj.message[0]));
	}
	// add new games and players to list
	else if (obj.type == 'game'){
		// add to games list
		for(my_game in obj.arguments){
			games.arguments[my_game] = obj.arguments[my_game];  
		}
		console.log('add new players');
		// clear player lists
		$('#game_list_players').html('');
		$('#init_list_players').html('');
		// rebuild player lists
		for(my_game in obj.arguments){
			for(my_players in obj.arguments[my_game].players){
				console.log('add new player');
				console.log(my_players);
				$('#game_list_players').append($('<li></li>').text(my_players));
				$('#init_list_players').append($('<li></li>').text(my_players));
			}
		}
		// add new game
		for(my_game in obj.arguments){
			console.log('add new game: ' + my_game);
			$('#join_list_games').append($('<option></option>').text(my_game));
		}
	}
	//add all games to select list
	else if (obj.type == 'games_list') {
		// copy games list
		games = obj;
		for(key in obj.arguments){
			console.log('add game:' + key);
			$('#join_list_games').append($('<option></option>').val(key).html(key));
		}
  		if ($('#join_list_games').length > 0) {
			$("#join_list_games option:first").attr('selected','selected');
		}
	}
	// alert players that game started
	else if (obj.type == 'game_started') {
		alert('game started');
		games.arguments[game.name].started=true;
		for (player in games.arguments[game.name].players) {
			updateCurrentPlayer(player);
			break;
		}
	} else if (obj.type == "draw") {
		var line = obj.arguments.line;
		drawLine(line);
		saveLine(line, obj.arguments.player);
	} else if (obj.type == "done_players") {
		console.log('current drawer: ');
		console.log(get_current_drawer(obj));
		clear_canvas();
		console.log('globale games var:');
		console.log(games);
		// refresh done players
		games.arguments[game.name].done_players = obj.arguments;
		// show history if last player is done
		var player_size = 0;
		for (var k in games.arguments[game.name].players){
			player_size++;
		}
		if(games.arguments[game.name].done_players.length == player_size){
			showAll();
		}
		if (is_current_player(obj)) {
			drawCanvas(canvas, obj.arguments[obj.arguments.length - 1]);
			setTimeout('clear_canvas()', 2000);
			$('#pass_on_button')[0].disabled=false;
			show_canvas();
		}
		else {
			updateCurrentPlayer();
		}
		 
	}
}

function updateCurrentPlayer(player) {
	document.getElementById("game_canvas_replacement").firstChild.nodeValue = player;
}

// open socket
var socket = new io.Socket(null, {port: 8080});
var con = socket.connect();
var game = new Object();

function setGame(gameName, player) {
	game.player = player;
	game.name = gameName;
	$('#lblGame').append(document.createTextNode(gameName));
	$('#lblPlayer').append(document.createTextNode(player));
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
	$('#options_game')[0].className='hide';
	$('#init')[0].className='';
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
	// add yourself to player object
	games.arguments[game.name].players[player] = new Object();
	games.arguments[game.name].players[player].picture = new Array();
};

/**
 * initiator starts the game and switches to canvas view
 */
function start_game(){
	send('start_game');
	switch_play_game();
	games.arguments[game.name].started=true;
	// enable pass on button for initiator
	$('#pass_on_button')[0].disabled=false;
	show_canvas();
};

function show_canvas() {
	$('#game_canvas_replacement')[0].className="hide";
	$('#canvas')[0].className="";
}

/**
 * current player passes the game on to the next player and sees what the next users draw
 */
function pass_on(){
	// send via websocket
	send('pass_on');
	// disable pass on button for player
	$('#pass_on_button')[0].disabled=true;
	// clear own canvas
	clear_canvas();
	// add yourself to done player object
	games.arguments[game.name].done_players.push(game.player);
	// get size of players object
	var player_size = 0;
	for (var k in games.arguments[game.name].players){
		player_size++;
	}
	// show history if last player is done
	if(games.arguments[game.name].done_players.length == player_size){
		showAll();
	}
};

function is_current_player(obj) {
	// get position of current player in list of all players
	current_player_position = 0;
	for(one_player in games.arguments[game.name].players){
		if(one_player == game.player){
			break;
		}
		current_player_position++;
	}
	console.log('current player position: ' + current_player_position);
	// get position of latest done player in list of all players
	current_player_done_position = 0;
	for(one_player in games.arguments[game.name].players){
		if(one_player == obj.arguments[obj.arguments.length-1]){
			break;
		}
		current_player_done_position++;
	}
	console.log('current done player position: ' + current_player_done_position);
	// enable pass on button if current player is after last done player in the players list
	if(current_player_done_position+1 == current_player_position){
		return true;
	} else {
		return false;
	}
}

/**
 * returns the current drawer
 * @param done_players
 * @returns
 */
function get_current_drawer(done_players){
	var stop_next = false;
	for(one_player in games.arguments[game.name].players){
		if(stop_next){
			return one_player;
		}
		if(one_player == done_players.arguments[done_players.arguments.length-1]){
			stop_next = true;
		}
	}
}

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

function doenabled(text, idid) {
	if (text.length > 0)
		document.getElementById(idid).disabled = false;
	else
		document.getElementById(idid).disabled = true;
  }
  
function tail(hash) {
	var current_player = null;
	for (player in hash) {
		current_player = player;
	}
	return current_player;
}
