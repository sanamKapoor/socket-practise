import React from 'react';
import { io, Manager } from 'socket.io-client';

let socket = io('ws://localhost:5000', {
  transports: ["websocket"],
  auth: {
    token: 'token'
  },
  withCredentials: true
});

const manager = new Manager('ws://localhost:5000');

// socket = manager.socket('/');
const nameSpaceSocket = manager.socket('/namespace');

socket.emit('hey', { data: 'Hello Server!'}, (res) => console.log(res.msg));
socket.once('hello', (data, cb) => {
  console.log(data)
  cb({ msg: 'Callback Message from Client!' })
});
socket.timeout(5000).emit('delay-event', 'Event occure after delay...')
socket.on('broadcast-event', data => console.log(data))
socket.on('on_slcketid', data => console.log(data))

// Room
socket.emit('join-room', { room: 'Room 1'});
socket.on('room-event', data => console.log(data))
socket.emit("private message", { roomId: 'Room 1', msg: 'Private Message from Client'});
socket.on("private message", data => console.log(`Got private message from server: ${data.secret}`))
socket.emit('leave-room', { room: 'Room 1'});

// Namespace
nameSpaceSocket.on('namespace_msg', data => console.log(data))
nameSpaceSocket.emit('namespace_txt', { msg: 'Message for namespace'})

function App() {

  return (
    <div>
      Hello
    </div>
  );
}

export default App;
