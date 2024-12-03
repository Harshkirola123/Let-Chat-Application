const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept json data

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);
console.log(process.env.MONGO_URI);
const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

// io.on("connection", (socket) => {
//   console.log("Connected to socket.io");
//   socket.on("setup", (userData) => {
//     socket.join(userData._id);
//     socket.emit("connected");
//   });

//   socket.on("join chat", (room) => {
//     socket.join(room);
//     console.log("User Joined Room: " + room);
//   });
//   socket.on("typing", (room) => socket.in(room).emit("typing"));
//   socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

//   socket.on("new message", (newMessageRecieved) => {
//     var chat = newMessageRecieved.chat;

//     if (!chat.users) return console.log("chat.users not defined");

//     chat.users.forEach((user) => {
//       if (user._id == newMessageRecieved.sender._id) return;

//       socket.in(user._id).emit("message recieved", newMessageRecieved);
//     });
//   });

//   socket.off("setup", () => {
//     console.log("USER DISCONNECTED");
//     socket.leave(userData._id);
//   });
// });

const activeUsers = new Map(); // To track active users and their socket IDs

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    // Check if the user is already active
    console.log(userData._id);
    if (activeUsers.has(userData._id)) {
      const existingSocketId = activeUsers.get(userData._id);
      // Disconnect the previous socket
      io.to(existingSocketId).emit(
        "forced logout",
        "Logged in from another device"
      );
      io.sockets.sockets.get(existingSocketId)?.disconnect(true);
    }

    // Add the user to active users map
    activeUsers.set(userData._id, socket.id);
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("disconnect", () => {
    // Remove the user from active users map
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
