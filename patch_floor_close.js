const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

code = code.replace(/function closeAllMenus\(\) \{([\s\S]*?)\}/, "function closeAllMenus() { $1 renderTableView(); }");
code = code.replace(/function closeDealerModal\(\) \{([\s\S]*?)\}/, "function closeDealerModal() { $1 renderTableView(); }");
code = code.replace(/function closeMoveModal\(\) \{([\s\S]*?)\}/, "function closeMoveModal() { $1 renderTableView(); }");

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Patched floor closing menus');
