const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const newInitBlock = `
  fdb.ref('/').once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.tournaments) db.tournaments = data.tournaments;
      if (data.members) db.members = data.members;
      if (data.time_logs) db.time_logs = data.time_logs;
    }
    
    // CƯỠNG CHẾ TẠO 20 NHÂN VIÊN
    db.staff = [];
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
    console.log('[FIREBASE] Cưỡng chế tạo 20 nhân viên mẫu.');
    fdb.ref('/staff').set(db.staff);
    
    isFirebaseLoaded = true;
    broadcastState();
    io.emit('staff_data_updated', db.staff);
    console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');
  });
`;

code = code.replace(/fdb\.ref\('\/'\)\.once\('value', \(snapshot\) => \{[\s\S]*?isFirebaseLoaded = true;\n    broadcastState\(\);\n  \}\);/, newInitBlock);

// Add request_initial_data listener
code = code.replace(
  /io\.on\('connection', \(socket\) => \{/,
  "io.on('connection', (socket) => {\n  socket.on('request_initial_data', () => {\n    if(isFirebaseLoaded) {\n      socket.emit('update_staff_list', db.staff);\n      socket.emit('staff_data_updated', db.staff);\n    }\n  });"
);

fs.writeFileSync('server/server.js', code);
