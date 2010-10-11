
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
    },
    is_current_after_me: function() {
    	var player_ids = this.game.players;
    	return player_ids.indexOf(this.sessionId) < player_ids.indexOf(this.game.current);
    },
    initialize_profile: function() {
	  var name = localStorage.getItem("name");
	  if (name != null) {
		  send_neu("update_profile", { "property" : "name", "value": name});
	  } else {
		  name = this.me().name;
	  }
	  $('#join_player').val(name);
      
	  var url = localStorage.getItem("url");
	  if (url != null) {
	    send_neu("update_profile", { "property" : "url", "value": url});
	  } else {
		  url = this.me().url;
	  }
	  $('#img_profile_url').attr("src", url);
	  
	  // I do not want be called again
	  this.initialize_profile = function() {};
    }
};

// firefox without firebugs does not have console defined
if (typeof(console) === 'undefined' || console == null) {
	console = {
		error:function(){},
		warn:function(){},
		log:function(){}
	};
}

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
		if (targetObject[property_chain[i]] === undefined) {
			targetObject[property_chain[i]] = new Object();
		}
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
    	app.initialize_profile();
		refresh_online_players();
	} if (isMessage(obj, "UPDATE", "games_list")) {
		refresh_games_list();
	} if (isMessage(obj, "UPDATE", "games")) {
		refresh_join_players();
	} if (isMessage(obj, "UPDATE", "game")) {
		refresh_game();
		refresh_game_players();
	} if (isMessage(obj, "UPDATE", "state")) {
		if (app.game.state == "FINISHED") {
			showAll();
		} else if (app.game.state == "RUNNING" && app.sessionId != app.game.players[0]) {
	        alert('Game '+app.game.name+' started');
		}
	} if (isMessage(obj, "UPDATE", "current")) {
		user_changed();
	} if (isMessage(obj, "UPDATE", "invited")) {
		var game_name = app.invited.game;
		alert("You have been invited to game " + game_name);
		send_neu("join_game", {"name": game_name});
		switch_play_game();
	}  if (isMessage(obj, "ADD", "draw_history")) {
		if (app.is_current_after_me()) {
			var current_history = app.game.draw_history[app.game.current];
			draw_line(current_history[current_history.length - 1]);
		}
	}  
}

function selected_game() {
	var result;
	$('#join_list_games  option:selected').each(function () {
		result = $(this).text();
    });
	return result;
}

function refresh_online_players() {
	console.log("refreshing list of online players");
	var list = $('#online_list_players');
	list.addClass("fade");
	setTimeout("refresh_online_players_continued()", 1000);
}

function refresh_online_players_continued() {
	console.log("refreshing list of online players");
	var list = $('#online_list_players');
	list.addClass("fade");
	var playerids = [];
	for(var playerid in app.players) {
		playerids.push(playerid); 
	};
	refresh_players(list, playerids, false /*setid*/);
	list.removeClass("fade");
}

function refresh_join_players() {
	console.log("refreshing players of join list");
	var list = $('#join_list_players');
	refresh_players(list, app.games[selected_game()], false /*setid*/);
}

function refresh_game_players() {
	console.log("refreshing players of game list");
	var list = $('#game_list_players');
	refresh_players(list, app.game.players, true /*setid*/);
}

function refresh_players(list, playerids, setid) {
	if (playerids == undefined) {
		console.log("not refresing player list because player ids are undefined");
		return;
	}
	list.html('');
	var i;
	for (i = 0;i<playerids.length;i++){
		var playerid = playerids[i];
		var player = app.players[playerid];
		list.append(create_player_list_entry(player, setid));
	}
}

var player_drag_start = function(sessionId) {
	return function(event) { 
		var data = event.originalEvent.dataTransfer; 
		console.log("Dragging " + sessionId );
		data.setData("Text", sessionId);
		return true;
	};
};
var player_drag_end = function(event) {
    if (event.preventDefault) event.preventDefault();
    return false;
  };
  
function create_player_list_entry(player, createId) {
	var li;
	if (createId) {
		li = $('<li id='+player.sessionId+'></li>');
	}
	else {
		li = $('<li draggable="true"></li>');
	}
	li.bind('dragstart', player_drag_start(player.sessionId));
	li.bind('dragend', player_drag_end);
	append_player_picture(li, player);
	li.append("<span>"+player.name+"</span>");
	return li;
}
var onImgLoad = function(ctx, img_buffer) { return function() {ctx.drawImage(img_buffer,0,0,50,50);}; };

function append_player_picture(parent, player) {
	if (player.url == undefined) {
		return;
	};

	var img = $("<img></img>").attr("src", player.url);
	parent.append(img);
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
	document.getElementById('options_game').className='hide';
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
	send_neu("get_game_participants", { "name": selected_game()});
}

function update_profile() {
	var name = document.getElementById('join_player').value;
	send_neu("update_profile", { "property" : "name", "value": name});
	localStorage.setItem("name", name);
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
	$('#start_game_button').removeClass('hide');
	switch_play_game();

}

/**
 * send "join game" form data via web socket server
 */
function join_game(){
	var name = document.getElementById('join_list_games').value;
	send_neu("join_game", {"name":name});
	// clear player list, will be updated from a server message later
	$('#game_list_players').html('');
	switch_play_game();
};

/**
 * initiator starts the game and switches to canvas view
 */
function start_game(){
	send_neu('start_game');
	$('#start_game_button').addClass('hide');
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

$(function() {
      	  
	  var target = $('#game_list_players');

	  target.bind('drop', function(event) {
	    var data = event.originalEvent.dataTransfer;
	    var player_id = ( data.getData('Text') );
	    var player = app.players[player_id];
	    if (player == undefined) {
	    	alert("Did not recognized the player.");
	    	return;
	    }
	    send_neu("invite", { "invited_id" : player_id, "game" : app.game.name} );
	    alert(player.name + " has been invited.");
	    return(false);
	  });
	 
	  target.bind('dragover', function(event) {    
	    if (event.preventDefault) event.preventDefault();
	    return false;
	  });

	   target.bind('dragenter', function(event) {
	     $(this).addClass('hover');
	     if (event.preventDefault) event.preventDefault();
	     return false;
	   });

	   target.bind('dragleave', function(event) {
	     $(this).removeClass('hover');
	     if (event.preventDefault) event.preventDefault();
	     return false;  
	  });
	   
		var dropZone = $('#picture_drop');
		dropZone.bind('dragenter', function(event) {
		    if (event.preventDefault) event.preventDefault();
		    $(this).addClass('hovering');
		    return false;
		  }, false);
		dropZone.bind('dragover', function(event) {
		    if (event.preventDefault) event.preventDefault(); // allows us to drop
		    return false;
		  }, false);
		dropZone.bind('dragleave', function(event) {
		    if (event.preventDefault) event.preventDefault(); // allows us to drop
		    $(this).removeClass('hovering');
		    return false;
		  }, false);
		dropZone.bind('drop', function(event) {
		    if (event.preventDefault) event.preventDefault();
		    var dataTransfer = event.originalEvent.dataTransfer;
		    var types = dataTransfer.types;
		    
		    for (var i = 0; i < types.length; i++) {
		      if (types[i] == 'text/uri-list') {
		    	  this.innerHTML = '';  
		        var imgPassed = dataTransfer.getData('text/uri-list');
		        append_player_picture($('#picture_drop'), { url: imgPassed});
		        send_neu("update_profile", { "property" : "url", "value": imgPassed});
		        localStorage.setItem("url", imgPassed);
		      }
		    }
		    return false;
		  }, false);
				


});
