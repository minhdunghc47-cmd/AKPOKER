const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const regex = /function checkAndSeedData\(\) \{[\s\S]*?checkAndSeedData\(\);\n\} else \{/;

const cleanLogic = `function loadFromFirebase() {
    fdb.ref('/').once('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.tournaments) db.tournaments = data.tournaments;
        if (data.members) db.members = data.members;
        if (data.time_logs) db.time_logs = data.time_logs;
        if (data.staff) db.staff = data.staff;
        console.log('[FIREBASE] Đã nạp dữ liệu từ Cloud thành công (READ-ONLY).');
      } else {
        console.log('[FIREBASE] Database hoàn toàn trống rỗng.');
      }
      
      console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');
      isFirebaseLoaded = true;
      broadcastState();
      io.emit('staff_data_updated', db.staff);
    });
  }
  
  loadFromFirebase();
} else {`;

code = code.replace(regex, cleanLogic);
fs.writeFileSync('server/server.js', code);
