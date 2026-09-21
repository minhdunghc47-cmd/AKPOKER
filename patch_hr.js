const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

// 1. Add input for dealer bonus
code = code.replace(
    /<input type="number" id="hr-salary" class="w-full bg-\[#1a1a1a\] border border-\[#333\] p-2 rounded text-white focus:border-\[#d4af37\] outline-none" value="50000">\n\s*<\/div>/,
    `<input type="number" id="hr-salary" class="w-full bg-[#1a1a1a] border border-[#333] p-2 rounded text-white focus:border-[#d4af37] outline-none" value="50000">
            </div>
            <div>
                <label class="block text-xs uppercase tracking-widest text-gray-500 mb-1 mt-2">Thưởng chia bài (VNĐ/Giờ) - Tùy chọn</label>
                <input type="number" id="hr-dealer-bonus" class="w-full bg-[#1a1a1a] border border-[#333] p-2 rounded text-white focus:border-[#d4af37] outline-none" value="30000">
            </div>`
);

// 2. Update table headers
code = code.replace(
    /<th class="p-3 text-right">Lương Tạm Tính<\/th>/,
    `<th class="p-3">Giờ Chia Bài</th>
                        <th class="p-3 text-right">Thưởng Bài</th>
                        <th class="p-3 text-right">Tổng Lương</th>`
);

// 3. Update resetStaffForm
code = code.replace(
    /document\.getElementById\('hr-salary'\)\.value = '50000';/,
    "document.getElementById('hr-salary').value = '50000';\n            document.getElementById('hr-dealer-bonus').value = '30000';"
);

// 4. Update editStaff
code = code.replace(
    /document\.getElementById\('hr-salary'\)\.value = s\.base_salary;/,
    "document.getElementById('hr-salary').value = s.base_salary;\n            document.getElementById('hr-dealer-bonus').value = s.dealer_bonus || '30000';"
);

// 5. Update submitStaff payload
code = code.replace(
    /base_salary: document\.getElementById\('hr-salary'\)\.value,/,
    "base_salary: document.getElementById('hr-salary').value,\n                dealer_bonus: document.getElementById('hr-dealer-bonus').value,"
);

// 6. Update table rendering logic inside update_staff_list
const newRenderLogic = `
                    const isDealer = s.role === 'Dealer' || s.role === 'TD' || s.role === 'Floor'; // Đề phòng floor/TD cũng phải chia
                    const baseSalary = (s.total_minutes / 60) * s.base_salary;
                    
                    let dealingHours = 0;
                    let dealingMins = 0;
                    let dealingBonus = 0;
                    
                    if (s.total_dealing_ms) {
                        const totalMins = Math.floor(s.total_dealing_ms / 60000);
                        dealingHours = Math.floor(totalMins / 60);
                        dealingMins = totalMins % 60;
                        dealingBonus = (totalMins / 60) * (s.dealer_bonus || 30000);
                    }
                    
                    const totalSalary = baseSalary + dealingBonus;
                    
                    const timeDealingStr = s.total_dealing_ms ? \`\${dealingHours}h \${dealingMins}m\` : '-';
                    const bonusStr = s.total_dealing_ms ? new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(dealingBonus) : '-';

                    let statusColor = s.status === 'offline' ? 'text-gray-500' : 'text-[#2ecc71]';
                    if(s.status === 'waiting') statusColor = 'text-[#d4af37]';
                    let statusText = s.status;
                    
                    let rowClass = "border-b border-[#222] hover:bg-[#333] cursor-pointer transition-colors";
                    let textNameClass = "text-white";
                    
                    if (isResigned) {
                        rowClass += " opacity-50";
                        statusText = "ĐÃ THÔI VIỆC";
                        statusColor = "text-red-500";
                        textNameClass = "text-gray-500";
                    }
                    
                    tbody.innerHTML += \`
                        <tr class="\${rowClass}" onclick='editStaff(this.getAttribute("data-staff"))' data-staff='\${JSON.stringify(s).replace(/'/g, "&apos;").replace(/"/g, "&quot;")}'>
                            <td class="p-3 text-gray-400 font-bold">\${s.id}</td>
                            <td class="p-3 \${textNameClass}">\${s.name}</td>
                            <td class="p-3 text-[#d4af37]">\${s.role}</td>
                            <td class="p-3 \${statusColor} uppercase font-bold text-xs">\${statusText}</td>
                            <td class="p-3 text-blue-400 font-bold">\${hours}h</td>
                            <td class="p-3 text-yellow-500">\${timeDealingStr}</td>
                            <td class="p-3 text-right text-yellow-500 font-bold">\${bonusStr}</td>
                            <td class="p-3 text-right text-green-400 font-bold text-lg">\${new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(totalSalary)}</td>
                        </tr>
                    \`;
`;

// we need to replace from `let statusColor` down to `</tr>`
// Let's replace the whole block carefully.
