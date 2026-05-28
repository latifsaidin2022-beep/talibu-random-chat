const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Otomatis menampilkan halaman utama saat diakses browser
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let waitingUsers = [];

io.on('connection', (socket) => {
    console.log('User terhubung dengan ID:', socket.id);

    socket.on('find_partner', () => {
        if (waitingUsers.length > 0) {
            let partnerSocket = waitingUsers.shift();
            let roomName = `room_${socket.id}_${partnerSocket.id}`;
            
            socket.join(roomName);
            partnerSocket.join(roomName);

            io.to(roomName).emit('chat_started', roomName);
            
            socket.partnerRoom = roomName;
            partnerSocket.partnerRoom = roomName;
        } else {
            waitingUsers.push(socket);
            socket.emit('waiting', 'Sedang mencari orang asing untukmu...');
        }
    });

    socket.on('send_message', (data) => {
        if (socket.partnerRoom) {
            socket.to(socket.partnerRoom).emit('receive_message', data);
        }
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(user => user.id !== socket.id);
        if (socket.partnerRoom) {
            io.to(socket.partnerRoom).emit('partner_disconnected');
        }
    });
});

// PENGATURAN PORT UNTUK RENDER & LOKAL KOMPUTER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server chat-random aktif di port ${PORT}`);
});