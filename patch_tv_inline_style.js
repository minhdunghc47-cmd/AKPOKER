const fs = require('fs');
let code = fs.readFileSync('client/main_tv.html', 'utf8');

// Container
code = code.replace(
    /const containerStyle = isTop1\n\s*\?\s*'flex items-center w-full px-4 py-4/g,
    "const containerStyle = isTop1\n                        ? 'flex items-center w-full px-4 py-4"
);

// Rank column
code = code.replace(
    /<div class="\${rankStyle}">\${rankContent}<\/div>/g,
    '<div class="${rankStyle}" style="flex-shrink: 0;">${rankContent}</div>'
);

// Amount column
code = code.replace(
    /<div class="\${amountStyle}">\${formatMoney\(p.amount\)} <span class="\${amountSymbolStyle}">₫<\/span><\/div>/g,
    '<div class="${amountStyle}" style="flex-shrink: 0;">${formatMoney(p.amount)} <span class="${amountSymbolStyle}">₫</span></div>'
);

// Name Column (we need to inject style="flex: 1 1 0%; min-width: 0;" inside nameHtml)
code = code.replace(
    /nameHtml = \`<div class="\${nameStyle}">\${bustedName}<\/div>\`;/g,
    'nameHtml = `<div class="${nameStyle}" style="flex: 1 1 0%; min-width: 0;">${bustedName}</div>`;'
);

code = code.replace(
    /nameHtml = \`<div class="flex-1 mx-4 border-b-2 border-dashed border-\[#333\] opacity-70"><\/div>\`;/g,
    'nameHtml = `<div class="mx-4 border-b-2 border-dashed border-[#333] opacity-70" style="flex: 1 1 0%; min-width: 0;"></div>`;'
);

fs.writeFileSync('client/main_tv.html', code);
console.log('Added inline styles for strict flexbox rendering');
