const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const newInitCode = `
try {
  let serviceAccount;
  if (fs.existsSync('/etc/secrets/serviceAccountKey.json')) {
    serviceAccount = require('/etc/secrets/serviceAccountKey.json');
  } else if (fs.existsSync('../serviceAccountKey.json')) {
    serviceAccount = require('../serviceAccountKey.json');
  } else if (fs.existsSync('./serviceAccountKey.json')) {
    serviceAccount = require('./serviceAccountKey.json');
  } else {
    throw new Error('Không tìm thấy file Key');
  }
`;

code = code.replace(/try\s*\{\s*const serviceAccount = require\('\.\/serviceAccountKey\.json'\);/, newInitCode);

fs.writeFileSync('server/server.js', code);
