const { io } = require("socket.io-client");

const socket = io("https://akpoker.onrender.com", {
  reconnection: false,
  timeout: 5000
});

socket.on("connect", () => {
  socket.emit("request_initial_data");
});

socket.on("update_staff_list", (staff) => {
  console.log("Count:", staff.length);
  console.log("Staff:", staff);
  process.exit(0);
});
