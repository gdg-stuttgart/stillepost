
var app = {
    sessionId: undefined, // will be set from the server after connecting
	game: { 
	  players: [] // the id's of players participating in the game, details are in app.players
	},
	players: new Object(), // all players currently online by sessionId
	games_list: [], // names of open/running games
	games: new Object(), // store participants of games for displaying in init_list
	me: function() {
	  return this.players[this.sessionId];
    },
    current: function() {
    	return this.players[this.game.current];
    },
    am_i_current: function() {
    	return this.game.current == this.me().sessionId;
    },
    previous_user: function() {
    	return this.game.players[this.game.players.indexOf(this.game.current) -1];
    }
};

// setup socket
io.setPath('/js/');


function isMessage(message, type, property) {
	return message.type == type && message.property.indexOf(property) != -1;
}


function update_model(message) {
	var targetObject = app;
	var i ;
	var property_chain = message.property;
	console.log('updating model:' + property_chain.join("."));
	for (i = 0 ; i < property_chain.length - 1; i++) {
		targetObject = targetObject[property_chain[i]];
	};
	var targetProperty = property_chain[property_chain.length -1];
	console.log(" ... target: " + targetObject + ", property " + targetProperty);
	if (message.type == "ADD") {
		if (targetObject[targetProperty] === undefined) {
			targetObject[targetProperty]  = [];
		}
		targetObject[targetProperty].push(message.value);
	} else {
		targetObject[targetProperty] = message.value;
	}
}


/**
 * dispatch incoming messages
 * 
 * @param JSON parsed message from server 
 */
function message(obj){
	console.log(obj);
	update_model(obj);
    if (isMessage(obj, "UPDATE", "players")) {
		refresh_players();
	} if (isMessage(obj, "UPDATE", "games_list")) {
		refresh_games_list();
	} if (isMessage(obj, "UPDATE", "games")) {
		refresh_players();
	} if (isMessage(obj, "UPDATE", "game")) {
		refresh_game();
	} if (isMessage(obj, "UPDATE", "state")) {
		if (app.game.state == "FINISHED") {
			showAll();
		} else if (app.game.state == "RUNNING" && app.sessionId != app.game.players[0]) {
	        alert('Game '+app.game.name+' started');
		}
	} if (isMessage(obj, "UPDATE", "current")) {
		user_changed();
	}  
}

function selected_game() {
	var result;
	$('#join_list_games  option:selected').each(function () {
		result = $(this).text();
    });
	return result;
}

function refresh_players() {
	$('#init_list_players').html('');
	$('#game_list_players').html('');
	var is_join_mode = document.getElementById('join').className != "hide";
	console.log("refreshing players, join mode=" + is_join_mode);
	var players;
	if (is_join_mode) {
		players = app.games[selected_game()];
	} else {
		players = app.game.players;
	}
	  for (i = 0;i<players.length;i++){
		var playerid = players[i];
		var player = app.players[playerid];
		console.log('add new player in game: ' + playerid);
		//if (!is_join_mode) {
		$('#init_list_players').append(create_player_list_entry(player));
		//}
		$('#game_list_players').append(create_player_list_entry(player));
	  }
}
function create_player_list_entry(player) {
	var li = $('<li id='+player.sessionId+'></li>');
	append_player_picture(li, player);
	li.append("<span>"+player.name+"</span>");
	return li;
}
var onImgLoad = function(ctx, img_buffer) { return function() {ctx.drawImage(img_buffer,0,0,50,50);}; };

function append_player_picture(parent, player) {
	if (player.url == undefined) {
		return;
	};
	var cEl = document.createElement('canvas');
	cEl.width = 50;
	cEl.height = 50;
	cEl.id = "userpicture";
	var ctx = cEl.getContext('2d');
	var img_buffer = document.createElement('img');
	img_buffer.src = player.url;
	img_buffer.style.display = 'none';
	document.body.appendChild(img_buffer); // this line only needed in safari
	
	img_buffer.onload = onImgLoad(ctx, img_buffer);
	parent.append(cEl);
}

function refresh_games_list() {
	$('#join_list_games').html('');
	var i;
	for (i=0; i < app.games_list.length; i++) {
		var name = app.games_list[i];
	    console.log('add new game: ' + name);
	    $('#join_list_games').append($('<option></option>').text(name));
	};
	if ($('#join_list_games').length > 0) {
		$("#join_list_games option:first").attr('selected','selected');
	};
}

function refresh_game() {
	$('#lblGame').html('');
	$('#lblGame').append(document.createTextNode(app.game.name));
	$('#lblPlayer').html('');
	$('#lblPlayer').append(document.createTextNode(app.me().name));
}

function user_changed() {
	var name;
	if (app.current() == undefined) {
		// game over
		name = "nobody";
	} else {
		name = app.current().name;
	}
	document.getElementById("game_canvas_replacement").firstChild.nodeValue = "Currently drawing: " + name;
	$('#pass_on_button')[0].disabled=!app.am_i_current();
	if (app.am_i_current()) {
		var previous = app.previous_user();
		if (previous !== undefined) {
			drawCanvas(canvas, app.previous_user());
			setTimeout('clear_canvas()', 2000);
		}
		show_canvas();
	}
	// mark active user
	$("#game_list_players > li").attr("class", null);
	if (app.current() != undefined) {
		$("#"+app.current().sessionId).addClass("currentUser");
	}
}


// open socket
var socket = new io.Socket(null, {port: 6060});
var con = socket.connect();

// call message function when receiving new data through socket
socket.on('message', function(data){
	if(data.length == 15) {
		// check if data is not empty (string with 15 chars means no valid JSON string)
		return;
	}
	var obj = JSON.parse(data);
	//console.log("Received "+obj.type+"-event from " + obj.arguments.player + ", plain: "+data);
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
	join_display_players();
}

function switch_play_game() {
	document.getElementById('join').className='hide';
	document.getElementById('init').className='hide';
	document.getElementById('game').className='';	
}

function switch_options_game() {
	document.getElementById('options_game').className='';
	document.getElementById('init').className='hide';
	document.getElementById('join').className='hide';
	document.getElementById('game').className='hide';	
}

/**
 * show players of selected game
 * @param selectElement
 */
function join_display_players(selectElement){
	// TODO: broken throuhg model refactoring, clients do not have all
	// the information anymore.
	send_neu("get_game_participants", { "name": selected_game()});
}

function update_profile() {
	var name = document.getElementById('join_player').value;
	send_neu("update_profile", { "property" : "name", "value": name});
}

/**
 * send "create game" form data via web socket to server
 */
function create_game(){
	var name = document.getElementById('init_new_game').value;
	send_neu("create_game", {"name":name});
	document.getElementById('init_new_game').disabled=true;
	document.getElementById('init_register').disabled=true;
	$('#game_list_players').html('');
	$('#init_list_players').html('');
}

/**
 * send "join game" form data via web socket server
 */
function join_game(){
	var name = document.getElementById('join_list_games').value;
	send_neu("join_game", {"name":name});
	// clear player list, will be updated from a server message later
	$('#game_list_players').html('');
};

/**
 * initiator starts the game and switches to canvas view
 */
function start_game(){
	send_neu('start_game');
	switch_play_game();
};

function show_canvas() {
	$('#game_canvas_replacement')[0].className="hide";
	$('#canvas')[0].className="";
}

/**
 * current player passes the game on to the next player and sees what the next users draw
 */
function pass_on(){
	send_neu('pass_on');
	clear_canvas();
};


function send_neu(type, arguments) {
	var json = new Object();
	json.type = type;
	json.arguments = arguments;
	var ser = JSON.stringify(json);
	console.log("Sending: " + ser);
	socket.send(ser);
}


function doenabled(text, idid) {
	if (text.length > 0)
		document.getElementById(idid).disabled = false;
	else
		document.getElementById(idid).disabled = true;
  }

