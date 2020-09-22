const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const Filter = require('bad-words');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');


// Function
const { generateMessage, generateLocationMessage } = require('./utils/messages');

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname , '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New Connection Created');

    socket.on('join', ({username, room}, callback) => {
        const{ error, user } = addUser({ id : socket.id, username, room});

        if(error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('welcome', generateMessage('SuperAdmin - Bryan Dev','Welcome!')) ;
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        });

        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback('Word can\'t be profane');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        const user =  getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://maps.google.com?q=${coords.lattitude},${coords.longitude}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message', generateMessage('SuperAdmin - Bryan Dev', `${user.username} has left the chat!`));
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            });
        }
    });

});


server.listen(port, () => {
    console.log(`Server run on port ${port}`)
});