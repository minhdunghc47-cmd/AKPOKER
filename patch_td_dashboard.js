const fs = require('fs');
let code = fs.readFileSync('client/td_dashboard.html', 'utf8');

code = code.replace(
    /if \(Number\(currentLvlNum\) <= lateRegLvl\) {/g,
    'if (Number(currentLvlNum) < lateRegLvl) {'
);

code = code.replace(
    /const remaining = lateRegLvl - Number\(currentLvlNum\) \+ 1;/g,
    'const remaining = lateRegLvl - Number(currentLvlNum);'
);

fs.writeFileSync('client/td_dashboard.html', code);
console.log('Patched td_dashboard.html Late Reg logic');
