var games = new Array();

// setup socket
io.setPath('/js/');

function esc(msg){
    return msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

/**
 * parse incoming messages
 * 
 * @param obj
 */
function message(obj){
  console.log(obj);
  games = obj;
  var el = document.createElement('p');
  //if ('announcement' in obj) el.innerHTML = '<em>' + esc(obj.announcement) + '</em>';
  //else if ('message' in obj) el.innerHTML = '<b>' + esc(obj.message[0]) + ':</b> ' + esc(obj.message[1]);
  //document.getElementById('chat').appendChild(el);
  //document.getElementById('chat').scrollTop = 1000000;
  if('message' in obj) {
	  alert(obj.message[0]);
	  // add new player to player list
	  var li = document.createElement('li');
	  li.innerHTML = esc(obj.message[0]);
	  document.getElementById('init_list_players').appendChild(li);
  }
  //add all games to select list
  if(obj['type']=='games_list') {
	  for(key in obj['arguments']){
		  console.log('add game:' + key);
		  var option = document.createElement('option');
		  option.value=key;
		  option.text=key;
		  console.log(option);
		  document.getElementById('join_list_games').appendChild(option);
	  }
	  document.getElementById('join_list_games').childNodes[3].selected=true;
  }
}

// open socket
var socket = new io.Socket(null, {port: 8080});
var con = socket.connect();
// call message function when receiving new data through socket
socket.on('message', function(data){
	// check if data is not empty (string with 15 chars means no valid JSON string)
	console.log(data);
	if(data.length != 15){
	  var obj = JSON.parse(data);
	  if (obj.type == "draw") {
		  drawLine(obj.arguments[0], obj.arguments[1]);
	  } else {
		  message(obj);
	  }
	}
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

/**
 * show players of selected game
 * @param selectElement
 */
function join_display_players(selectElement){
	console.log('join_display_players');
	var key = selectElement.options[selectElement.selectedIndex].text;
	for(i = 0; i< document.getElementById('join_list_players').childNodes.length; i++){
		document.getElementById('join_list_players').removeChild(document.getElementById('join_list_players').childNodes[i]);
	}
	for(player in games[key].players){
		var li = document.createElement('li');
		li.innerHTML = player;
		document.getElementById('join_list_players').appendChild(li);
	}
}

/**
 * send "create game" form data via web socket to server
 */
function create_game(){
	alert('create game');
	var game = document.getElementById('init_new_game').value;
	var player = document.getElementById('init_player').value;
	var json = "{ \"type\": \"create_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	socket.send(json); // asynchronous call
	document.getElementById('init_new_game').disabled=true;
	document.getElementById('init_player').disabled=true;
	document.getElementById('init_register').disabled=true;
	var li = document.createElement('li');
	li.innerHTML = player;
	document.getElementById('init_list_players').removeChild(document.getElementById('init_list_players').childNodes[1]);
	document.getElementById('init_list_players').appendChild(li);
}

/**
 * send "join game" form data via web socket server
 */
function join_game(){
	var game = document.getElementById('join_list_games').value;
	var player = document.getElementById('join_player').value;
	var json = "{ \"type\": \"join_game\", \"arguments\": { \"game\": \""+game+"\", \"player\": \""+player+"\" } }";
	alert(json);
	socket.send(json);
}