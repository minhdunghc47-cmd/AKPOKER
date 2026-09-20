const { io } = require("socket.io-client");

const socket = io("https://akpoker.onrender.com", {
  reconnection: false,
  timeout: 5000
});

socket.on("connect", () => {
  console.log("Connected to Render server!");
  socket.emit("request_initial_data");
});

socket.on("update_staff_list", (staff) => {
  console.log("Received staff list from Render. Count:", staff.length);
  const names = staff.map(s => s.name).join(", ");
  console.log("Staff names:", names);
  
  if (!staff.find(s => s.id === 'TEST_BOT_99')) {
    console.log("Adding TEST_BOT_99...");
    socket.emit("add_staff", {
      id: "TEST_BOT_99",
      name: "ROBOT KIỂM TRA",
      pin: "0000",
      role: "TD",
      base_salary: 100000
    }, (res) => {
      console.log("Add staff result:", res);
      process.exit(0);
    });
  } else {
    console.log("TEST_BOT_99 already exists!");
    process.exit(0);
  }
});

socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
  process.exit(1);
});
