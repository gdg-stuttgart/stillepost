var http = require('http'), 
		url = require('url'),
		fs = require('fs'),
		io = require('./index'),
		sys = require('sys'),
		
send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
},
		
server = http.createServer(function(req, res){
	// your normal server code
	var path = url.parse(req.url).pathname;
	switch (path){
		case '/':
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('<h1>Welcome. Try the <a href="/client/index.html">stillepost</a> example.</h1>');
			res.end();
			break;
			
		default:
			var contentType;
			var encoding;
			if (/\.(swf)$/.test(path)){
				contentType = 'application/x-shockwave-flash';
				encoding = 'binary';
			} else 
			if (/\.(html)$/.test(path)){
				contentType = 'text/html';
				encoding = 'utf8';
			} else
			if (/\.(js)$/.test(path)){
				contentType = 'text/javascript';
				encoding = 'utf8';
			} else
			if (/\.(png)$/.test(path)){
				contentType = 'image/png';
				encoding = 'binary';
			} else
			if (/\.(jpg)$/.test(path)){
				contentType = 'image/jpg';
				encoding = 'binary';
			} else
			if (/\.(css)$/.test(path)){
				contentType = 'text/css';
				encoding = 'utf8';
			}
			if (/\.(eot)$/.test(path)){
				contentType = 'application/vnd.ms-fontobject';
				encoding = 'binary';
			}
			if (/\.(ttf)$/.test(path)){
				contentType = 'font/ttf';
				encoding = 'binary';
			}
			if (/\.(woff)$/.test(path)){
				contentType = 'application/x-woff';
				encoding = 'binary';
			}
			if(contentType != null && encoding != null) {
				try {
					res.writeHead(200, {'Content-Type':contentType});
					res.write(fs.readFileSync(__dirname + path,  encoding ), encoding);
					res.end();
				} catch(e){ 
					send404(res); 
				}
			} else {
				send404(res);
			}
		
			send404(res);
			break;
	}
});

if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		var F = function() {};
		F.prototype = o;
		return new F();
	};
};

function create_json(type, property, data) {
	 var o = new Object();
	 o.type = type;
	 o.property = property;
	 o.value = data;
	 return JSON.stringify(o);
};

server.listen(6060);
// changes of the application state are pushed to all clients
// changes belonging to a running game are only pushed to participants,
//  i.e. changes of the game object as well as draw-events
var player_prototyp = {
	name: 'anonymous',
	url: 'img/default_player.jpg',
	sessionId: 'TBD', // mandatoryâ
	send: function(type, property, data) {
	    var message = create_json(type, property, data);
	    for (clientIdx in io.clients) {
	    	var client = io.clients[clientIdx];
	    	if (client != null && client.sessionId == this.sessionId) {
	    		console.log("Sending to "+this.sessionId+ ": " + message);
	    		client.send(message);
	    	}
	    }
    },
    to_s: function() {
    	return this.name + " (sessionId="+this.sessionId+")";
    },
    client_info: function() {
    	var result = new Object();
    	result.name = this.name;
    	result.sessionId = this.sessionId;
    	result.url = this.url;
    	return result;
    }
};

var game_prototyp = {
	name: "mandatory",
    state: 'OPEN', // one of "OPEN", "RUNNING", "FINISHED"
	current: undefined, // session ID of current player	
	pass_on: function() {
	
    },
	owner: function() {
    	return players[0];
    },
    players: null, // array of session ID's of current players, passing uses the order given here
	send: function(type, property, data) {
    	console.log("Sending to "+this.players.length+" participants of " + this.name + " ...");
    	var i;
    	for(i=0; i< this.players.length; i++) {
    		app.players[this.players[i]].send(type, property, data);
    	}
    },
    to_s: function() {
    	return this.name + " (" + this.state + "/current=" + this.current+")";
    },
    client_info: function() {
    	var result = new Object();
    	result.name = this.name;
    	result.players = this.players;
    	result.state = this.state;
    	result.draw_history = [];
    	return result;
    },
    start: function() {
    	this.state = "RUNNING";
    	this.current = this.players[0];
    },
    pass_on: function() {
    	var idx = this.players.indexOf(this.current) + 1;
    	this.current = this.players[idx];
    	if (this.current === undefined) {
    		this.state= "FINISHED";
    	}
    },
    remove_player: function(player) {
    	if (player.session_id == this.current) {
    		this.pass_on();
    	}
    	var idx = this.players.indexOf(player.sessionId);
    	if (idx != -1) {
    		this.players.splice(idx,1);
    		this.send("UPDATE", [ "game", "players" ], this.players);
    		if (this.players.length == 0) {
    			app.delete_game(this);
    		}
    	}
    }
};

var app = {
	players: new Object(), // sessionID => Player
	games: new Object(), // name => Game
	game_labels:  [],  // in sync with games, this one holds the names and keeps the order
	 
	create_player: function(sessionId) {
		var new_player = Object.create(player_prototyp);
		new_player.sessionId = sessionId;
		this.players[sessionId] = new_player;
		return new_player;
	},

    create_game: function(sessionId, name) {
		var new_game = Object.create(game_prototyp);
		new_game.name = name;
		new_game.players = [];
		new_game.players.push(sessionId);
		this.games[name] = new_game;
		this.game_labels.push(name);
		return new_game;
	},
	
    delete_game: function(game) {
		delete this.games[game.name];
		var idx = this.game_labels.indexOf(game.name);
		this.game_labels.splice(idx,1);
		this.send("UPDATE", ["games_list"], this.game_labels);
	},
	
	current_game: function(sessionId) {
		for (var game_name in this.games) {
			var game = this.games[game_name];
			if (game.players.indexOf(sessionId) !== -1) {
				return game; 
			}
		}
		return null;
	},
	
	send: function(type, property, data) {
    	var message = create_json(type, property, data);
    	console.log("Sending to all: " + message);
   		io.broadcast(message);
    },
    
    client_players: function() {
    	var result = new Object();
    	for (playerId in this.players) {
    		result[playerId] = this.players[playerId].client_info();
    	}
    	return result;
    },
    
	clean_player: function(player) {
    	// remove all games where player participates
    	var current_game = this.current_game(player.sessionId);
    	while (current_game !== null) {
    		console.log("Cleaning up player's "+player.sessionId+" games: " + current_game.name);
    		this.delete_game(current_game);
    		current_game = this.current_game(player.sessionId);
    	}
    },
    
    remove_player: function(player) {
    	for (var game_name in this.games) {
    		this.games[game_name].remove_player(player);
    	}
    }
};

var to_array = function(o) {
	var result = [];
	for ( p in o) {
		result.push(o[p]);
	}
	return result;
};

// client model

// Player object:
// player.name
// player.url

// Game object:
// game.current, id of current player
// game.players, array of player ids
// game.draw_history, player id => []

// Application object:
// app.me = Player object
// app.players,  id => Player object
// app.game_list = [] // labels of games, the labels must be unique, i.e. they are used as ID
// app.game = Game Object

// server sends model updates to the client, e.g.

//Add new player (app.players["123"] does not exist):

// Add new player (app.players["123"] does not exist):
// { type: "UPDATE", property: [ "players", "123" ], value: { name: "newname", url: "http"} } 

// Update:
// { type: "UPDATE", property: ["players", "123", "name"], value: "updatedname" } 

// Delete (no value given):
// { type: "DELETE", property: [ "game_list", 0 ] }
// note: implementation can use delete on objects but should use splice(x,1) on arrays

// Add to draw history of current game
// { type: "PUSH", property: [ "game", "draw_history", "<sessionID>" ], value: {} }

// example communication, two player game
// client 1 connects
// server -> client1
// { type: "UPDATE", property: [ "game_list" ], value: [] } 

// client1 updates profile
// server -> all
// { type: "UPDATE", property: [ "players", "<sessionId>", "name" ], value: [ "itsme" ] } 


// client2 connects

// client1 creates a new game
// client1 -> server "create_game", payload: { game => "myGame" }
// server -> client1
// { type: "UPDATE", property: [ "game" ], value: { name: "myGame", players: [<sessionId>], state: "OPEN" } } 
// server -> client1, client2 (alle clients)
// { type: "ADD", property: [ "game_list" ], value: "myGame" } 

// client2 joins game
// server -> client2 (all participants of the game)
// { type: "UPDATE", property: [ "game" ], value: { name: "myGame", players: [<sessionId>], state: "OPEN" } } 
// server -> client1, client2 (all participants of the game)
// { type: "ADD", property: [ "game", "players" ], value: <sessionId> }

// client1 starts game
// server -> client1, client2 (all participants of the game) 
// { type: "UPDATE", property: [ "game", "state" ], value: { state: "RUNNING" } } 
// { type: "UPDATE", property: [ "game", "current" ], value: <sessionId> } } 

var ta= ["5"];
var	io = io.listen(server);
		
io.on('connection', function(client) {
	client.player = app.create_player(client.sessionId);
	app.send("UPDATE", ["players"], app.client_players());
	client.player.send("UPDATE", ["sessionId"], client.sessionId);
	client.player.send("UPDATE", ["games_list"], app.game_labels);

	client.on('message', function(message) {
		console.log("Dispatching: " + message);
		var msg = JSON.parse(message)
		var arguments = msg.arguments;
		if (msg.type == "draw") {
			draw_line(arguments)
		} else if (msg.type == "create_game") {
			create_game(arguments);
		} else if (msg.type == "join_game") {
			join_game(arguments);
		} else if (msg.type == "start_game") {
			start_game(arguments);
		} else if (msg.type == "pass_on") {
			pass_on(arguments);
		} else if (msg.type == "update_profile") {
			update_profile(arguments);
		} else if (msg.type == "get_game_participants") {
			get_game_participants(arguments);
		}
	});

	client.on('disconnect', function() {
		console.log("Player " + client.player.to_s() + " disconnected");
		app.remove_player(client.player);
	});
	
	function create_game(data) {
		// guard 
		if (data === undefined || data.name === undefined) {
			console.log("Invalid data for creating game");
			return;
		}
		app.clean_player(client.player);
		console.log("Player " + client.player.to_s() + " creates game " + data.name);
		var game = app.create_game(client.sessionId, data.name);
		console.log("players: " + game.players.join(","));
		client.player.send("UPDATE", ["game"], game.client_info());
		app.send("UPDATE", ["games_list"], app.game_labels);
	}
	
	function update_profile(data) {
		// guard 
		if (data === undefined || data.property === undefined) {
			console.log("Invalid data for updating profile game");
			return;
		}
		var player = client.player;
		console.log("Player " + player.to_s() + " updates property " + data.property);
		player[data.property] = data.value;
		console.log("Player is now " + player.to_s());
		app.send("UPDATE", ["players", client.sessionId, data.property], player[data.property]);
	}

	function join_game(data) {
		// guard 
		if (data === undefined || data.name === undefined) {
			console.log("Invalid data for joining game");
			return;
		}
		var game = app.games[data.name];
		if (game == undefined) {
			console.log("Trying to join invalid game");
			return;			
		}
		var player = client.player;
		app.clean_player(player);
		console.log("Player " + player.name + " joins game " + game.name);
		player.send("UPDATE", ["game"], game.client_info());
		game.players.push(player.sessionId);
		game.send("UPDATE", ["game", "players"], game.players);
	}
	
	function start_game(data) {
		var player = client.player;
		var game = app.current_game(player.sessionId);
		if (game == null) {
			console.log("Player "+ player.to_s() + " does not own a game to start");
			return;
		}
		console.log("Player " + player.to_s() + " has started game " + game.name);
		game.start();
		game.send("UPDATE", ["game", "state"], game.state);
		game.send("UPDATE", ["game", "current"], game.current);
	}
	
	function pass_on(data) {
		var player = client.player;
		var game = app.current_game(player.sessionId);
		if (game == null) {
			console.log("Player "+ player.to_s() + " does not own a game to start");
			return;
		}
		game.pass_on();
		game.send("UPDATE", ["game", "current"], game.current);
		if (game.state == "FINISHED") {
			console.log("Game over for " + game.to_s());
			game.send("UPDATE", ["game", "state"], game.state);
			app.delete_game(game);	
		}	
	}

	function draw_line(data) {
		var player = client.player;
		var game = app.current_game(player.sessionId);
		if (game == undefined) {
			console.log("Error: can not broadcasting draw line event of player "+ player.to_s());
			return;
		}
		console.log("Broadcasting draw line event of " + player.to_s() + ": " + JSON.stringify(data));
		game.send("ADD", ["game", "draw_history", player.sessionId], data);
	}
	
	function get_game_participants(data) {
		// a client has requested the list of participants of a a game in order to show it in the 
		// init_players list
		var player = client.player;
		if (data.name === undefined) {
			return;
		}
		var game = app.games[data.name];
		if (game === undefined) {
			console.log("get_game_participants: "+ data.name + " not found");
			return;
		}
		player.send("UPDATE", [ "games" , game.name], game.players);
	}
});


function serialize(key, value) {
	var data = new Object();
	data.type = key;
	data.arguments = value;
	return JSON.stringify(data);
}