const { io } = require("socket.io-client");
const socket = io("https://akpoker.onrender.com");
socket.on("connect", () => {
    console.log("Connected to Render!");
    socket.emit("seed_staff_data", (res) => {
        console.log("Seed response:", res);
        process.exit(0);
    });
});
