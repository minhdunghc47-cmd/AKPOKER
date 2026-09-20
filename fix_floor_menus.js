const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

code = code.replace(/function closeAllMenus\(\) \{[\s\S]*?\}/, `
        function closeAllMenus(skipRender = false) { 
            document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('active'));
            activeMenuSeatId = null;
            if(!skipRender && selectedTourId) renderTableView(); 
        }`);

code = code.replace(/else \{ closeAllMenus\(\); menu\.classList\.add\('active'\); activeMenuSeatId = uid; \}/, `
            else { closeAllMenus(true); document.getElementById('menu-'+uid).classList.add('active'); activeMenuSeatId = uid; }
`);

code = code.replace(/if\(activeMenuSeatId === uid\) \{ menu\.classList\.remove\('active'\); activeMenuSeatId = null; \}/, `
            if(activeMenuSeatId === uid) { activeMenuSeatId = null; renderTableView(); }
`);

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed floor closing menus');
