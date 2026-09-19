const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. KHỞI TẠO FIREBASE ADMIN SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<YOUR_DATABASE_NAME>.firebaseio.com" // Hãy thay bằng URL thật của sòng
  });
  console.log('[FIREBASE] Đã kết nối Firebase thành công!');
} catch (error) {
  console.warn('[FIREBASE] Chưa tìm thấy serviceAccountKey.json hoặc cấu hình lỗi. Chạy tạm trên RAM.');
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
  staff: [], time_logs: [],
  members: []
};

// 2. ĐỒNG BỘ TỪ FIREBASE XUỐNG RAM KHI KHỞI ĐỘNG
if (fdb) {
  fdb.ref('/').once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.tournaments) db.tournaments = data.tournaments;
      if (data.members) db.members = data.members;
      console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');
    }
  });
} else {
  // Generate 20 test accounts if no DB
  for (let i = 1; i <= 20; i++) {
    db.members.push({
      phone: '09990000' + (i < 10 ? '0' + i : i),
      name: 'Test ' + i,
      dob: '1990-01-01',
      address: 'Casino Resort',
      bank_account: '123123123',
      bank_name: 'VPBank',
      avatar_base64: null,
      play_history: [],
      total_tours: 0
    });
  }
}

function saveToFirebase(path, data) {
  if (fdb) {
    fdb.ref(path).set(data).catch(err => console.error('[FIREBASE] Lỗi ghi data:', err));
  }
}

function broadcastState() {
  const activeTours = db.tournaments.filter(t => t.status !== 'archived');
  io.emit('update_tours', activeTours);
  io.emit('update_tables', db.tables);
  io.emit('update_staff_list', db.staff);
  io.emit('update_members', db.members);

  let total_net_cash = 0, total_debt = 0, total_rake = 0;
  db.tournaments.forEach(t => {
    total_net_cash += t.fund.total_paid;
    total_debt += t.fund.debt;
    total_rake += t.fund.total_paid * 0.15;
  });

  io.emit('update_god_mode', {
    financial: { net_cash: total_net_cash, total_debt: total_debt, total_rake: total_rake },
    staff: db.staff,
    all_tours: db.tournaments
  });
  
  // Real-time Backup lên Cloud
  saveToFirebase('tournaments', db.tournaments);
  saveToFirebase('members', db.members);
}

// TIMER ENGINE (Đã tối ưu không ghi đè Firebase mỗi giây)
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
    broadcastState(); // Sự kiện lớn (đổi level) mới broadcast và sync Firebase
  } else {
    // Chỉ broadcast socket để cập nhật UI, không sync DB
    const activeTours = db.tournaments.filter(t => t.status !== 'archived');
    io.emit('update_tours', activeTours);
  }
}, 1000);


io.on('connection', (socket) => {
  broadcastState();

  
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
    const { name, selectedTableIds, settings, starting_stack } = data;
    const tablesToLock = db.tables.filter(t => selectedTableIds.includes(t.id));
    const canLock = tablesToLock.every(t => !t.is_locked);

    if (canLock && name && selectedTableIds.length > 0) {
      const tourId = 'T' + Date.now();
      tablesToLock.forEach(t => { t.is_locked = true; t.tour_id = tourId; });
      
      const newTour = {
        id: tourId, name: name, tables: selectedTableIds, entries: 0, dealer_assigned: false,
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

    // CRM Rule
    const member = db.members.find(m => m.phone === member_phone);
    if (!member) {
      if(callback) callback({ success: false, code: 'MEMBER_NOT_FOUND', message: 'KHÁCH CHƯA ĐĂNG KÝ HỘI VIÊN' });
      return;
    }

    // Global Anti-Ghosting Rule
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

    // Assign table
    const assigned_table = t.tables[t.entries % t.tables.length];
    t.players.push({ phone: member_phone, name: member.name, status: 'alive', table_id: assigned_table });
    
    t.entries += 1;
    const amount = Number(buy_in_amount) || 0;
    
    // Update CRM Play History
    member.total_tours += 1;
    member.play_history = member.play_history || [];
    member.play_history.push({ tour_name: t.name, buy_in_amount: amount, time: Date.now() });

    // CRITICAL RULE: QUỸ & CÔNG NỢ (Bóc tách Paid và Unpaid)
    if (is_paid) {
      t.fund.total_paid += amount;
    } else {
      t.fund.debt += amount;
    }
    // Net Fund (Quỹ thực tế) = Tiền mặt thực thu - Chi phí tổ chức
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
