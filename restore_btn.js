const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

const btnGroup = `<div class="flex gap-4">
            <button class="px-6 py-2 bg-[#800020] hover:bg-[#a00020] text-gray-300 font-bold rounded uppercase text-sm tracking-widest transition-colors" onclick="manualSeed()">
                <i class="fa-solid fa-seedling mr-2"></i> TẠO 20 NV MẪU
            </button>
            <a href="./index.html" class="px-6 py-2 bg-[#222] hover:bg-[#333] text-gray-300 font-bold rounded uppercase text-sm tracking-widest transition-colors">`;

code = code.replace(/<div class="flex gap-4">\s*<a href="\.\/index\.html"/, btnGroup);

const manualSeedScript = `
        function manualSeed() {
            if(confirm('CẢNH BÁO: Thao tác này sẽ TẠO LẠI 20 nhân viên mẫu. Bạn có chắc chắn?')) {
                socket.emit('seed_staff_data', (res) => {
                    alert(res.message);
                });
            }
        }
        
        socket.on('connect', () => {`;
code = code.replace(/socket\.on\('connect', \(\) => \{/, manualSeedScript);

fs.writeFileSync('client/hr_management.html', code);
