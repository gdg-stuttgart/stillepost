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