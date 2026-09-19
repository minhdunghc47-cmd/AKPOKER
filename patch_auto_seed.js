const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const seedBlock = `      if (data.staff) {
        db.staff = data.staff;
      } else {
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
        console.log('[FIREBASE] Tự động khởi tạo 20 nhân viên mẫu.');
        fdb.ref('/staff').set(db.staff);
      }`;

code = code.replace(/if \(data\.staff\) db\.staff = data\.staff;/, seedBlock);

fs.writeFileSync('server/server.js', code);
