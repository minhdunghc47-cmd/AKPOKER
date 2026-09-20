const { io } = require("socket.io-client");

const socket = io("https://akpoker.onrender.com", {
  reconnection: true,
  timeout: 5000
});

socket.on("connect", () => {
  console.log("Connected! Requesting data...");
  socket.emit("request_initial_data");
});

let checked = false;
socket.on("update_staff_list", (staff) => {
  if (checked) return;
  checked = true;
  console.log("Received staff list from Render. Count:", staff.length);
  const names = staff.map(s => s.name).join(", ");
  console.log("Staff names:", names);
  
  if (staff.find(s => s.id === 'TEST_BOT_99')) {
    console.log("SUCCESS! TEST_BOT_99 survived the reboot!");
  } else {
    console.log("FAIL! TEST_BOT_99 was lost!");
  }
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.log("Server still deploying...");
});
