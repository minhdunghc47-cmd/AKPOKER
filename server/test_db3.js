const admin = require('firebase-admin');
const serviceAccount = require('../acepoker-1991-firebase-adminsdk-fbsvc-bba2c12ea1.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://acepoker-1991.firebaseio.com"
});
const db = app.database();

console.log("Fetching from /");
db.ref('/').once('value')
  .then(s => {
    console.log("Data:", !!s.val());
    process.exit(0);
  })
  .catch(e => {
    console.error("Error:", e);
    process.exit(1);
  });
