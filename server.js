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
			if (/\.(css)$/.test(path)){
				contentType = 'text/css';
				encoding = 'utf8';
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

Object.prototype.size = function () {
  var len = this.length ? --this.length : -1;
    for (var k in this)
      len++;
  return len;
}

server.listen(8080);
		
// socket.io, I choose you
// simplest chat application evar
var games = new Object(),
		io = io.listen(server);
		
io.on('connection', function(client) {
	client.send(serialize("games_list", games));
//	client.broadcast(JSON.stringify({ announcement: client.sessionId + ' connected' }));

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
		}
	});

	client.on('disconnect', function() {
//		client.broadcast(JSON.stringify({ announcement: client.sessionId + ' disconnected' }));
	});
	
	function create_game(data) {
		if (data.game.length > 0 && data.player.length > 0) {
			console.log("Creating game: " + data.game);
			games[data.game] = new Object();
			games[data.game].started = false;
			games[data.game].ready_players = [];
			games[data.game].players = new Object();
			games[data.game].players[data.player] = create_player(data.game);
			client.broadcast(serialize("game", game(data.game)));
		}
	}

	function join_game(data) {
		if (data.game.length > 0 && data.player.length > 0) {
			if (!games[data.game].started) {
				games[data.game].players[data.player] = create_player(data.game);
				client.broadcast(serialize("game", game(data.game)));
			}
		}
	}
	
	function start_game(data) {
		if (games[data].players.size() > 1) {
			games[data].started = true;
			client.broadcast(serialize("game_started", data));
		}
	}
	
	function pass_on(data) {
		games[data.game].ready_players.push(data.player);
		client.broadcast(serialize("ready_player", data.player));
	}

	function draw_line(data) {
		console.log("Broadcasting drawing of: " + data.player + JSON.stringify(data.line));
		client.broadcast(serialize("draw", data));
	}
});

function create_player(game) {
	var player = new Object();
	player.rank = games[game].players.size();
	player.picture = [];
	return player;
}

function serialize(key, value) {
	var data = new Object();
	data.type = key;
	data.arguments = value;
	return JSON.stringify(data);
}

function game(key) {
	var data = new Object();
	data[key] = games[key];
	return data;
}
