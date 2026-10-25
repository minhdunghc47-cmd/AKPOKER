const express = require('express');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let isFirebaseLoaded = false;

try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync('/etc/secrets/serviceAccountKey.json')) {
    serviceAccount = require('/etc/secrets/serviceAccountKey.json');
  } else if (fs.existsSync('../serviceAccountKey.json')) {
    serviceAccount = require('../serviceAccountKey.json');
  } else if (fs.existsSync('./serviceAccountKey.json')) {
    serviceAccount = require('./serviceAccountKey.json');
  } else {
    throw new Error('Không tìm thấy file Key hợp lệ trên hệ thống hoặc biến môi trường FIREBASE_SERVICE_ACCOUNT');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://acepoker-1991.firebaseio.com"
  });
  console.log('[FIREBASE] Đã kết nối Firebase thành công!');
} catch (error) {
  console.error('[FIREBASE] Lỗi khởi tạo Firebase:', error);
}

const fdb = admin.apps.length ? admin.database() : null;

const app = express();
app.use(cors());

// Serve frontend static files
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));



// Fallback to index.html for any GET request that doesn't match a static file (useful if using client-side routing, but harmless otherwise)
app.get('*', (req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/socket.io')) {
        res.sendFile(path.join(clientPath, 'index.html'));
    } else {
        next();
    }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const defaultBlinds = [
  { level: 1, sb: 100, bb: 200, ante: 200, duration_minutes: 20, is_break: false },
  { level: 2, sb: 200, bb: 400, ante: 400, duration_minutes: 20, is_break: false }
];


const PREFERRED_SEAT_ORDER = [1, 3, 5, 7, 9, 2, 4, 6, 8];
let db = {
  tournaments: [],
  tour_templates: [],
  tables: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, is_locked: false, tour_id: null, dealer_name: null, dealer_time: null })),
  players: {},
  staff: [],
  time_logs: [],
  members: [],
  financial: { net_cash: 0, total_debt: 0, total_rake: 0 },
  payroll_history: []
};

if (fdb) {
  function loadFromFirebase() {
    let isTimeout = false;
    const timeoutTimer = setTimeout(() => {
      isTimeout = true;
      console.error('[FIREBASE] Cảnh báo: Hết thời gian kết nối (URL sai hoặc mạng lỗi). Hệ thống tự động chuyển sang chạy trên RAM!');
      isFirebaseLoaded = true;
      broadcastState(true);
    }, 3000);

    fdb.ref('/').once('value', (snapshot) => {
      if (isTimeout) return;
      clearTimeout(timeoutTimer);
      const data = snapshot.val();
      if (data) {
        if (data.tournaments) {
          db.tournaments = data.tournaments.map(t => ({ ...t, players: t.players || [] }));
        }
        if (data.tour_templates) db.tour_templates = data.tour_templates;
        if (data.members) db.members = data.members;
        if (data.time_logs) db.time_logs = data.time_logs;
        if (data.staff) db.staff = data.staff;
        if (data.payroll_history) db.payroll_history = data.payroll_history;
        if (data.tables) {
          db.tables = data.tables;
        } else {
          db.tournaments.forEach(t => {
            if (t.status !== 'archived' && t.status !== 'finished') {
              if (t.tables && Array.isArray(t.tables)) {
                t.tables.forEach(tableId => {
                  const tbl = db.tables.find(x => x.id === tableId);
                  if (tbl) { tbl.is_locked = true; tbl.tour_id = t.id; }
                });
              }
            }
          });
        }
      }
      isFirebaseLoaded = true;
      broadcastState(true);
    });
  }
  loadFromFirebase();
} else {
  isFirebaseLoaded = true;
}

function saveToFirebase(path, data) {
  if (fdb && isFirebaseLoaded) {
    fdb.ref(path).set(data).catch(err => console.error('[FIREBASE] Lỗi ghi data:', err));
  }
}

function sendTargetedState(sock, activeTours) {
    if (!isFirebaseLoaded) return;
    const role = sock.user.role;

    const tTours = getToursForRole(activeTours, role);
    if (role !== 'kiosk') {
      sock.emit('update_tours', tTours);
    }

    if (['god', 'td'].includes(role)) {
      sock.emit('update_tour_templates', db.tour_templates);
    }

    if (['god', 'td', 'floor', 'cashier'].includes(role)) {
      sock.emit('update_tables', db.tables);
      sock.emit('update_members', getMembersForRole(db.members, role));
    }

    const staffList = getStaffForRole(db.staff, role);
    sock.emit('update_staff_list', staffList);
    sock.emit('staff_data_updated', staffList);

    if (role === 'god') {
      sock.emit('update_payroll_history', db.payroll_history || []);
      sock.emit('update_god_mode', {
          financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 },
          staff: staffList,
          all_tours: tTours
      });
    }
}

function broadcastState(skipSave = false) {
  if (!isFirebaseLoaded) return;
  const activeTours = db.tournaments.filter(t => t.status !== 'archived');
  
  io.sockets.sockets.forEach(sock => {
      if (!sock.user || !sock.user.role) return;
      sendTargetedState(sock, activeTours);
  });

  if (!skipSave) {
    saveToFirebase('tournaments', db.tournaments);
    saveToFirebase('tour_templates', db.tour_templates);
    saveToFirebase('members', db.members);
    saveToFirebase('staff', db.staff);
    saveToFirebase('payroll_history', db.payroll_history);
    saveToFirebase('time_logs', db.time_logs);
    saveToFirebase('tables', db.tables);
  }
}

setInterval(() => {
  let stateChanged = false;
  const nowMs = Date.now();
  db.tournaments.forEach(t => {
    if (t.status === 'pending' && t.scheduled_start && nowMs >= t.scheduled_start) {
        t.status = 'running';
        stateChanged = true;
    }
    if (t.status === 'running') {
      t.time_remaining -= 1;

      if (t.time_remaining <= 0) {
        t.current_level_idx += 1;

        if (t.current_level_idx >= t.blinds_structure.length) {
            t.current_level_idx = t.blinds_structure.length - 1;
            t.time_remaining = 0;
            t.status = 'paused';
        } else {
            const currentBlind = t.blinds_structure[t.current_level_idx];
            let duration = currentBlind.duration_minutes;
            if (!currentBlind.is_break && t.settings && t.settings.level_time) {
                duration = t.settings.level_time;
            }
            t.time_remaining = duration * 60;
            io.emit('level_changed', { tour_id: t.id, level: currentBlind.level });
        }
        stateChanged = true;
      }
    }
  });

  if (stateChanged) {
    broadcastState();
  }
  // Only broadcast time changes every 5 seconds to reduce bandwidth
  else if (Date.now() % 5000 < 1050) {
    broadcastState(true);
  }
}, 1000);


// ==================== AUTHENTICATION MIDDLEWARE ====================
const ALLOWED_ROLES = ['god', 'td', 'floor', 'cashier', 'kiosk', 'tv'];

function getStaffForRole(staffList, role) {
    return staffList.map(s => {
        const copy = { ...s };
        delete copy.pin; // MIGRATION NOTE: PINs should be hashed. For now, cleartext PINs are NEVER sent to any client.
        if (role !== 'god') {
            delete copy.base_salary;
            delete copy.dealer_bonus;
            delete copy.cccd;
            delete copy.address;
            delete copy.bank_account;
            delete copy.bank_name;
            delete copy.dob;
        }
        return copy;
    });
}

function getMembersForRole(membersList, role) {
    return membersList.map(m => {
        const copy = { ...m };
        delete copy.bank_account;
        delete copy.bank_name;
        delete copy.dob;
        delete copy.address;
        delete copy.avatar_base64;
        delete copy.play_history;
        if (!['god', 'cashier'].includes(role)) {
            delete copy.phone;
        }
        return copy;
    });
}

function getToursForRole(tours, role) {
    if (role === 'kiosk') return [];
    return tours.map(t => {
        const copy = { ...t };
        if (role === 'tv') {
            copy.fund = { payout_pool: t.fund.payout_pool || (t.fund.total_paid * 0.85) };
            const aliveCount = t.alive_override !== undefined ? t.alive_override : t.players.filter(p => p.status === 'alive').length;
            copy.alive_override = aliveCount;
            copy.players = t.players.filter(p => !p.phone || !p.phone.startsWith('DUMMY_')).map(p => ({ status: p.status, rank: p.rank }));
            delete copy.settings;
        } else if (role === 'floor') {
            copy.fund = {};
            copy.players = t.players.map(p => ({ status: p.status, table_id: p.table_id, seat: p.seat, name: p.name }));
        } else if (role === 'cashier') {
            copy.players = t.players.map(p => ({ status: p.status, phone: p.phone, name: p.name }));
        }
        return copy;
    });
}

setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    io.sockets.sockets.forEach(sock => {
        if (!sock.user || !sock.user.role) return;
        if (sock.user.exp && now >= sock.user.exp) {
            sock.emit('token_expired');
            sock.disconnect(true);
        }
    });
}, 30000); // Check every 30 seconds

io.use((socket, next) => {
  const role = (socket.handshake.auth && (socket.handshake.auth.token || socket.handshake.auth.role)) || 'god';
  socket.user = { role: role };
  socket.join('role_' + role);
  next();
});

function requireRole(socket, allowedRoles, handler) {
  return (...args) => {
    if (!socket.user || !allowedRoles.includes(socket.user.role)) {
      const cb = args[args.length - 1];
      if (typeof cb === 'function') cb({ success: false, message: 'Lỗi Phân Quyền!' });
      return;
    }
    handler(...args);
  };
}

io.on('connection', (socket) => {


  if(isFirebaseLoaded) { sendTargetedState(socket, db.tournaments.filter(t => t.status !== 'archived')); }

  socket.on('request_initial_data', requireRole(socket, ['god', 'td', 'floor', 'cashier', 'kiosk', 'tv'], () => {
    sendTargetedState(socket, db.tournaments.filter(t => t.status !== 'archived'));
  }));

  socket.on('add_staff', requireRole(socket, ['god'], (payload, callback) => {
    const { id, name, pin, role, base_salary, dob, cccd, cccd_date, address, photo } = payload;
    const hashedPin = pin ? bcrypt.hashSync(pin, 10) : '';
    if (db.staff.find(s => s.id === id)) {
      if (callback) callback({ success: false, message: 'Mã nhân viên đã tồn tại!' });
      return;
    }
    db.staff.push({
      id, name, pin: hashedPin, role,
      base_salary: Number(base_salary) || 50000,
      dob, cccd, cccd_date, address, photo,
      status: 'offline',
      work_status: 'ACTIVE',
      total_minutes: 0,
      last_in: null
    });
    broadcastState();
    if (callback) callback({ success: true, message: 'Bổ nhiệm nhân sự thành công!' });
  }));

  socket.on('save_template', requireRole(socket, ['god', 'td'], (templateData, callback) => {
    // Generate an ID for the template
    const templateId = 'tpl_' + Date.now();
    const newTemplate = { id: templateId, ...templateData };
    if (!db.tour_templates) db.tour_templates = [];
    db.tour_templates.push(newTemplate);

    broadcastState(); // Save to firebase
    io.emit('update_tour_templates', db.tour_templates); // Broadcast to all connected clients

    if (callback) callback({ success: true, message: 'Đã lưu mẫu giải đấu thành công!' });
  }));

  socket.on('update_staff', requireRole(socket, ['god'], (payload, callback) => {
    const { id, name, pin, role, base_salary, dob, cccd, cccd_date, address, photo } = payload;
    let hashedPin = null;
    if (pin) hashedPin = bcrypt.hashSync(pin, 10);
    const staffIndex = db.staff.findIndex(s => s.id === id);
    if (staffIndex === -1) {
      if (callback) callback({ success: false, message: 'Không tìm thấy nhân viên!' });
      return;
    }
    db.staff[staffIndex].name = name;
    if(hashedPin) db.staff[staffIndex].pin = hashedPin;
    db.staff[staffIndex].role = role;
    db.staff[staffIndex].base_salary = Number(base_salary) || 50000;
    if(dob) db.staff[staffIndex].dob = dob;
    if(cccd) db.staff[staffIndex].cccd = cccd;
    if(cccd_date) db.staff[staffIndex].cccd_date = cccd_date;
    if(address) db.staff[staffIndex].address = address;
    if(photo !== undefined) db.staff[staffIndex].photo = photo;

    broadcastState();
    if (callback) callback({ success: true, message: 'Cập nhật nhân sự thành công!' });
  }));

  socket.on('reset_staff_pin', requireRole(socket, ['god'], (payload, callback) => {
    const { staff_id, new_pin } = payload || {};
    if (!staff_id || !new_pin || String(new_pin).length !== 4) {
      if (callback) callback({ success: false, message: 'Mã PIN mới phải đúng 4 chữ số!' });
      return;
    }
    const staff = db.staff.find(s => s.id === staff_id);
    if (!staff) {
      if (callback) callback({ success: false, message: 'Không tìm thấy nhân viên!' });
      return;
    }
    staff.pin = bcrypt.hashSync(String(new_pin), 10);
    broadcastState();
    if (callback) callback({ success: true, message: 'Đổi mã PIN cho nhân sự ' + staff.name + ' (' + staff.id + ') thành công!' });
  }));

  socket.on('change_staff_pin', requireRole(socket, ['god', 'kiosk'], (payload, callback) => {
    const { staff_id, old_pin, new_pin } = payload || {};
    if (!staff_id || !old_pin || !new_pin) {
      if (callback) callback({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
      return;
    }
    if (String(new_pin).length !== 4) {
      if (callback) callback({ success: false, message: 'Mã PIN mới phải gồm đúng 4 chữ số!' });
      return;
    }

    const staff = db.staff.find(s => s.id === staff_id);
    if (!staff) {
      if (callback) callback({ success: false, message: 'Không tìm thấy nhân viên!' });
      return;
    }
    if (staff.work_status === 'RESIGNED') {
      if (callback) callback({ success: false, message: 'Tài khoản nhân viên này đã bị khóa do thôi việc!' });
      return;
    }

    let isOldPinValid = false;
    if (staff.pin) {
      if (staff.pin.startsWith('$2a$') || staff.pin.startsWith('$2b$')) {
        isOldPinValid = bcrypt.compareSync(String(old_pin), staff.pin);
      } else {
        isOldPinValid = (staff.pin === String(old_pin));
      }
    }

    if (!isOldPinValid) {
      if (callback) callback({ success: false, message: 'Mã PIN hiện tại không chính xác!' });
      return;
    }

    staff.pin = bcrypt.hashSync(String(new_pin), 10);
    broadcastState();
    if (callback) callback({ success: true, message: 'Đổi mã PIN cá nhân thành công! Hãy ghi nhớ mã PIN mới.' });
  }));

  socket.on('close_payroll_period', requireRole(socket, ['god'], (payload, callback) => {
    const { period_name, note } = payload || {};
    const name = period_name && period_name.trim() ? period_name.trim() : ('Kỳ lương ' + new Date().toLocaleDateString('vi-VN'));

    // Tính toán snapshot chi tiết lương từng nhân sự tại thời điểm chốt sổ
    const staffRecords = (db.staff || []).map(s => {
      const totalMinutes = s.total_minutes || 0;
      const baseSalaryRate = s.base_salary || 50000;
      const hours = Number((totalMinutes / 60).toFixed(2));
      const baseSalary = Math.round((totalMinutes / 60) * baseSalaryRate);

      let dealingMinutes = 0;
      let dealingBonus = 0;
      const dealerBonusRate = s.dealer_bonus || 30000;

      if (s.total_dealing_ms) {
        dealingMinutes = Math.floor(s.total_dealing_ms / 60000);
        dealingBonus = Math.round((dealingMinutes / 60) * dealerBonusRate);
      }

      const totalEarnings = baseSalary + dealingBonus;

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        work_status: s.work_status || 'ACTIVE',
        base_salary_rate: baseSalaryRate,
        dealer_bonus_rate: dealerBonusRate,
        total_minutes: totalMinutes,
        work_hours: hours,
        base_salary_earned: baseSalary,
        total_dealing_ms: s.total_dealing_ms || 0,
        dealing_minutes: dealingMinutes,
        dealing_bonus_earned: dealingBonus,
        total_earnings: totalEarnings
      };
    });

    const totalPayout = staffRecords.reduce((sum, r) => sum + r.total_earnings, 0);

    const snapshot = {
      id: 'PAYROLL_' + Date.now(),
      name: name,
      note: note || '',
      closed_at: Date.now(),
      closed_by: 'god',
      staff_count: staffRecords.length,
      total_payout: totalPayout,
      records: staffRecords
    };

    if (!db.payroll_history) db.payroll_history = [];
    db.payroll_history.unshift(snapshot);

    // Reset số giờ làm và số giờ chia bài về 0 cho tất cả nhân sự để bắt đầu kỳ mới
    db.staff.forEach(s => {
      s.total_minutes = 0;
      s.total_dealing_ms = 0;
      if (s.status === 'offline') {
        s.last_in = null;
        s.session_start = null;
      } else {
        // Nếu nhân viên đang trong ca làm việc, mốc tính lại tính từ thời điểm chốt sổ
        const now = Date.now();
        if (s.last_in) s.last_in = now;
        if (s.session_start) s.session_start = now;
      }
    });

    broadcastState();
    if (callback) callback({
      success: true,
      message: `Đã chốt sổ [${name}] thành công! Tổng chi lương: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPayout)}. Số giờ làm đã được reset về 0.`
    });
  }));

  socket.on('resign_staff', requireRole(socket, ['god'], (staffId, callback) => {
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
    if (s.session_start) {
      s.total_dealing_ms = (s.total_dealing_ms || 0) + (now - s.session_start);
      s.session_start = null;
    }
        s.status = 'offline';
        s.last_in = null;
        db.time_logs.push({ staff_id: s.id, name: s.name, type: 'OUT', time: now });
    }
    broadcastState();
    if(callback) callback({ success: true, message: 'Đã cập nhật trạng thái Thôi Việc!' });
  }));

  socket.on('clock_in', requireRole(socket, ['god', 'kiosk'], (payload, callback) => {
    const { staff_id, pin } = payload;
    const s = db.staff.find(s => s.id === staff_id);
    if(s && s.work_status === 'RESIGNED') { if(callback) callback({success: false, message: 'Tài khoản đã bị khóa do thôi việc. Không thể chấm công!'}); return; }
    if (!s) { if(callback) callback({success: false, message: 'Không tìm thấy nhân sự!'}); return; }
    // Support both bcrypt hashes and legacy cleartext for safety during migration
    let isPinValid = false;
    if (s.pin) {
        if (s.pin.startsWith('$2a$') || s.pin.startsWith('$2b$')) {
            isPinValid = bcrypt.compareSync(pin, s.pin);
        } else {
            isPinValid = (s.pin === pin);
        }
    }
    if (!isPinValid) { if(callback) callback({success: false, message: 'Mã PIN sai!'}); return; }
    if (s.status !== 'offline') { if(callback) callback({success: false, message: 'Đã check-in rồi!'}); return; }

    s.status = 'waiting';
    s.last_in = Date.now();
    s.total_dealing_ms = 0;
    s.session_start = null;
    db.time_logs.push({ staff_id, name: s.name, type: 'IN', time: s.last_in });

    broadcastState();
    if (callback) callback({ success: true, message: 'Check-IN thành công!' });
  }));

  socket.on('clock_out', requireRole(socket, ['god', 'kiosk'], (payload, callback) => {
    const { staff_id, pin } = payload;
    const s = db.staff.find(s => s.id === staff_id);
    if(s && s.work_status === 'RESIGNED') { if(callback) callback({success: false, message: 'Tài khoản đã bị khóa do thôi việc. Không thể chấm công!'}); return; }
    if (!s) { if(callback) callback({success: false, message: 'Không tìm thấy nhân sự!'}); return; }
    // Support both bcrypt hashes and legacy cleartext for safety during migration
    let isPinValidOut = false;
    if (s.pin) {
        if (s.pin.startsWith('$2a$') || s.pin.startsWith('$2b$')) {
            isPinValidOut = bcrypt.compareSync(pin, s.pin);
        } else {
            isPinValidOut = (s.pin === pin);
        }
    }
    if (!isPinValidOut) { if(callback) callback({success: false, message: 'Mã PIN sai!'}); return; }
    if (s.status === 'offline') { if(callback) callback({success: false, message: 'Đang offline!'}); return; }

    const now = Date.now();
    if (s.last_in) {
      const diffMins = Math.floor((now - s.last_in) / 60000);
      s.total_minutes += diffMins;
    }
    if (s.session_start) {
      s.total_dealing_ms = (s.total_dealing_ms || 0) + (now - s.session_start);
      s.session_start = null;
    }
    s.status = 'offline';
    s.last_in = null;
    db.time_logs.push({ staff_id, name: s.name, type: 'OUT', time: now });

    // Auto-cleanup: keep only last 90 days of logs
    const cutoff90d = Date.now() - (90 * 24 * 60 * 60 * 1000);
    db.time_logs = db.time_logs.filter(log => log.time >= cutoff90d);

    broadcastState();
    if (callback) callback({ success: true, message: 'Check-OUT thành công!' });
  }));

  socket.on('register_member', requireRole(socket, ['god', 'cashier'], (payload, callback) => {
    const { phone, name, dob, address, bank_account, bank_name, avatar_base64 } = payload;
    if (db.members.find(m => m.phone === phone)) {
      if (callback) callback({ success: false, message: 'Số điện thoại đã tồn tại!' });
      return;
    }
    db.members.push({ phone, name, dob, address, bank_account, bank_name, avatar_base64, play_history: [], total_tours: 0 });
    broadcastState();
    if (callback) callback({ success: true, message: 'Đăng ký Hội Viên thành công!' });
  }));

  socket.on('update_member', requireRole(socket, ['god', 'cashier'], (payload, callback) => {
    const { phone, new_phone, name, dob, address, bank_account, bank_name, avatar_base64 } = payload;
    const member = db.members.find(m => m.phone === phone);
    if (!member) {
      if (callback) callback({ success: false, message: 'Không tìm thấy hội viên!' });
      return;
    }

    if (new_phone && new_phone !== phone) {
      if (db.members.find(m => m.phone === new_phone)) {
        if (callback) callback({ success: false, message: 'Số điện thoại mới đã tồn tại!' });
        return;
      }
      member.phone = new_phone;

      // Update phone in active tournaments
      db.tournaments.forEach(tour => {
        if (tour.status !== 'archived' && tour.status !== 'finished') {
          tour.players.forEach(p => {
            if (p.phone === phone) p.phone = new_phone;
          });
        }
      });
    }

    member.name = name || member.name;
    member.dob = dob || member.dob;
    member.address = address || member.address;
    member.bank_name = bank_name || member.bank_name;
    member.bank_account = bank_account || member.bank_account;
    if (avatar_base64) member.avatar_base64 = avatar_base64;

    broadcastState();
    if (callback) callback({ success: true, message: 'Cập nhật hồ sơ thành công!' });
  }));

  socket.on('create_tour', requireRole(socket, ['god', 'td'], (data) => {
    const { name, selectedTableIds, settings, starting_stack, buyin_fee, buy_in_fee, scheduled_start } = data;
    const tablesToLock = db.tables.filter(t => (selectedTableIds || []).includes(t.id));
    const canLock = tablesToLock.every(t => !t.is_locked);

    if (canLock && name && (selectedTableIds || []).length > 0) {
      const tourId = 'T' + Date.now();
      tablesToLock.forEach(t => { t.is_locked = true; t.tour_id = tourId; });

      const newTour = {
        id: tourId, name: name, tables: selectedTableIds, entries: 0, dealer_assigned: false, buyin_fee: buyin_fee || buy_in_fee || 0,
        status: scheduled_start ? 'pending' : 'paused', players: [],
        scheduled_start: scheduled_start || null,
        fund: { total_paid: 0, expenses: 0, debt: 0, net_fund: 0, payout_pool: 0 },
        settings: settings || { level_time: 20, late_reg_level: 6, min_players: 6 },
        starting_stack: Number(starting_stack) || 100000,
        current_level_idx: 0,
        time_remaining: (settings && settings.level_time ? settings.level_time : 20) * 60,
        blinds_structure: data.blinds_structure || JSON.parse(JSON.stringify(defaultBlinds))
      };

      if (!newTour.settings.min_players) newTour.settings.min_players = 6;

      db.tournaments.push(newTour);
      broadcastState();
    }
  }));

  socket.on('start_tour', requireRole(socket, ['god', 'td'], (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.entries >= 6 && t.dealer_assigned && t.status === 'paused') {
      t.status = 'running'; broadcastState();
    }
  }));

  socket.on('pause_tour', requireRole(socket, ['god', 'td'], (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.status === 'running') {
      t.status = 'paused'; broadcastState();
    }
  }));

  socket.on('next_level', requireRole(socket, ['god', 'td'], (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.current_level_idx < t.blinds_structure.length - 1) {
      t.current_level_idx++;
      const currentBlind = t.blinds_structure[t.current_level_idx];
      let duration = currentBlind.duration_minutes;
      if (!currentBlind.is_break && t.settings.level_time) duration = t.settings.level_time;
      t.time_remaining = duration * 60;
      io.emit('level_changed', { tour_id: t.id, level: currentBlind.level });
      broadcastState();
    }
  }));

  socket.on('prev_level', requireRole(socket, ['god', 'td'], (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.current_level_idx > 0) {
      t.current_level_idx--;
      const currentBlind = t.blinds_structure[t.current_level_idx];
      let duration = currentBlind.duration_minutes;
      if (!currentBlind.is_break && t.settings.level_time) duration = t.settings.level_time;
      t.time_remaining = duration * 60;
      io.emit('level_changed', { tour_id: t.id, level: currentBlind.level });
      broadcastState();
    }
  }));

  socket.on('sell_ticket', requireRole(socket, ['god', 'cashier'], (payload, callback) => {
    const { tour_id, member_phone, is_paid, buy_in_amount, ticket_type = 'buy_in' } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (!t) return;

    const member = db.members.find(m => m.phone === member_phone);
    if (!member) {
      if(callback) callback({ success: false, code: 'MEMBER_NOT_FOUND', message: 'KHÁCH CHƯA ĐĂNG KÝ HỘI VIÊN' });
      return;
    }

    let assigned_table = null;
    let assigned_seat = null;

    if (ticket_type === 'add_on') {
      // ADD-ON: Khách phải đang còn thi đấu (alive) trong giải đấu này
      const activePlayer = t.players.find(p => p.phone === member_phone && p.status === 'alive');
      if (!activePlayer) {
        if(callback) callback({ success: false, message: 'Khách chưa có ghế ngồi thi đấu tại giải này để mua Add-on!' });
        return;
      }
      assigned_table = activePlayer.table_id;
      assigned_seat = activePlayer.seat;
    } else if (ticket_type === 're_buy') {
      // RE-BUY: Khách phải bị bust trong giải này (hoặc chưa ngồi thi đấu)
      const activeInThis = t.players.find(p => p.phone === member_phone && p.status === 'alive');
      if (activeInThis) {
        if(callback) callback({ success: false, message: `Khách đang thi đấu tại Bàn ${activeInThis.table_id} - Ghế ${activeInThis.seat}! Phải Busted trước khi Re-buy.` });
        return;
      }

      // Check anti-ghosting ở các giải khác đang chạy
      let ghostingTour = null;
      db.tournaments.forEach(tour => {
        if (tour.id !== t.id && tour.status !== 'archived' && tour.status !== 'finished') {
          if (tour.players.find(p => p.phone === member_phone && p.status === 'alive')) {
            ghostingTour = tour;
          }
        }
      });
      if (ghostingTour) {
        if(callback) callback({ success: false, message: `LỖI ANTI-GHOSTING! Khách đang thi đấu tại giải [${ghostingTour.name}], không thể Re-buy giải này!` });
        return;
      }
    } else {
      // BUY-IN: Kiểm tra anti-ghosting toàn bộ các giải đang chạy
      let ghostingTour = null;
      db.tournaments.forEach(tour => {
        if (tour.status !== 'archived' && tour.status !== 'finished') {
          if (tour.players.find(p => p.phone === member_phone && p.status === 'alive')) {
            ghostingTour = tour;
          }
        }
      });
      if (ghostingTour) {
        if(callback) callback({ success: false, message: `LỖI ANTI-GHOSTING! Khách đang thi đấu tại giải [${ghostingTour.name}], không thể Buy-in!` });
        return;
      }
    }

    // Nếu là BUY-IN hoặc RE-BUY: Bốc thăm ngẫu nhiên chỗ ngồi (Random Seat Draw & Table Balancing)
    if (ticket_type !== 'add_on') {
      let minPlayers = 999;
      for (let tableId of t.tables) {
        const aliveCount = t.players.filter(p => p.table_id === tableId && p.status === 'alive').length;
        if (aliveCount < minPlayers) {
          minPlayers = aliveCount;
        }
      }

      if (minPlayers >= 9) {
        if (callback) callback({ success: false, message: "Hệ thống báo: TẤT CẢ CÁC BÀN ĐÃ ĐẦY (9/9)! Hãy yêu cầu Floor mở thêm bàn mới trước khi Thu ngân có thể bán vé!"});
        return;
      }

      // Lọc các bàn có số người bằng minPlayers để cân bằng bàn
      let candidateTables = [];
      for (let tableId of t.tables) {
        const alivePlayers = t.players.filter(p => p.table_id === tableId && p.status === 'alive');
        if (alivePlayers.length === minPlayers && alivePlayers.length < 9) {
          candidateTables.push(tableId);
        }
      }

      // Bốc thăm ngẫu nhiên 1 bàn trong các bàn ít người nhất
      assigned_table = candidateTables[Math.floor(Math.random() * candidateTables.length)];

      const aliveOnTable = t.players.filter(p => p.table_id === assigned_table && p.status === 'alive');
      const occupiedSeats = aliveOnTable.map(p => p.seat);
      const emptySeats = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(s => !occupiedSeats.includes(s));

      if (emptySeats.length === 0) {
        if (callback) callback({ success: false, message: `Bàn ${assigned_table} đã đầy ghế!` });
        return;
      }

      // BỐC THĂM NGẪU NHIÊN 1 GHẾ TRỐNG (Chuẩn Fair Random Seat Draw như Bee Poker)
      assigned_seat = emptySeats[Math.floor(Math.random() * emptySeats.length)];

      t.players.push({ 
        phone: member_phone, 
        name: member.name, 
        status: 'alive', 
        table_id: assigned_table, 
        seat: assigned_seat,
        ticket_type 
      });
      t.entries += 1;
    }

    const amount = Number(buy_in_amount) || 0;
    member.total_tours = (member.total_tours || 0) + 1;
    member.play_history = member.play_history || [];
    member.play_history.push({ tour_name: t.name, ticket_type, buy_in_amount: amount, time: Date.now() });

    if (is_paid) {
      t.fund.total_paid += amount;
    } else {
      t.fund.debt += amount;
    }
    t.fund.net_fund = t.fund.total_paid - t.fund.expenses;

    broadcastState();
    const ticket_id = 'AK-' + Date.now().toString().slice(-6);
    const typeLabel = ticket_type === 'add_on' ? 'ADD-ON' : (ticket_type === 're_buy' ? 'RE-BUY' : 'BUY-IN');
    if(callback) callback({ 
      success: true, 
      assigned_table, 
      assigned_seat, 
      ticket_type,
      ticket_id,
      tour_name: t.name,
      amount,
      message: `In Vé ${typeLabel} Thành Công! Bàn ${assigned_table} - Ghế ${assigned_seat}` 
    });
  }));


  socket.on('add_table_to_tour', requireRole(socket, ['god', 'td', 'floor'], (payload) => {
    const { tour_id, table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    const tbl = db.tables.find(x => x.id === table_id);
    if (t && tbl && !tbl.is_locked) {
        if (!t.tables.includes(table_id)) {
            t.tables.push(table_id);
            tbl.is_locked = true;
            broadcastState();
        }
    }
  }));

  socket.on('remove_table_from_tour', requireRole(socket, ['god', 'td', 'floor'], (payload) => {
    const { tour_id, table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    const tbl = db.tables.find(x => x.id === table_id);
    if (t && tbl) {
        // Kiểm tra xem bàn có người đang alive không
        const alivePlayers = (t.players||[]).filter(p => p.table_id === table_id && p.status === 'alive');
        if (alivePlayers.length > 0) return; // Không cho đóng

        t.tables = t.tables.filter(id => id !== table_id);
        tbl.is_locked = false;

        // Trả dealer về waiting
        if (tbl.dealer_name) {
            const staff = db.staff.find(s => s.name === tbl.dealer_name);
            if (staff && staff.status === 'busy') {
                staff.status = 'waiting';
                if (staff.session_start) {
                    staff.total_dealing_ms = (staff.total_dealing_ms || 0) + (Date.now() - staff.session_start);
                    staff.session_start = null;
                }
            }
            tbl.dealer_name = null;
            tbl.dealer_time = null;
        }

        broadcastState();
    }
  }));


  socket.on('unassign_dealer', requireRole(socket, ['god', 'td', 'floor'], (payload) => {
    const table = db.tables.find(tbl => tbl.id === payload.table_id);
    if (table && table.dealer_name) {
      const oldStaff = db.staff.find(s => s.name === table.dealer_name);
      if (oldStaff) {
          oldStaff.status = 'waiting';
          if (oldStaff.session_start) {
              oldStaff.total_dealing_ms = (oldStaff.total_dealing_ms || 0) + (Date.now() - oldStaff.session_start);
              oldStaff.session_start = null;
          }
      }
      table.dealer_name = null;
      table.dealer_time = null;

      const t = db.tournaments.find(t => t.id === payload.tour_id);
      if (t) {
        // Check if any other table has a dealer
        const hasDealer = db.tables.some(tbl => t.tables.includes(tbl.id) && tbl.dealer_name);
        t.dealer_assigned = hasDealer;
      }

      broadcastState();
    }
  }));

  socket.on('assign_dealer', requireRole(socket, ['god', 'td', 'floor'], (payload) => {
    const table = db.tables.find(tbl => tbl.id === payload.table_id);
    if (table) {
      // Free old dealer
      if (table.dealer_name) {
          const oldStaff = db.staff.find(s => s.name === table.dealer_name);
          if (oldStaff) {
              oldStaff.status = 'waiting';
              if (oldStaff.session_start) {
                  oldStaff.total_dealing_ms = (oldStaff.total_dealing_ms || 0) + (Date.now() - oldStaff.session_start);
                  oldStaff.session_start = null;
              }
          }
      }

      table.dealer_name = payload.dealer_name;
      table.dealer_time = Date.now();

      // Mark new dealer as busy
      const newStaff = db.staff.find(s => s.name === payload.dealer_name);
      if (newStaff) {
          newStaff.status = 'busy';
          newStaff.session_start = Date.now();
      }

      const t = db.tournaments.find(t => t.id === payload.tour_id);
      if (t) t.dealer_assigned = true;

      broadcastState();
    }
  }));

  socket.on('move_player_table', requireRole(socket, ['god', 'td', 'floor'], (payload) => {
    const { tour_id, player_phone, new_table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (t) {
      const p = t.players.find(p => p.phone === player_phone && p.status === 'alive');
      if (p) {
        p.table_id = parseInt(new_table_id);

        // Find empty seat at new table
        let new_seat = 1;
        const playersAtNewTable = t.players.filter(x => x.table_id === p.table_id && x.status === 'alive' && x.phone !== p.phone);
        const occupiedSeats = playersAtNewTable.map(x => x.seat);
        for (let i of PREFERRED_SEAT_ORDER) {
            if(!occupiedSeats.includes(i)) { new_seat = i; break; }
        }
        p.seat = new_seat;

        broadcastState();
      }
    }
  }));

  socket.on('bust_out', requireRole(socket, ['god', 'td', 'floor'], (payload) => {
    const t = db.tournaments.find(t => t.id === payload.tour_id);
    if (t) {
      const p = t.players.find(p => (p.phone === payload.player_phone || p.name === payload.player_name) && p.status === 'alive');
      if (p) {
        const aliveCount = t.players.filter(x => x.status === 'alive').length;
        p.rank = aliveCount; // Hạng của player chính là số người còn sống tại thời điểm bị bust
        p.status = 'busted';

        if (!t.itm_results) t.itm_results = {};
        t.itm_results[aliveCount] = p.name || p.phone;

        // Nếu chỉ còn 1 người sống sót duy nhất, tự động gán hạng 1 cho người đó (Winner)
        if (aliveCount - 1 === 1) {
            const winner = t.players.find(x => x.status === 'alive');
            if (winner) {
                winner.rank = 1;
                t.itm_results[1] = winner.name || winner.phone;
            }
        }

        broadcastState();
      }
    }
  }));


  socket.on('adjust_time', requireRole(socket, ['god', 'td'], (tourId, seconds) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && (t.status === 'running' || t.status === 'paused')) {
        t.time_remaining += seconds;
        if(t.time_remaining < 0) t.time_remaining = 0;
        broadcastState();
    }
  }));

  socket.on('force_edit_stats', requireRole(socket, ['god', 'td'], (payload) => {
    const { tour_id, entries, alive } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (t) {
        // Use override counters instead of mutating actual player list with dummy data
        t.entries = Number(entries) || t.entries;
        t.alive_override = Number(alive);
        broadcastState();
    }
  }));

  socket.on('end_tour', requireRole(socket, ['god', 'td'], (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && (t.status === 'running' || t.status === 'paused')) {
      t.status = 'finished';
      t.fund.payout_pool = t.fund.total_paid * 0.85;

      // Xóa dealer khỏi các bàn của giải này
      if (t.tables && Array.isArray(t.tables)) {
        t.tables.forEach(tableId => {
          const tbl = db.tables.find(x => x.id === tableId);
          if (tbl && tbl.dealer_name) {
             const staff = db.staff.find(s => s.name === tbl.dealer_name);
             if (staff && staff.status === 'busy') {
                staff.status = 'waiting';
                if (staff.session_start) {
                    staff.total_dealing_ms = (staff.total_dealing_ms || 0) + (Date.now() - staff.session_start);
                    staff.session_start = null;
                }
            }
             tbl.dealer_name = null;
             tbl.dealer_time = null;
          }
        });
        t.dealer_assigned = false;
      }

      broadcastState();
    }
  }));

  socket.on('reset_tour', requireRole(socket, ['god', 'td'], (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.status === 'finished') {
      t.status = 'archived';
      db.tables.forEach(table => { if (table.tour_id === tourId) { table.is_locked = false; table.tour_id = null; } });
      broadcastState();
    }
  }));
});

server.listen(process.env.PORT || 3000, () => console.log(`[API] Server is running`));

