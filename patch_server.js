const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// Replace initialization block
const initBlockRegex = /\/\/ 2\. ĐỒNG BỘ TỪ FIREBASE XUỐNG RAM KHI KHỞI ĐỘNG[\s\S]*?(?=\/\/ 3\. LƯU TRỮ)/;
const newInitBlock = `// 2. ĐỒNG BỘ TỪ FIREBASE XUỐNG RAM KHI KHỞI ĐỘNG
if (fdb) {
  fdb.ref('/').once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.tournaments) db.tournaments = data.tournaments;
      if (data.members) db.members = data.members;
      if (data.staff) db.staff = data.staff;
      if (data.time_logs) db.time_logs = data.time_logs;
      
      console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');
    }
  });
} else {
  console.log('[LOCAL] Chạy với Database RAM giả lập.');
  for (let i = 1; i <= 20; i++) {
    db.members.push({ phone: '090' + String(i).padStart(7, '0'), name: 'Khách ' + i, dob: '01/01/1990', address: 'HN', bank_account: '123', bank_name: 'MB', play_history: [], total_tours: 0 });
  }
}
`;
code = code.replace(initBlockRegex, newInitBlock);

// Replace default db
code = code.replace(/staff: \[[\s\S]*?\],/, "staff: [], time_logs: [],");

// Add Socket events
const socketStaffEvents = `
  socket.on('seed_staff_data', (callback) => {
    db.staff = [];
    db.time_logs = [];
    const roles = ['Dealer', 'Floor', 'Thu ngân', 'Phục vụ', 'TD'];
    for (let i = 1; i <= 20; i++) {
      db.staff.push({
        id: 'NV' + String(i).padStart(2, '0'),
        name: 'Nhân viên ' + i,
        pin: '1234',
        role: roles[i % roles.length],
        base_salary: 50000,
        status: 'offline',
        total_minutes: 0,
        last_in: null
      });
    }
    stateChanged = true;
    broadcastState();
    if (callback) callback({ success: true, message: 'Đã seed 20 nhân viên thành công!' });
  });

  socket.on('add_staff', (payload, callback) => {
    const { id, name, pin, role, base_salary } = payload;
    if (db.staff.find(s => s.id === id)) {
      if (callback) callback({ success: false, message: 'Mã nhân viên đã tồn tại!' });
      return;
    }
    db.staff.push({
      id, name, pin, role,
      base_salary: Number(base_salary) || 50000,
      status: 'offline',
      total_minutes: 0,
      last_in: null
    });
    stateChanged = true;
    broadcastState();
    if (callback) callback({ success: true, message: 'Bổ nhiệm nhân sự thành công!' });
  });

  socket.on('clock_in', (payload, callback) => {
    const { staff_id, pin } = payload;
    const s = db.staff.find(s => s.id === staff_id);
    if (!s) { if(callback) callback({success: false, message: 'Không tìm thấy nhân sự!'}); return; }
    if (s.pin !== pin) { if(callback) callback({success: false, message: 'Mã PIN sai!'}); return; }
    if (s.status !== 'offline') { if(callback) callback({success: false, message: 'Đã check-in rồi!'}); return; }
    
    s.status = 'waiting';
    s.last_in = Date.now();
    db.time_logs.push({ staff_id, name: s.name, type: 'IN', time: s.last_in });
    
    stateChanged = true;
    broadcastState();
    if (callback) callback({ success: true, message: 'Check-IN thành công!' });
  });

  socket.on('clock_out', (payload, callback) => {
    const { staff_id, pin } = payload;
    const s = db.staff.find(s => s.id === staff_id);
    if (!s) { if(callback) callback({success: false, message: 'Không tìm thấy nhân sự!'}); return; }
    if (s.pin !== pin) { if(callback) callback({success: false, message: 'Mã PIN sai!'}); return; }
    if (s.status === 'offline') { if(callback) callback({success: false, message: 'Đang offline!'}); return; }
    
    const now = Date.now();
    if (s.last_in) {
      const diffMins = Math.floor((now - s.last_in) / 60000);
      s.total_minutes += diffMins;
    }
    s.status = 'offline';
    s.last_in = null;
    db.time_logs.push({ staff_id, name: s.name, type: 'OUT', time: now });
    
    stateChanged = true;
    broadcastState();
    if (callback) callback({ success: true, message: 'Check-OUT thành công!' });
  });
`;

code = code.replace(/socket\.on\('staff_checkin'[\s\S]*?\}\);/, socketStaffEvents);

// Make sure saveToFirebase saves staff and time_logs
code = code.replace(/fdb\.ref\('\/members'\)\.set\(db\.members\);/, `fdb.ref('/members').set(db.members);\n    fdb.ref('/staff').set(db.staff);\n    fdb.ref('/time_logs').set(db.time_logs);`);


fs.writeFileSync('server/server.js', code);
