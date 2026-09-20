const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const preferredArrayDef = `\nconst PREFERRED_SEAT_ORDER = [1, 3, 5, 7, 9, 2, 4, 6, 8];\n`;

// Only add if not exists
if (!code.includes('PREFERRED_SEAT_ORDER')) {
    // We can just put it near the top, after db definition
    code = code.replace(/let db = \{/, preferredArrayDef + 'let db = {');
}

// 1. Patch sell_ticket loop
code = code.replace(
    /for\s*\(\s*let\s*i\s*=\s*1\s*;\s*i\s*<=\s*9\s*;\s*i\+\+\s*\)\s*\{/g,
    'for (let i of PREFERRED_SEAT_ORDER) {'
);

fs.writeFileSync('server/server.js', code);
console.log('Patched seating order loops');
