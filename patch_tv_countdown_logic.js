const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// Update isLateRegClosed logic
code = code.replace(
    /const isLateRegClosed = \(currentLvlNum > lateRegLvlNum\);/g,
    'const isLateRegClosed = (currentLvlNum >= lateRegLvlNum);'
);

// Update loop break logic
code = code.replace(
    /if \(!b\.is_break && b\.level > lateRegLvlNum\) {/g,
    'if (!b.is_break && b.level >= lateRegLvlNum) {'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched Late Reg logic to close at the START of the lateRegLvlNum');
