const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// Left Column
code = code.replace(
    /<!-- LEFT COL: STATS -->\s*<div class="w-\[25%\]/g,
    '<!-- LEFT COL: STATS -->\n        <div class="w-[23%]"'
);

// Center Column
code = code.replace(
    /<!-- CENTER COL: CLOCK -->\s*<div class="w-\[50%\]/g,
    '<!-- CENTER COL: CLOCK -->\n        <div class="w-[45%]"'
);

// Right Column
code = code.replace(
    /<!-- RIGHT COL: DYNAMIC PRIZE\/WATERMARK -->\s*<div class="w-\[25%\]/g,
    '<!-- RIGHT COL: DYNAMIC PRIZE/WATERMARK -->\n        <div class="w-[32%]"'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched columns width');
