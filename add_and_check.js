const { io } = require("socket.io-client");

const socket = io("https://akpoker.onrender.com", {
  reconnection: false,
  timeout: 5000
});

socket.on("connect", () => {
  console.log("Connected! Adding bot...");
  socket.emit("add_staff", {
    id: "NV_BOT_2026",
    name: "ROBOT KIỂM TRA",
    pin: "9999",
    role: "TD",
    base_salary: 100000
  }, (res) => {
    console.log("Added bot:", res);
    socket.emit("request_initial_data");
  });
});

let checked = false;
socket.on("update_staff_list", (staff) => {
  if (checked) return;
  if (!staff.find(s => s.id === 'NV_BOT_2026')) return;
  checked = true;
  console.log("Verified bot is in RAM!");
  process.exit(0);
});
