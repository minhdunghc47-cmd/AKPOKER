const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

// 1. Add input for dealer bonus
code = code.replace(
    /<input type="number" id="hr-salary" class="w-full bg-\[#1a1a1a\] border border-\[#333\] p-2 rounded text-white focus:border-\[#d4af37\] outline-none" value="50000">/g,
    `<input type="number" id="hr-salary" class="w-full bg-[#1a1a1a] border border-[#333] p-2 rounded text-white focus:border-[#d4af37] outline-none" value="50000">
            </div>
            <div>
                <label class="block text-xs uppercase tracking-widest text-gray-500 mb-1 mt-2">Thưởng chia bài (VNĐ/Giờ) - Tùy chọn</label>
                <input type="number" id="hr-dealer-bonus" class="w-full bg-[#1a1a1a] border border-[#333] p-2 rounded text-white focus:border-[#d4af37] outline-none" value="30000">`
);

// 2. Update table headers
code = code.replace(
    /<th class="p-3 text-right">Lương Tạm Tính<\/th>/g,
    `<th class="p-3">Giờ Chia Bài</th>
                        <th class="p-3 text-right">Tiền Thưởng</th>
                        <th class="p-3 text-right">Tổng Lương</th>`
);

// 3. Update resetStaffForm
code = code.replace(
    /document\.getElementById\('hr-salary'\)\.value = '50000';/g,
    "document.getElementById('hr-salary').value = '50000';\n            document.getElementById('hr-dealer-bonus').value = '30000';"
);

// 4. Update editStaff
code = code.replace(
    /document\.getElementById\('hr-salary'\)\.value = s\.base_salary;/g,
    "document.getElementById('hr-salary').value = s.base_salary;\n            document.getElementById('hr-dealer-bonus').value = s.dealer_bonus || '30000';"
);

// 5. Update submitStaff payload
code = code.replace(
    /base_salary: document\.getElementById\('hr-salary'\)\.value,/g,
    "base_salary: document.getElementById('hr-salary').value,\n                dealer_bonus: document.getElementById('hr-dealer-bonus').value,"
);

fs.writeFileSync('client/hr_management.html', code);
console.log('Patched hr_management.html forms and headers');
