const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// Add isFirebaseLoaded
code = code.replace(/const admin = require\('firebase-admin'\);/, "const admin = require('firebase-admin');\nlet isFirebaseLoaded = false;");

// Mark as loaded when done
code = code.replace(
    /console\.log\('\\[FIREBASE\\] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!'\);/,
    "console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');\n      isFirebaseLoaded = true;"
);
// Also mark if error or null data?
code = code.replace(
    /if \(data\) \{/,
    "if (data) {"
);
// Actually if data is null (first time), we still need to set isFirebaseLoaded = true
code = code.replace(
    /fdb\.ref\('\/'\)\.once\('value', \(snapshot\) => \{[\s\S]*?\}\);/g,
    `fdb.ref('/').once('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.tournaments) db.tournaments = data.tournaments;
      if (data.members) db.members = data.members;
      if (data.staff) db.staff = data.staff;
      if (data.time_logs) db.time_logs = data.time_logs;
      console.log('[FIREBASE] Đã load dữ liệu toàn sòng từ Cloud xuống RAM!');
    } else {
      console.log('[FIREBASE] Database trống, sử dụng RAM rỗng.');
    }
    isFirebaseLoaded = true;
  });`
);

// Disable save if not loaded
code = code.replace(
    /function saveToFirebase\(path, data\) \{[\s\S]*?if \(fdb\) \{/,
    "function saveToFirebase(path, data) {\n  if (fdb && isFirebaseLoaded) {"
);

fs.writeFileSync('server/server.js', code);
