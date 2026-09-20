const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

code = code.replace(
    /text-gray-400 font-bold tracking-widest uppercase text-sm mb-2/g,
    'text-gray-400 font-bold tracking-widest uppercase text-[clamp(1rem,1.2vw,1.5rem)] mb-2'
);

code = code.replace(
    /font-teko text-6xl text-gold/g,
    'font-teko text-[clamp(4rem,4.5vw,6rem)] text-gold'
);

code = code.replace(
    /text-center text-gray-500 font-bold tracking-widest text-xs mb-4/g,
    'text-center text-gray-500 font-bold tracking-widest text-[clamp(0.8rem,1vw,1.2rem)] mb-4'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Patched Prize Pool scalable fonts');
