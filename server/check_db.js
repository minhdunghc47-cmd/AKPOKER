const admin = require('firebase-admin');
const serviceAccount = require('../acepoker-1991-firebase-adminsdk-fbsvc-bba2c12ea1.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://acepoker-1991.firebaseio.com"
});
const db = app.database();

db.ref('/').once('value')
  .then(s => {
    const data = s.val();
    console.log("tables type:", typeof data.tables);
    console.log("tables isArray:", Array.isArray(data.tables));
    console.log("tables length:", data.tables ? data.tables.length : "null/undefined");
    console.log("tables content:", data.tables);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
