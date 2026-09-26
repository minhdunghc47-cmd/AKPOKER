const fs = require('fs');
const testCode = `
const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');

const admin = {
  auth: () => ({
    verifyIdToken: async (token) => {
      if (token === 'VALID_TOKEN_GOD') return { uid: 'u1', role: 'god' };
      if (token === 'VALID_TOKEN_TD') return { uid: 'u2', role: 'td' };
      if (token === 'VALID_TOKEN_GUEST') return { uid: 'u3' };
      throw new Error("Invalid token");
    }
  }),
  database: () => ({
    ref: (path) => ({
      once: async () => ({ val: () => 'viewer' })
    })
  })
};

const httpServer = createServer();
const io = new Server(httpServer);

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
    next(new Error("Authentication error: Invalid or expired token"));
  }
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
    socket.on('create_tour', requireRole(socket, ['god', 'td'], (data, cb) => {
        cb({ success: true, message: 'Created!' });
    }));
    socket.on('add_staff', requireRole(socket, ['god'], (data, cb) => {
        cb({ success: true, message: 'Staff added!' });
    }));
});

httpServer.listen(() => {
  const port = httpServer.address().port;
  
  const test1 = new Promise((resolve) => {
      const client = Client('http://localhost:' + port);
      client.on('connect_error', (err) => {
          console.log('Test 1 (No token): PASS - ' + err.message);
          client.disconnect();
          resolve();
      });
  });

  const test2 = new Promise((resolve) => {
      const client = Client('http://localhost:' + port, { auth: { token: 'INVALID' } });
      client.on('connect_error', (err) => {
          console.log('Test 2 (Invalid token): PASS - ' + err.message);
          client.disconnect();
          resolve();
      });
  });

  const test3 = new Promise((resolve) => {
      const client = Client('http://localhost:' + port, { auth: { token: 'VALID_TOKEN_TD' } });
      client.on('connect', () => {
          console.log('Test 3 (Valid TD token): Connected');
          client.emit('create_tour', {}, (res) => {
              console.log('Test 3.1 (Valid Role TD -> create_tour):', res.success ? 'PASS' : 'FAIL');
              
              client.emit('add_staff', {}, (res2) => {
                  console.log('Test 3.2 (Invalid Role TD -> add_staff):', res2.success === false ? 'PASS' : 'FAIL', res2.message);
                  client.disconnect();
                  resolve();
              });
          });
      });
  });

  Promise.all([test1, test2, test3]).then(() => {
      httpServer.close();
      console.log('All tests finished.');
  });
});
`;
fs.writeFileSync('test_auth.js', testCode);
