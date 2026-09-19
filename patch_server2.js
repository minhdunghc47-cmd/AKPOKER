const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const updateStaffCode = `
  socket.on('update_staff', (payload, callback) => {
    const { id, name, pin, role, base_salary } = payload;
    const staffIndex = db.staff.findIndex(s => s.id === id);
    if (staffIndex === -1) {
      if (callback) callback({ success: false, message: 'Không tìm thấy nhân viên!' });
      return;
    }
    db.staff[staffIndex].name = name;
    if(pin) db.staff[staffIndex].pin = pin;
    db.staff[staffIndex].role = role;
    db.staff[staffIndex].base_salary = Number(base_salary) || 50000;
    
    stateChanged = true;
    broadcastState();
    if (callback) callback({ success: true, message: 'Cập nhật nhân sự thành công!' });
  });
`;

code = code.replace(/socket\.on\('clock_in'/, updateStaffCode + "\n  socket.on('clock_in'");
fs.writeFileSync('server/server.js', code);
