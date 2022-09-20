const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

let room;
const io = new Server();

// Middleware
io.use(async (socket, next) => { 
    try {
        socket.user = 'willson@gmail.com';
        next(); 
    } catch (error) {
        next(new Error('Unknown user'));
    }
})

// Socket connection 
io.on('connection', async (socket) => {
    console.log('Socket Token ---->', socket.handshake.auth);
    console.log('Socket Connect ---->', socket.id);

    // From middleware
    console.log('User ---->', socket.user);

    socket.emit('hello', { data: 'Hello Client!' }, (res) => console.log(res.msg))

    socket.on('hey', (data, cb) => {
        console.log(data);
        cb({ msg: 'Callback Message from Server!'})
    })

    socket.onAny((evt, ...args) => {
        console.log(`Event Listen: ${evt}, ${args.length}`);
    })

    const allSockets = await io.fetchSockets();
    console.log('All Socket Connections', allSockets.length);

    io.to(socket.id).emit('on_slcketid', { socket: socket.id })
    socket.broadcast.emit('broadcast-event', { msg: 'Broadcast Message'})
    socket.on('delay-event', (data => console.log(data)))

    //  Rooms
    socket.on('join-room', ({room}) => {
        room = room;
        socket.join(room)      
        console.log(`User joined: ${room}`);  
    })

    // to: except the sender, in: all clients in room
    socket.to(room).emit('room-event', { msg: `I am in the Room: ${room}`})

    // socket.to(['Room 2', 'Room 1']).emit('room-event', { msg: 'I am in both rooms'})

    socket.on("private message", ({roomId, msg}) => {
        console.log(`Got private message: ${msg}, in room: ${roomId}`);
        socket.to(roomId).emit("private message", { secret: '123' });
    }); 

    socket.on('leave-room', ({room}) => {
        socket.leave(room);
        console.log(`User left: ${room}`);  
    })

    // Join and Leave all sockets with Room 1
    io.socketsJoin("Room 1");
    io.socketsLeave("Room 1");

    // Disconnect all Socket Instances
    io.disconnectSockets();

    // Remove all Socket Listeners
    socket.removeAllListeners();

    // Disconnect socket
    socket.on("disconnect", (reason) => {
        console.log(`Socket ${socket.id} Disconnected`, reason);
    });

})

// Namespace 
io.of("/namespace").on("connection", mySocket => {
    mySocket.on('namespace_txt', data => console.log(data))
    mySocket.emit('namespace_msg', { msg: 'Message for my namespace'})
})

io.on("new_namespace", (namespace) => {
    console.log('New namespace created', namespace.name);
});

// Adapter
const adminAdapter = io.of("/admin").adapter;

adminAdapter.on("create-room", (room) => {
    console.log(`room ${room} was created with adapter`);
});

adminAdapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room} with adapter`);
});

adminAdapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has leaved room ${room} with adapter`);
});

adminAdapter.on("delete-room", (room) => {
    console.log(`room ${room} was deleted with adapter`);
});

// Socket Disconnect 
io.on('disconnect', (socket) => {
    console.log('Socket Diconnect', socket.id);
})

let server = app.listen(5000, () => console.log('Server running on port 5000'))

io.attach(server, {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    }
});

// io.close(); 