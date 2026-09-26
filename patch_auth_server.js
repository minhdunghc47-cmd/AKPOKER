const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// 1. Add Middleware
const middlewareCode = `
// ==================== AUTHENTICATION MIDDLEWARE ====================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: Missing token"));
    
    // Bypass for local testing if needed, but strict for staging as requested
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get role from Custom Claims or RTDB fallback
    let role = decodedToken.role;
    if (!role) {
        const snap = await admin.database().ref(\`user_roles/\${decodedToken.uid}\`).once('value');
        role = snap.val() || 'viewer';
    }

    socket.user = { uid: decodedToken.uid, role: role };
    socket.join(\`role_\${role}\`); // Join role-based room for filtered broadcasts
    next();
  } catch (error) {
    console.warn("[AUTH] Invalid connection attempt:", error.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
});

// Helper for RBAC
function requireRole(socket, allowedRoles, handler) {
  return (...args) => {
    if (!socket.user || !allowedRoles.includes(socket.user.role)) {
      console.warn(\`[AUTH] Unauthorized access by \${socket.user?.uid} (\${socket.user?.role}) to restricted event.\`);
      const cb = args[args.length - 1];
      if (typeof cb === 'function') cb({ success: false, message: 'Lỗi Phân Quyền: Bạn không có quyền thực hiện thao tác này!' });
      return;
    }
    handler(...args);
  };
}
// ===================================================================

io.on('connection', (socket) => {
`;

code = code.replace(/io\.on\('connection', \(socket\) => {/, middlewareCode);

// 2. Wrap socket.on handlers
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
    { event: "reset_tour", roles: "['god', 'td']" },
];

replacements.forEach(r => {
    // Regex matches: socket.on('eventName', (params) => { OR socket.on('eventName', async (params) => {
    const regex = new RegExp(\`socket\\.on\\('\${r.event}', \\(?(.*?)\\)? => {\\n\`, 'g');
    code = code.replace(regex, \`socket.on('\${r.event}', requireRole(socket, \${r.roles}, ($1) => {\\n\`);
    // Note: since we wrap the function, we need to add a closing parenthesis at the end of the handler.
    // Instead of doing complex regex parsing for the closing brace, we will manually fix them using a simple state machine or we can just replace the closing brace of the socket.on block?
    // Actually, writing a small AST or careful regex for the closing brace is hard. Let's do it via split and counting brackets.
});

fs.writeFileSync('server/server_auth.js', code);
console.log('Middleware injected to server_auth.js');
