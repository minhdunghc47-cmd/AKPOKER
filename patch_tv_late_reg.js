const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(
    /const isLateRegClosed = \(currentLvlNum >= lateRegLvlNum\);/g,
    "const isLateRegClosed = (currentLvlNum >= lateRegLvlNum) || tour.status === 'finished';"
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched main_tv.html for late reg closed logic');
