const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// Add resign_staff event
const resignStaffCode = `
  socket.on('resign_staff', (staffId, callback) => {
    const s = db.staff.find(s => s.id === staffId);
    if (!s) {
      if(callback) callback({ success: false, message: 'Không tìm thấy nhân sự!' });
      return;
    }
    s.work_status = 'RESIGNED';
    if(s.status !== 'offline') {
        const now = Date.now();
        if (s.last_in) {
          const diffMins = Math.floor((now - s.last_in) / 60000);
          s.total_minutes += diffMins;
        }
        s.status = 'offline';
        s.last_in = null;
        db.time_logs.push({ staff_id: s.id, name: s.name, type: 'OUT', time: now });
    }
    stateChanged = true;
    broadcastState();
    if(callback) callback({ success: true, message: 'Đã cập nhật trạng thái Thôi Việc!' });
  });
`;

code = code.replace(/socket\.on\('clock_in'/, resignStaffCode + "\n  socket.on('clock_in'");

// Add block in clock_in / clock_out
code = code.replace(/const s = db\.staff\.find\(s => s\.id === staff_id\);\n    if \(!s\)/g, `const s = db.staff.find(s => s.id === staff_id);\n    if(s && s.work_status === 'RESIGNED') { if(callback) callback({success: false, message: 'Tài khoản đã bị khóa do thôi việc. Không thể chấm công!'}); return; }\n    if (!s)`);

fs.writeFileSync('server/server.js', code);
