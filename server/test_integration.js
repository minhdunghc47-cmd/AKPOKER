const proxyquire = require('proxyquire').noCallThru();
const Client = require('socket.io-client');

const adminStub = {
  initializeApp: () => {},
  apps: [],
  credential: { cert: () => {} },
  auth: () => ({
    verifyIdToken: async (token) => {
      const now = Math.floor(Date.now() / 1000);
      if (token === 'VALID_TOKEN_GOD') return { uid: 'u1', role: 'god', exp: now + 3600 };
      if (token === 'VALID_TOKEN_TD') return { uid: 'u2', role: 'td', exp: now + 3600 };
      if (token === 'VALID_TOKEN_TV') return { uid: 'u3', role: 'tv', exp: now + 3600 };
      if (token === 'VALID_TOKEN_KIOSK') return { uid: 'u4', role: 'kiosk', exp: now + 3600 };
      if (token === 'EXPIRING_TOKEN_TD') return { uid: 'u5', role: 'td', exp: now + 1 }; 
      if (token === 'NO_ROLE_TOKEN') return { uid: 'u7', exp: now + 3600 };
      if (token === 'ADMIN2_TOKEN') return { uid: 'u8', role: 'admin2', exp: now + 3600 };
      throw new Error("Invalid token");
    }
  }),
  database: () => ({
    ref: (path) => ({
      once: async () => ({ val: () => null }), 
      set: async () => {} 
    })
  })
};

process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
process.env.PORT = 3007;

require('module').Module._cache = {}; 
const server = proxyquire('./server.js', {
  'firebase-admin': adminStub
});

const port = 3007;

async function runTests() {
  console.log("Starting Rigorous Integration Tests on REAL server.js...");
  let passed = 0;
  let failed = 0;

  function check(name, condition, resultObj = {}) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`, resultObj);
      failed++;
    }
  }

  // Seed Data Setup using GOD role
  await new Promise(resolve => {
    const god = Client(`http://localhost:${port}`, { auth: { token: 'VALID_TOKEN_GOD' } });
    god.on('connect', () => {
        god.emit('add_staff', { id: 's99', name: 'Secret Staff', pin: 'SECRET_PIN_123', cccd: 'CCCD123', base_salary: 5000000 }, () => {
            god.emit('register_member', { phone: '0987654321', name: 'Rich Member', bank_account: 'BANK123', address: 'SECRET_ADDRESS' }, () => {
               god.emit('create_tour', { name: 'Test Tour', selectedTableIds: [1], settings: { level_time: 10 }, starting_stack: 10000, buy_in_fee: 100 });
               setTimeout(() => { god.disconnect(); setTimeout(resolve, 300); }, 300);
            });
        });
    });
  });

  await new Promise(resolve => {
    const client = Client(`http://localhost:${port}`, { auth: { token: 'NO_ROLE_TOKEN' } });
    client.on('connect_error', (err) => {
      check('Kết nối bị từ chối khi không có Role', err.message.includes('không hợp lệ hoặc bị từ chối'));
      client.disconnect();
      resolve();
    });
  });

  await new Promise(resolve => {
    const client = Client(`http://localhost:${port}`, { auth: { token: 'ADMIN2_TOKEN' } });
    client.on('connect_error', (err) => {
      check('Kết nối bị từ chối khi Role = admin2 (Không trong whitelist)', err.message.includes('không hợp lệ hoặc bị từ chối'));
      client.disconnect();
      resolve();
    });
  });

  await new Promise(resolve => {
    const client = Client(`http://localhost:${port}`, { auth: { token: 'VALID_TOKEN_KIOSK' } });
    let gotTours = false;
    let gotMembers = false;
    client.on('update_tours', () => gotTours = true);
    client.on('update_members', () => gotMembers = true);
    client.on('update_staff_list', (data) => {
       const hasPin = data.some(s => s.pin !== undefined);
       check('Kiosk nhận update_staff_list KHÔNG chứa PIN', !hasPin);
    });
    client.on('connect', () => {
       client.emit('request_initial_data');
       setTimeout(() => {
           check('Kiosk KHÔNG nhận được danh sách Giải', !gotTours);
           check('Kiosk KHÔNG nhận được danh sách Khách hàng', !gotMembers);
           client.disconnect();
           resolve();
       }, 500);
    });
  });

  await new Promise(resolve => {
    const client = Client(`http://localhost:${port}`, { auth: { token: 'VALID_TOKEN_TV' } });
    let checkedTours = false;
    client.on('update_tours', (tours) => {
       if (tours.length > 0) {
           checkedTours = true;
           const t = tours[0];
           const noFundSensitive = t.fund && t.fund.total_paid === undefined && t.fund.debt === undefined;
           check('TV nhận update_tours nhưng KHÔNG chứa các trường quỹ nội bộ', noFundSensitive);
           const noPlayerNames = t.players && t.players.every(p => p.phone === undefined && p.name === undefined);
           check('TV nhận mảng players nhưng KHÔNG chứa sđt hay tên', noPlayerNames);
       }
    });
    client.on('update_staff_list', (data) => {
       const hasPin = data.some(s => s.pin !== undefined);
       check('TV nhận update_staff_list KHÔNG chứa PIN', !hasPin);
    });
    client.on('connect', () => {
       client.emit('request_initial_data');
       setTimeout(() => {
           check('TV đã check dữ liệu tours', checkedTours);
           client.disconnect();
           resolve();
       }, 500);
    });
  });

  await new Promise(resolve => {
    const client = Client(`http://localhost:${port}`, { auth: { token: 'VALID_TOKEN_GOD' } });
    client.on('update_staff_list', (data) => {
       const hasPin = data.some(s => s.pin !== undefined);
       check('Kể cả GOD nhận update_staff_list cũng KHÔNG chứa PIN (Cleartext)', !hasPin);
    });
    client.on('connect', () => {
       client.emit('request_initial_data');
       setTimeout(() => {
           client.disconnect();
           resolve();
       }, 500);
    });
  });

  await new Promise(resolve => {
    const client = Client(`http://localhost:${port}`, { auth: { token: 'EXPIRING_TOKEN_TD' } });
    let disconnected = false;
    client.on('disconnect', () => {
        disconnected = true;
    });
    client.on('connect', () => {
       setTimeout(() => {
           // Don't pass a callback since server disconnects immediately, just emit and wait for disconnect event
           client.emit('create_tour', { name: 'Should Fail' });
           setTimeout(() => {
               check('Socket hết hạn bị ép ngắt kết nối (force disconnect)', disconnected);
               client.disconnect();
               resolve();
           }, 300);
       }, 1500);
    });
  });

  console.log(`\n--- Test Results: ${passed} Passed | ${failed} Failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

setTimeout(runTests, 1000); 
