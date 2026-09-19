const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const regex = /\/\/ 2\. ĐỒNG BỘ TỪ FIREBASE XUỐNG RAM KHI KHỞI ĐỘNG[\s\S]*?\} else \{/;

const newLogic = `// 2. ĐỒNG BỘ TỪ FIREBASE XUỐNG RAM KHI KHỞI ĐỘNG
if (fdb) {
  function checkAndSeedData() {
    fdb.ref('/').once('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.tournaments) db.tournaments = data.tournaments;
        if (data.members) db.members = data.members;
        if (data.time_logs) db.time_logs = data.time_logs;
        
        if (data.staff && data.staff.length > 0) {
          db.staff = data.staff;
          console.log('[FIREBASE] Đã nạp danh sách nhân sự hiện có từ Cloud.');
        } else {
          console.log('[FIREBASE] Node /staff trống, tiến hành seed 20 nhân viên mẫu...');
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
          fdb.ref('/staff').set(db.staff);
        }
      } else {
        console.log('[FIREBASE] Database hoàn toàn trống rỗng, khởi tạo seed 20 nhân viên mẫu...');
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
        fdb.ref('/staff').set(db.staff);
      }
      
      console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');
      isFirebaseLoaded = true;
      broadcastState();
      io.emit('staff_data_updated', db.staff);
    });
  }
  
  checkAndSeedData();
} else {`;

code = code.replace(regex, newLogic);
fs.writeFileSync('server/server.js', code);
