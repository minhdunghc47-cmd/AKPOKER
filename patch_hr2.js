const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

const oldRender = `                    let statusColor = s.status === 'offline' ? 'text-gray-500' : 'text-[#2ecc71]';
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
                        <tr class="\${rowClass}" onclick='editStaff(this.getAttribute("data-staff"))' data-staff='\${JSON.stringify(s).replace(/'/g, "&apos;").replace(/"/g, "&quot;")}' >
                            <td class="p-3 text-gray-400 font-bold">\${s.id}</td>
                            <td class="p-3 \${textNameClass}">\${s.name}</td>
                            <td class="p-3 text-[#d4af37]">\${s.role}</td>
                            <td class="p-3 \${statusColor} uppercase font-bold text-xs">\${statusText}</td>
                            <td class="p-3">\${hours}h</td>
                            <td class="p-3 text-right text-green-400 font-bold">\${new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(salary)}</td>
                        </tr>
                    \`;`;

const newRender = `
                    const isDealer = s.role === 'Dealer' || s.role === 'TD' || s.role === 'Floor';
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
                        <tr class="\${rowClass}" onclick='editStaff(this.getAttribute("data-staff"))' data-staff='\${JSON.stringify(s).replace(/'/g, "&apos;").replace(/"/g, "&quot;")}' >
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

// we have to use regex or split to replace because of string formatting
let idx1 = code.indexOf("let statusColor = s.status === 'offline' ? 'text-gray-500' : 'text-[#2ecc71]';");
let idx2 = code.indexOf("});", idx1);
if (idx1 !== -1 && idx2 !== -1) {
    let before = code.substring(0, idx1);
    let after = code.substring(idx2);
    // Be careful, we just replace the body of the loop
    code = before + newRender + "                " + after;
    fs.writeFileSync('client/hr_management.html', code);
    console.log("Patched hr_management render logic successfully!");
} else {
    console.log("Could not find anchor points.");
}
