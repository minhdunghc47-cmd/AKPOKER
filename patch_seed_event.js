const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const oldSeedRegex = /socket\.on\('seed_staff_data', \(callback\) => \{[\s\S]*?\}\);/;
const newSeedBlock = `  socket.on('seed_staff_data', (callback) => {
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
        work_status: 'ACTIVE',
        total_minutes: 0,
        last_in: null,
        dob: "",
        cccd: "",
        cccd_date: "",
        address: "",
        photo: ""
      });
    }
    
    if (fdb && isFirebaseLoaded) {
      fdb.ref('/staff').set(db.staff);
    }
    
    stateChanged = true;
    broadcastState();
    
    // Explicitly emit what the user requested
    io.emit('staff_data_updated', db.staff);
    
    if (callback) callback({ success: true, message: 'Đã seed 20 nhân viên chuẩn form mới!' });
  });`;

code = code.replace(oldSeedRegex, newSeedBlock);
fs.writeFileSync('server/server.js', code);
