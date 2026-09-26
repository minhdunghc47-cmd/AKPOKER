const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const middlewareCode = `
// ==================== AUTHENTICATION MIDDLEWARE ====================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: Missing token"));
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    let role = decodedToken.role;
    if (!role) {
        const snap = await admin.database().ref('user_roles/' + decodedToken.uid).once('value');
        role = snap.val() || 'viewer';
    }

    socket.user = { uid: decodedToken.uid, role: role };
    socket.join('role_' + role);
    next();
  } catch (error) {
    console.warn("[AUTH] Invalid connection attempt:", error.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
});

function requireRole(socket, allowedRoles, handler) {
  return (...args) => {
    if (!socket.user || !allowedRoles.includes(socket.user.role)) {
      console.warn("[AUTH] Unauthorized access by " + (socket.user ? socket.user.uid : 'unknown') + " for restricted event.");
      const cb = args[args.length - 1];
      if (typeof cb === 'function') cb({ success: false, message: 'Lỗi Phân Quyền!' });
      return;
    }
    handler(...args);
  };
}
// ===================================================================

io.on('connection', (socket) => {
`;

code = code.replace(/io\.on\('connection', \(socket\) => {/, middlewareCode);

const replacements = [
    { event: "request_initial_data", roles: "['god', 'td', 'floor', 'cashier', 'kiosk', 'tv']" },
    { event: "add_staff", roles: "['god']" },
    { event: "save_template", roles: "['god', 'td']" },
    { event: "update_staff", roles: "['god']" },
    { event: "resign_staff", roles: "['god']" },
    { event: "clock_in", roles: "['god', 'kiosk']" },
    { event: "clock_out", roles: "['god', 'kiosk']" },
    { event: "register_member", roles: "['god', 'cashier']" },
    { event: "update_member", roles: "['god', 'cashier']" },
    { event: "create_tour", roles: "['god', 'td']" },
    { event: "start_tour", roles: "['god', 'td']" },
    { event: "pause_tour", roles: "['god', 'td']" },
    { event: "next_level", roles: "['god', 'td']" },
    { event: "prev_level", roles: "['god', 'td']" },
    { event: "sell_ticket", roles: "['god', 'cashier']" },
    { event: "add_table_to_tour", roles: "['god', 'td', 'floor']" },
    { event: "remove_table_from_tour", roles: "['god', 'td', 'floor']" },
    { event: "unassign_dealer", roles: "['god', 'td', 'floor']" },
    { event: "assign_dealer", roles: "['god', 'td', 'floor']" },
    { event: "move_player_table", roles: "['god', 'td', 'floor']" },
    { event: "bust_out", roles: "['god', 'td', 'floor']" },
    { event: "adjust_time", roles: "['god', 'td']" },
    { event: "force_edit_stats", roles: "['god', 'td']" },
    { event: "end_tour", roles: "['god', 'td']" },
    { event: "reset_tour", roles: "['god', 'td']" }
];

// We will use a script to accurately wrap the callbacks in server.js without messing up brackets
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    for (let r of replacements) {
        // match "socket.on('event', (payload) => {" or "socket.on('event', () => {"
        let regex = new RegExp("^\\s*socket\\.on\\('" + r.event + "', \\(?(.*?)\\)? => \\{");
        if (regex.test(lines[i])) {
            lines[i] = lines[i].replace(regex, "  socket.on('" + r.event + "', requireRole(socket, " + r.roles + ", ($1) => {");
            
            // Now we need to find the matching closing bracket for this socket.on
            let openBrackets = 0;
            let foundStart = false;
            for (let j = i; j < lines.length; j++) {
                // Count brackets naive approach
                for (let c of lines[j]) {
                    if (c === '{') { openBrackets++; foundStart = true; }
                    if (c === '}') openBrackets--;
                }
                if (foundStart && openBrackets === 0) {
                    // This is the closing bracket of the socket.on handler
                    // We need to add a closing parenthesis for requireRole
                    lines[j] = lines[j].replace('});', '}));');
                    break;
                }
            }
        }
    }
}

// 3. Update broadcastState
let newBroadcastState = `
function broadcastState(skipSave = false) {
  if (!isFirebaseLoaded) return;
  const activeTours = db.tournaments.filter(t => t.status !== 'archived');
  
  // Create a safe version of staff without PINs
  const safeStaff = db.staff.map(s => {
      const copy = { ...s };
      delete copy.pin;
      delete copy.cccd;
      return copy;
  });

  // Basic broadcast for everyone (TV, Kiosk)
  io.emit('update_tours', activeTours);
  
  // Specific roles get full tables and members
  io.to('role_god').to('role_td').to('role_floor').to('role_cashier').emit('update_tables', db.tables);
  io.to('role_god').to('role_cashier').emit('update_members', db.members);
  
  // God mode gets EVERYTHING including finances and raw staff list
  io.to('role_god').emit('update_god_mode', {
    financial: db.financial || { net_cash: 0, total_debt: 0, total_rake: 0 },
    staff: db.staff, 
    all_tours: db.tournaments
  });
  
  // Safe staff list to others
  io.to('role_td').to('role_floor').to('role_cashier').to('role_kiosk').emit('update_staff_list', safeStaff);
  io.to('role_god').emit('update_staff_list', db.staff); // God gets the real one

  if (!skipSave) {
    saveToFirebase('tournaments', db.tournaments);
    saveToFirebase('tour_templates', db.tour_templates);
    saveToFirebase('members', db.members);
    saveToFirebase('staff', db.staff);
    saveToFirebase('time_logs', db.time_logs);
    saveToFirebase('tables', db.tables);
  }
}
`;

// Replace the old broadcastState
let resCode = lines.join('\n');
resCode = resCode.replace(/function broadcastState\(skipSave = false\) \{[\s\S]*?saveToFirebase\('tables', db\.tables\);\n  \}\n\}/m, newBroadcastState.trim());

fs.writeFileSync('server/server.js', resCode);
console.log('Middleware and broadcast filtering injected to server.js');
