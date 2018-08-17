'use strict';

$(document).ready(function(){

 
  var basicRoom = prompt("Please enter your name", "");
  var conRoom =basicRoom;
  var socket = io.connect();


  $('.cmdBtn').click(function(event) {
    if ($(this).val() == 'openCam') {
      createPeerConnection(false, config);
    }
    if ($(this).val() == 'closeCam') {
      peerConn.close();
    }
  	socket.emit('cmd', $(this).val());
  });

  socket.on('cmd', function(cmd) {
    if (cmd == 'openCam') {openCam();}
    if (cmd == 'closeCam') {closeCam();}
  });

  $('#getRoomsBtn').click(function(event) {
    socket.emit('getRooms');
  });

  $('#createRoomBtn').click(function(event) {
    socket.emit('createRoom');
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

  socket.on('createRoom', function() {
    alert('create room')
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

  function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
  }
  socket.on('message', function(message) {
    console.log('Client received message:', message);
    signalingMessageCallback(message);
  });
  // stun server
  var config = {
     'iceServers': [
       {
         'urls': 'turn:90.224.170.164:3478',
        'credential': 'turn',
        'username': 'turn'
       }, 
     ]
  };


  var localStream;
  var remoteStream;
  var remoteVideo = document.querySelector('#remoteVideo');
  var peerConn;




  function openCam() {
    createPeerConnection(true, config);
    grabWebCamVideo();
    console.log('add stream');
  }
  function closeCam() {
    peerConn.removeStream(localStream);
    peerConn.close();
  }

  function grabWebCamVideo() {
    console.log('Getting user media (video) ...');
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    })
    .then(gotStream)
    .catch(function(e) {
      alert('getUserMedia() error: ' + e.name);
    });
  }

  function gotStream(stream) {
    console.log('getUserMedia video stream URL:', stream);
    window.stream = stream; // stream available to console
    
    //localVideo.srcObject = stream;
    localStream = stream;
      peerConn.addStream(stream); 
      peerConn.createOffer(setLocalAndSendMessage, handleCreateOfferError);
  }

  /****************************************************************************
  * WebRTC peer connection and data channel
  ****************************************************************************/


  function signalingMessageCallback(message) {
    if (message.type === 'offer') {
      console.log('Got offer. Sending answer to peer.');
      peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                    logError);
      peerConn.createAnswer(onLocalSessionCreated, logError);

    } else if (message.type === 'answer') {
      console.log('Got answer.');
      peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                    logError);

    } else if (message.type === 'candidate') {
      peerConn.addIceCandidate(new RTCIceCandidate({
        candidate: message.candidate
      }));

    }
  }
  function logError(err) {
    if (!err) return;
    if (typeof err === 'string') {
      console.warn(err);
    } else {
      console.warn(err.toString(), err);
    }
  }
  function createPeerConnection(isInitiator, config) {
    console.log('Creating Peer connection as initiator?', isInitiator, 'config:',
                config);
    peerConn = new RTCPeerConnection(config);

    peerConn.onaddstream = handleRemoteStreamAdded;
    // send any ice candidates to the other peer
    peerConn.onicecandidate = function(event) {
      console.log('icecandidate event:', event);
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    };


  }

  function onLocalSessionCreated(desc) {
    console.log('local session created:', desc);
    peerConn.setLocalDescription(desc, function() {
      console.log('sending local desc:', peerConn.localDescription);
      sendMessage(peerConn.localDescription);
    }, logError);
  }





  function setLocalAndSendMessage(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    peerConn.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
  }

  function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
  }



  function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;

  }


}); //emd of jquery 