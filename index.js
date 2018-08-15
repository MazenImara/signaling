'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var socketIO = require('socket.io');
var middleware = require('socketio-wildcard')();

// https 

var https = require('https');
var fs = require("fs");
var options = {
  key: fs.readFileSync('/home/jony/myssl/key.pem'),
  cert: fs.readFileSync('/home/jony/myssl/cert.pem')
};
//end https

var fileServer = new nodeStatic.Server('./public');
var app = https.createServer(options,function(req, res) {
  fileServer.serve(req, res);
}).listen(8888);


var io = socketIO.listen(app);
io.use(middleware);
io.sockets.on('connection', function(socket) {

  var room;
  socket.on('*', function() {
    Object.keys(socket.rooms).forEach(function(key) {
      if (key != socket.id) {
        room = key;
      }      
    })
  });      
  // cmd
  socket.on('cmd', function(cmd) {
    socket.to(room).emit('cmd',cmd);
    console.log('cmd is: ' + cmd + 'room: ' + room);
  });

  // get list of ids
  socket.on('getRooms', function() {
    socket.emit('getRooms', socket.adapter.rooms);
  });

  // 
  socket.on('create or join', function(room) {

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

    if (numClients === 0) {
      socket.join(room);
      socket.emit('created', room, socket.id);
    } else if (numClients === 1) {
      // io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready', room);
      socket.broadcast.emit('ready', room);
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('leaveRoom', function(room) {
    socket.leave(room);
    socket.emit('leaveRoom', room);
  });


});// end of io socket
