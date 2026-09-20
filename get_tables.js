const { io } = require("socket.io-client");

const socket = io("https://akpoker.onrender.com", {
  reconnection: false,
  timeout: 5000
});

socket.on("connect", () => {
  socket.emit("request_initial_data");
});

socket.on("update_tables", (tables) => {
  console.log("Tables:");
  console.log(JSON.stringify(tables, null, 2));
  process.exit(0);
});
