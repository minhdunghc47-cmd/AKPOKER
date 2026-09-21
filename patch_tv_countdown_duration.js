const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(
    /totalRemainingSec \+= \(Number\(b\.duration\) \|\| 0\) \* 60;/g,
    'totalRemainingSec += (Number(b.duration_minutes) || 0) * 60;'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Fixed duration property to duration_minutes');
