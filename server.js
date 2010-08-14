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
		
io.on('connection', function(client){
	client.send(client.broadcast(serialize("games_list", games)));
	client.broadcast(JSON.stringify({ announcement: client.sessionId + ' connected' }));

	client.on('message', function(message) {
		var msg = JSON.parse(message)
		//TODO: Use reflections
		if (msg.type == "draw") {
			draw_line(msg.arguments)
		} else if (msg.type == "create_game") {
			create_game(msg.arguments);
		} else if (msg.type == "join_game") {
			join_game(msg.arguments);
		}
	});

	client.on('disconnect', function(){
		client.broadcast(JSON.stringify({ announcement: client.sessionId + ' disconnected' }));
	});
	
	function create_game(data) {
		games[data.game] = new Object();
		games[data.game].players = new Object();
		games[data.game].players[data.player] = function() {
			rank: 0;
			picture: [];
		};
		client.broadcast(serialize("game", games[data.game]));
	}

	function join_game(data) {
		games[data.game].players[data.player] = function() {
			rank: 0;
			picture: [];
		};
		games[data.game].players[data.player].rank = games[data.name].players.size();
		client.broadcast(serialize("game", games[data.game]));
	}

	function draw_line(data) {
		games[data.game].players[data.player].picture.push(msg.arguments.line);
		client.broadcast(serialize("draw", msg.arguments));
	}
});

function serialize(key, value) {
	var data = new Object();
	data.type = key;
	data.arguments = value;
	return JSON.stringify(data);
}
