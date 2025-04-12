// const express = require("express");
// const http = require("http");
// const socketIo = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: { origin: "*" }
// });

// io.on("connection", socket => {
//   console.log("New client connected:", socket.id);

//   socket.on("signal", data => {
//     io.to(data.to).emit("signal", {
//       from: socket.id,
//       signal: data.signal
//     });
//   });

//   socket.on("join", () => {
//     socket.broadcast.emit("peer", socket.id);
//   });

//   socket.on("disconnect", () => {
//     io.emit("peer-disconnected", socket.id);
//   });
// });

// server.listen(3000, () => console.log("Signaling server on port 3000"));










const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }  // Allow all origins for now (you can restrict in production)
});

io.on("connection", socket => {
  console.log("New client connected:", socket.id);

  // When a peer signals a connection
  socket.on("signal", data => {
    console.log(`Signal received from ${socket.id} to ${data.to}`);
    io.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal
    });
  });

  // When a new peer joins the room
  socket.on("join", () => {
    console.log(`Peer ${socket.id} joined`);
    socket.broadcast.emit("peer", socket.id); // Broadcast peer to all other clients
  });

  // Notify others when this peer disconnects
  socket.on("disconnect", () => {
    console.log(`Peer ${socket.id} disconnected`);
    io.emit("peer-disconnected", socket.id); // Broadcast to all clients that this peer disconnected
  });
});

server.listen(3000, () => {
  console.log("Signaling server on port 3000");
});