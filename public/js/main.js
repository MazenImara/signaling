'use strict';

$(document).ready(function(){

 
  var basicRoom = prompt("Please enter your name", "");
  var conRoom =basicRoom;
  var socket = io.connect();

  $('.cmdBtn').click(function(event) {
  	socket.emit('cmd', $(this).val());
  });

  socket.on('cmd', function(cmd) {
  	alert(cmd);
  });

  $('#getRoomsBtn').click(function(event) {
  	socket.emit('getRooms');
  });

  socket.on('getRooms', function(rooms) {
    console.log(rooms);
    var roomsDiv = $('#roomsDiv');
    $('.room').remove();
    Object.keys(rooms).forEach(function(key) {
      if (key != Object.keys(rooms[key]['sockets'])[0]) {
        roomsDiv.append('<br class="room"><button class="room leaveRoom" value="'+key+'">X</button><button class="room conRoom" value="'+key+'">'+key+'</button><span  class="room">: '+ Object.keys(rooms[key]['sockets'])[0] + '</span>');
      }
      
    })
  });

	socket.on('created', function(room, clientId) {
	  console.log('Created room', room, '- my client ID is', clientId);
	  
	});

	socket.on('joined', function(room, clientId) {
	  console.log('This peer has joined room', room, 'with client ID', clientId);
    
      conRoom = room;
	});

	socket.on('full', function(room) {
	  alert('Room ' + room + ' is full. We will create a new room for you.');
	  
	});  
	// Joining a room.
  socket.emit('create or join', basicRoom);


  socket.on('leaveRoom', function(room) {
    console.log(room + ' left');    
  });  

  $('body').on('click', '.conRoom', function(event) {
    event.preventDefault();    
    socket.emit('leaveRoom', conRoom);
    socket.emit('create or join', $(this).val());
  });
}); //emd of jquery 