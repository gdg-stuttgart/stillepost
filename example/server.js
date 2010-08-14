var http = require('http'), 
		url = require('url'),
		fs = require('fs'),
		io = require('../'),
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
			res.write('<h1>Welcome. Try the <a href="/chat.html">chat</a> example.</h1>');
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

server.listen(8080);
		
// socket.io, I choose you
// simplest chat application evar
var buffer = [], 
		json = JSON.stringify,
		io = io.listen(server);
		
io.on('connection', function(client){
	client.send(json({ buffer: buffer }));
	client.broadcast(json({ announcement: client.sessionId + ' connected' }));

	client.on('message', function(message){
		var msg = { message: [client.sessionId, message] };
		buffer.push(msg);
		if (buffer.length > 15) buffer.shift();
		client.broadcast(json(msg));
	});

	client.on('disconnect', function(){
		client.broadcast(json({ announcement: client.sessionId + ' disconnected' }));
	});
});
