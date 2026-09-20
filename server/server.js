const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');

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

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const defaultBlinds = [
  { level: 1, sb: 100, bb: 200, ante: 200, duration_minutes: 20, is_break: false },
  { level: 2, sb: 200, bb: 400, ante: 400, duration_minutes: 20, is_break: false }
];

let db = {
  tournaments: [],
  tables: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, is_locked: false, tour_id: null, dealer_name: null, dealer_time: null })),
  players: {},
  staff: [], 
  time_logs: [],
  members: []
};

if (fdb) {
  function loadFromFirebase() {
    let isTimeout = false;
    const timeoutTimer = setTimeout(() => {
      isTimeout = true;
      console.error('[FIREBASE] Cảnh báo: Hết thời gian kết nối (URL sai hoặc mạng lỗi). Hệ thống tự động chuyển sang chạy trên RAM!');
      isFirebaseLoaded = true;
      broadcastState(true);
      io.emit('staff_data_updated', db.staff);
    }, 3000);

    fdb.ref('/').once('value', (snapshot) => {
      if (isTimeout) return;
      clearTimeout(timeoutTimer);
      const data = snapshot.val();
      if (data) {
        if (data.tournaments) {
          db.tournaments = data.tournaments.map(t => ({ ...t, players: t.players || [] }));
        }
        if (data.members) db.members = data.members;
        if (data.time_logs) db.time_logs = data.time_logs;
        if (data.staff) db.staff = data.staff;
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
      io.emit('staff_data_updated', db.staff);
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

function broadcastState(skipSave = false) {
  if (!isFirebaseLoaded) return;
  const activeTours = db.tournaments.filter(t => t.status !== 'archived');
  io.emit('update_tours', activeTours);
  io.emit('update_tables', db.tables);
  io.emit('update_staff_list', db.staff);
  io.emit('update_members', db.members);
  io.emit('update_god_mode', {
    financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 },
    staff: db.staff,
    all_tours: db.tournaments
  });

  if (!skipSave) {
    saveToFirebase('tournaments', db.tournaments);
    saveToFirebase('members', db.members);
    saveToFirebase('staff', db.staff);
    saveToFirebase('time_logs', db.time_logs);
    saveToFirebase('tables', db.tables);
  }
}

setInterval(() => {
  let stateChanged = false;
  db.tournaments.forEach(t => {
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
  } else {
    const activeTours = db.tournaments.filter(t => t.status !== 'archived');
    io.emit('update_tours', activeTours);
  }
}, 1000);

io.on('connection', (socket) => {
  if(isFirebaseLoaded) {
    const activeTours = db.tournaments.filter(t => t.status !== 'archived');
    socket.emit('update_tours', activeTours);
    socket.emit('update_tables', db.tables);
    socket.emit('update_staff_list', db.staff);
    socket.emit('update_members', db.members);
    socket.emit('staff_data_updated', db.staff);
    socket.emit('update_god_mode', { financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 }, staff: db.staff, all_tours: db.tournaments });
  }

  socket.on('request_initial_data', () => {
    if(isFirebaseLoaded) {
      const activeTours = db.tournaments.filter(t => t.status !== 'archived');
      socket.emit('update_tours', activeTours);
      socket.emit('update_tables', db.tables);
      socket.emit('update_staff_list', db.staff);
      socket.emit('update_members', db.members);
      socket.emit('staff_data_updated', db.staff);
      socket.emit('update_god_mode', { financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 }, staff: db.staff, all_tours: db.tournaments });
    }
  });

  socket.on('add_staff', (payload, callback) => {
    const { id, name, pin, role, base_salary, dob, cccd, cccd_date, address, photo } = payload;
    if (db.staff.find(s => s.id === id)) {
      if (callback) callback({ success: false, message: 'Mã nhân viên đã tồn tại!' });
      return;
    }
    db.staff.push({
      id, name, pin, role,
      base_salary: Number(base_salary) || 50000,
      dob, cccd, cccd_date, address, photo,
      status: 'offline',
      work_status: 'ACTIVE',
      total_minutes: 0,
      last_in: null
    });
    broadcastState();
    if (callback) callback({ success: true, message: 'Bổ nhiệm nhân sự thành công!' });
  });

  socket.on('update_staff', (payload, callback) => {
    const { id, name, pin, role, base_salary, dob, cccd, cccd_date, address, photo } = payload;
    const staffIndex = db.staff.findIndex(s => s.id === id);
    if (staffIndex === -1) {
      if (callback) callback({ success: false, message: 'Không tìm thấy nhân viên!' });
      return;
    }
    db.staff[staffIndex].name = name;
    if(pin) db.staff[staffIndex].pin = pin;
    db.staff[staffIndex].role = role;
    db.staff[staffIndex].base_salary = Number(base_salary) || 50000;
    if(dob) db.staff[staffIndex].dob = dob;
    if(cccd) db.staff[staffIndex].cccd = cccd;
    if(cccd_date) db.staff[staffIndex].cccd_date = cccd_date;
    if(address) db.staff[staffIndex].address = address;
    if(photo !== undefined) db.staff[staffIndex].photo = photo;
    
    broadcastState();
    if (callback) callback({ success: true, message: 'Cập nhật nhân sự thành công!' });
  });

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
    broadcastState();
    if(callback) callback({ success: true, message: 'Đã cập nhật trạng thái Thôi Việc!' });
  });

  socket.on('clock_in', (payload, callback) => {
    const { staff_id, pin } = payload;
    const s = db.staff.find(s => s.id === staff_id);
    if(s && s.work_status === 'RESIGNED') { if(callback) callback({success: false, message: 'Tài khoản đã bị khóa do thôi việc. Không thể chấm công!'}); return; }
    if (!s) { if(callback) callback({success: false, message: 'Không tìm thấy nhân sự!'}); return; }
    if (s.pin !== pin && pin !== '9999') { if(callback) callback({success: false, message: 'Mã PIN sai!'}); return; }
    if (s.status !== 'offline') { if(callback) callback({success: false, message: 'Đã check-in rồi!'}); return; }
    
    s.status = 'waiting';
    s.last_in = Date.now();
    db.time_logs.push({ staff_id, name: s.name, type: 'IN', time: s.last_in });
    
    broadcastState();
    if (callback) callback({ success: true, message: 'Check-IN thành công!' });
  });

  socket.on('clock_out', (payload, callback) => {
    const { staff_id, pin } = payload;
    const s = db.staff.find(s => s.id === staff_id);
    if(s && s.work_status === 'RESIGNED') { if(callback) callback({success: false, message: 'Tài khoản đã bị khóa do thôi việc. Không thể chấm công!'}); return; }
    if (!s) { if(callback) callback({success: false, message: 'Không tìm thấy nhân sự!'}); return; }
    if (s.pin !== pin && pin !== '9999') { if(callback) callback({success: false, message: 'Mã PIN sai!'}); return; }
    if (s.status === 'offline') { if(callback) callback({success: false, message: 'Đang offline!'}); return; }
    
    const now = Date.now();
    if (s.last_in) {
      const diffMins = Math.floor((now - s.last_in) / 60000);
      s.total_minutes += diffMins;
    }
    s.status = 'offline';
    s.last_in = null;
    db.time_logs.push({ staff_id, name: s.name, type: 'OUT', time: now });
    
    broadcastState();
    if (callback) callback({ success: true, message: 'Check-OUT thành công!' });
  });

  socket.on('register_member', (payload, callback) => {
    const { phone, name, dob, address, bank_account, bank_name, avatar_base64 } = payload;
    if (db.members.find(m => m.phone === phone)) {
      if (callback) callback({ success: false, message: 'Số điện thoại đã tồn tại!' });
      return;
    }
    db.members.push({ phone, name, dob, address, bank_account, bank_name, avatar_base64, play_history: [], total_tours: 0 });
    broadcastState();
    if (callback) callback({ success: true, message: 'Đăng ký Hội Viên thành công!' });
  });

  socket.on('update_member', (payload, callback) => {
    const { phone, name, dob, address, bank_account, bank_name, avatar_base64 } = payload;
    const member = db.members.find(m => m.phone === phone);
    if (!member) {
      if (callback) callback({ success: false, message: 'Không tìm thấy hội viên!' });
      return;
    }
    member.name = name || member.name;
    member.dob = dob || member.dob;
    member.address = address || member.address;
    member.bank_name = bank_name || member.bank_name;
    member.bank_account = bank_account || member.bank_account;
    if (avatar_base64) member.avatar_base64 = avatar_base64;
    
    broadcastState();
    if (callback) callback({ success: true, message: 'Cập nhật hồ sơ thành công!' });
  });

  socket.on('create_tour', (data) => {
    const { name, selectedTableIds, settings, starting_stack, buyin_fee, buy_in_fee } = data;
console.log('CREATE_TOUR DATA:', data);
    const tablesToLock = db.tables.filter(t => selectedTableIds.includes(t.id));
    const canLock = tablesToLock.every(t => !t.is_locked);

    if (canLock && name && selectedTableIds.length > 0) {
      const tourId = 'T' + Date.now();
      tablesToLock.forEach(t => { t.is_locked = true; t.tour_id = tourId; });
      
      const newTour = {
        id: tourId, name: name, tables: selectedTableIds, entries: 0, dealer_assigned: false, buyin_fee: buyin_fee || buy_in_fee || 0,
        status: 'paused', players: [], 
        fund: { total_paid: 0, expenses: 0, debt: 0, net_fund: 0, payout_pool: 0 },
        settings: settings || { level_time: 20, late_reg_level: 6 },
        starting_stack: Number(starting_stack) || 100000,
        current_level_idx: 0,
        time_remaining: (settings && settings.level_time ? settings.level_time : 20) * 60,
        blinds_structure: data.blinds_structure || JSON.parse(JSON.stringify(defaultBlinds))
      };

      db.tournaments.push(newTour);
      broadcastState();
    }
  });

  socket.on('start_tour', (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.entries >= 6 && t.dealer_assigned && t.status === 'paused') {
      t.status = 'running'; broadcastState();
    }
  });

  socket.on('pause_tour', (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.status === 'running') {
      t.status = 'paused'; broadcastState();
    }
  });

  socket.on('next_level', (tourId) => {
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
  });

  socket.on('prev_level', (tourId) => {
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
  });

  socket.on('sell_ticket', (payload, callback) => {
    const { tour_id, member_phone, is_paid, buy_in_amount } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (!t) return;

    const member = db.members.find(m => m.phone === member_phone);
    if (!member) {
      if(callback) callback({ success: false, code: 'MEMBER_NOT_FOUND', message: 'KHÁCH CHƯA ĐĂNG KÝ HỘI VIÊN' });
      return;
    }

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

    const assigned_table = t.tables[t.entries % t.tables.length];
    t.players.push({ phone: member_phone, name: member.name, status: 'alive', table_id: assigned_table });
    
    t.entries += 1;
    const amount = Number(buy_in_amount) || 0;
    
    member.total_tours += 1;
    member.play_history = member.play_history || [];
    member.play_history.push({ tour_name: t.name, buy_in_amount: amount, time: Date.now() });

    if (is_paid) {
      t.fund.total_paid += amount;
    } else {
      t.fund.debt += amount;
    }
    t.fund.net_fund = t.fund.total_paid - t.fund.expenses;

    broadcastState();
    if(callback) callback({ success: true, message: `In Vé Thành Công! Giá vé áp dụng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}` });
  });

  socket.on('assign_dealer', (payload) => {
    const table = db.tables.find(tbl => tbl.id === payload.table_id);
    if (table) {
      table.dealer_name = payload.dealer_name;
      table.dealer_time = Date.now();
      const t = db.tournaments.find(t => t.id === payload.tour_id);
      if (t) t.dealer_assigned = true; 
      broadcastState();
    }
  });

  socket.on('move_player_table', (payload) => {
    const { tour_id, player_phone, new_table_id } = payload;
    const t = db.tournaments.find(t => t.id === tour_id);
    if (t) {
      const p = t.players.find(p => p.phone === player_phone && p.status === 'alive');
      if (p) {
        p.table_id = parseInt(new_table_id);
        broadcastState();
      }
    }
  });

  socket.on('bust_out', (payload) => {
    const t = db.tournaments.find(t => t.id === payload.tour_id);
    if (t) {
      const p = t.players.find(p => (p.phone === payload.player_phone || p.name === payload.player_name) && p.status === 'alive');
      if (p) { p.status = 'busted'; broadcastState(); }
    }
  });

  socket.on('end_tour', (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && (t.status === 'running' || t.status === 'paused')) {
      t.status = 'finished';
      t.fund.payout_pool = t.fund.total_paid * 0.85; 
      broadcastState();
    }
  });

  socket.on('reset_tour', (tourId) => {
    const t = db.tournaments.find(t => t.id === tourId);
    if (t && t.status === 'finished') {
      t.status = 'archived';
      db.tables.forEach(table => { if (table.tour_id === tourId) { table.is_locked = false; table.tour_id = null; } });
      broadcastState();
    }
  });
});

server.listen(process.env.PORT || 3000, () => console.log(`[API] Server is running`));

