var socket = new io.Socket(null, {port: 8080});
      socket.connect();
      socket.on('message', function(data){
        var obj = JSON.parse(data);

        if ('buffer' in obj){
        	// @todo: disable form
        	for (var i in obj.buffer) message(obj.buffer[i]);
        } else message(obj);
      });    

function create_game(){
	var game = document.getElementById('game').value;
	var player = document.getElementById('player').value;
	var json = "{ \"type\": \"create_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	alert(json);
	socket.send(json);
}

function join_game(){
	var game = document.getElementById('game').value;
	var player = document.getElementById('player').value;
	var json = "{ \"type\": \"join_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	alert(json);
	socket.send(json);
}