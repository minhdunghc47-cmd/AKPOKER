const fs = require('fs');
let code = fs.readFileSync('client/cashier.html', 'utf8');

// 1. Insert Receipt Block into the Left Panel
const leftPanelRegex = /<div class="grid grid-cols-1 xl:grid-cols-2 gap-6" id="tv-grid"><\/div>/;
const receiptBlock = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-6" id="tv-grid"></div>
        
        <div class="mt-12 flex flex-col items-center">
            <h2 class="text-lg font-mafia text-[#d4af37] mb-6 tracking-widest uppercase border-b border-gray-800 pb-2 w-full text-center"><i class="fa-solid fa-receipt mr-2"></i> XEM TRƯỚC HÓA ĐƠN</h2>
            
            <div id="receipt-preview" class="bg-white text-black p-4 shadow-[0_0_20px_rgba(212,175,55,0.2)] border-2 border-dashed border-gray-300" style="width: 80mm; font-family: 'Courier New', Courier, monospace;">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: bold;">ACEPOKER</h2>
                    <div style="font-size: 12px; margin-top: 5px;">VÉ THAM DỰ GIẢI ĐẤU</div>
                </div>
                <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
                <div style="font-size: 12px; line-height: 1.6;">
                    <div><strong>Khách:</strong> <span id="rp-name">...</span></div>
                    <div><strong>Giải:</strong> <span id="rp-tour">...</span></div>
                    <div><strong>Buy-in:</strong> <span id="rp-buyin">...</span></div>
                    <div><strong>Thời gian:</strong> <span id="rp-time">...</span></div>
                    <div style="margin-top: 10px;"><strong>Bàn:</strong> ......... <strong>Ghế:</strong> .........</div>
                </div>
                <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
                <div style="text-align: center; font-size: 12px; font-style: italic;">
                    Chúc quý khách may mắn!
                </div>
            </div>
            
            <button class="mt-6 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-gray-300 font-bold px-6 py-3 rounded tracking-widest uppercase text-xs transition" onclick="window.print()">
                <i class="fa-solid fa-print mr-2"></i> CHỈ IN LẠI VÉ
            </button>
        </div>`;
code = code.replace(leftPanelRegex, receiptBlock);

// 2. Add updateReceiptPreview() function
const updateFn = `
        function updateReceiptPreview() {
            const select = document.getElementById('tour-select');
            const phone = document.getElementById('player-search').value.trim();
            const buyIn = document.getElementById('buy-in').value;
            
            const member = currentMembers.find(m => m.phone === phone);
            const tourId = select.value;
            const tour = currentTours.find(t => t.id === tourId);
            
            const name = member ? member.name : (phone || '...');
            const tourName = tour ? tour.name : '...';
            
            const now = new Date();
            const timeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
            
            document.getElementById('rp-name').innerText = name;
            document.getElementById('rp-tour').innerText = tourName;
            document.getElementById('rp-buyin').innerText = buyIn ? new Intl.NumberFormat('vi-VN').format(buyIn) + ' VNĐ' : '...';
            document.getElementById('rp-time').innerText = timeStr;
        }
`;
code = code.replace(/function filterMembers\(\) \{/, updateFn + "\n        function filterMembers() {");

// 3. Bind updateReceiptPreview to input changes
// - Select Tour
code = code.replace(/select\.dispatchEvent\(new Event\('change'\)\);/, "select.dispatchEvent(new Event('change'));\n            updateReceiptPreview();");
// - Change input
code = code.replace(/onkeyup="filterMembers\(\)" onfocus="filterMembers\(\)"/, "onkeyup=\"filterMembers(); updateReceiptPreview();\" onfocus=\"filterMembers(); updateReceiptPreview();\"");
code = code.replace(/id="buy-in" class="input-mafia text-sm font-bold text-emerald-400" placeholder="5000000" value="5000000"/, "id=\"buy-in\" class=\"input-mafia text-sm font-bold text-emerald-400\" placeholder=\"5000000\" value=\"5000000\" oninput=\"updateReceiptPreview()\"");

// 4. Print logic update
// Since we have a live preview, the printReceipt function just needs to call updateReceiptPreview() (to ensure it's up to date) and window.print().
// Actually, printReceipt doesn't need to rebuild the HTML anymore.
const printFnRegex = /function printReceipt\(phone, tourId, amount\) \{[\s\S]*?\}, 300\);\n        \}/;
const newPrintFn = `function printReceipt(phone, tourId, amount) {
            updateReceiptPreview();
            setTimeout(() => {
                window.print();
            }, 300);
        }`;
code = code.replace(printFnRegex, newPrintFn);

// 5. Check CSS for print to make sure it doesn't have issues.
// We previously added CSS. We should just keep it, but ensure we don't 'hidden' the div on screen.
// Wait, my previous `#receipt-preview` CSS for print was:
/*
            #receipt-preview {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
                margin: 0;
                padding: 10px;
                display: block !important;
                background: white !important;
                color: black !important;
                font-family: 'Courier New', Courier, monospace;
            }
*/
// This is perfect.

fs.writeFileSync('client/cashier.html', code);
