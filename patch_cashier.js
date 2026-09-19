const fs = require('fs');
let code = fs.readFileSync('client/cashier.html', 'utf8');

// 1. Insert CSS for print
const printCss = `
        ::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
        
        @media print {
            body * {
                visibility: hidden;
            }
            #receipt-preview, #receipt-preview * {
                visibility: visible;
            }
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
        }
`;
code = code.replace(/::-webkit-scrollbar-thumb \{ background: #d4af37; border-radius: 10px; \}/, printCss);

// 2. Insert receipt-preview div at the end of main content
const receiptDiv = `
    <!-- RECEIPT PREVIEW -->
    <div id="receipt-preview" class="hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black p-4 z-50 shadow-2xl" style="width: 80mm; font-family: 'Courier New', Courier, monospace;">
    </div>
`;
code = code.replace(/<\/main>/, "</main>\n" + receiptDiv);

// 3. Update update_tours logic to support clicking cards
const oldUpdateTours = `            currentTours.forEach(tour => {
                const opt = document.createElement('option');
                opt.value = tour.id; opt.innerText = \`\${tour.name} [\${tour.status.toUpperCase()}]\`;
                if(tour.id === selVal) opt.selected = true;
                select.appendChild(opt);

                const card = document.createElement('div');
                card.className = \`card-mafia p-5 flex flex-col \${tour.status === 'running' ? 'running' : ''}\`;
                card.innerHTML = \`
                    <div class="font-mafia text-gold text-xl mb-1 truncate">\${tour.name}</div>
                    <div class="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest border-b border-[#333] pb-2">Entries: <span class="text-white">\${tour.entries}</span></div>
                    <div class="bg-[#111] p-4 rounded border border-[#222] flex flex-col gap-2 text-xs font-bold uppercase tracking-widest">
                        <div class="flex justify-between text-emerald-500"><span class="text-gray-400">Quỹ Két:</span> <span>\${formatMoney(tour.fund.net_fund)}</span></div>
                        <div class="flex justify-between text-red-500"><span class="text-gray-400">Nợ:</span> <span>\${formatMoney(tour.fund.debt)}</span></div>
                    </div>
                \`;
                grid.appendChild(card);
            });`;

const newUpdateTours = `            currentTours.forEach(tour => {
                const opt = document.createElement('option');
                opt.value = tour.id; opt.innerText = \`\${tour.name} [\${tour.status.toUpperCase()}]\`;
                if(tour.id === selVal) opt.selected = true;
                select.appendChild(opt);

                const card = document.createElement('div');
                const isActive = (tour.id === selVal) ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-[#333]';
                card.className = \`card-mafia p-5 flex flex-col \${tour.status === 'running' ? 'running' : ''} tour-card-item border transition-all cursor-pointer hover:bg-[#151515] hover:border-[#d4af37] \${isActive}\`;
                card.id = 'tour-card-' + tour.id;
                card.onclick = () => selectTour(tour.id);
                card.innerHTML = \`
                    <div class="font-mafia text-[#d4af37] text-xl mb-1 truncate">\${tour.name}</div>
                    <div class="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest border-b border-[#333] pb-2">Entries: <span class="text-white">\${tour.entries}</span></div>
                    <div class="bg-[#111] p-4 rounded border border-[#222] flex flex-col gap-2 text-xs font-bold uppercase tracking-widest">
                        <div class="flex justify-between text-emerald-500"><span class="text-gray-400">Quỹ Két:</span> <span>\${formatMoney(tour.fund.net_fund)}</span></div>
                        <div class="flex justify-between text-red-500"><span class="text-gray-400">Nợ:</span> <span>\${formatMoney(tour.fund.debt)}</span></div>
                    </div>
                \`;
                grid.appendChild(card);
            });`;

code = code.replace(oldUpdateTours, newUpdateTours);

// 4. Insert selectTour and printReceipt functions before sellTicket
const newFunctions = `
        function selectTour(tId) {
            const select = document.getElementById('tour-select');
            select.value = tId;
            select.dispatchEvent(new Event('change'));
            
            document.querySelectorAll('.tour-card-item').forEach(el => {
                el.classList.remove('border-[#d4af37]', 'shadow-[0_0_15px_rgba(212,175,55,0.4)]');
                el.classList.add('border-[#333]');
            });
            const activeCard = document.getElementById('tour-card-' + tId);
            if (activeCard) {
                activeCard.classList.remove('border-[#333]');
                activeCard.classList.add('border-[#d4af37]', 'shadow-[0_0_15px_rgba(212,175,55,0.4)]');
            }
        }

        function printReceipt(phone, tourId, amount) {
            const member = currentMembers.find(m => m.phone === phone);
            const tour = currentTours.find(t => t.id === tourId);
            const name = member ? member.name : phone;
            const tourName = tour ? tour.name : '';
            
            const now = new Date();
            const timeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
            
            const receiptHtml = \`
                <div style="text-align: center; margin-bottom: 10px;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: bold;">ACEPOKER</h2>
                    <div style="font-size: 12px; margin-top: 5px;">VÉ THAM DỰ GIẢI ĐẤU</div>
                </div>
                <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
                <div style="font-size: 12px; line-height: 1.6;">
                    <div><strong>Khách:</strong> \${name}</div>
                    <div><strong>Giải:</strong> \${tourName}</div>
                    <div><strong>Buy-in:</strong> \${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ</div>
                    <div><strong>Thời gian:</strong> \${timeStr}</div>
                    <div style="margin-top: 10px;"><strong>Bàn:</strong> ......... <strong>Ghế:</strong> .........</div>
                </div>
                <div style="border-top: 1px dashed black; margin: 10px 0;"></div>
                <div style="text-align: center; font-size: 12px; font-style: italic;">
                    Chúc quý khách may mắn!
                </div>
            \`;
            
            const preview = document.getElementById('receipt-preview');
            preview.innerHTML = receiptHtml;
            preview.classList.remove('hidden');
            
            setTimeout(() => {
                window.print();
                preview.classList.add('hidden');
            }, 300);
        }
`;

code = code.replace(/\/\/ TICKET SELLING & REGISTER LOGIC/, newFunctions + "\n        // TICKET SELLING & REGISTER LOGIC");

// 5. Update sellTicket to call printReceipt
const oldSellLogic = `
            socket.emit('sell_ticket', payload, (res) => {
                btn.disabled = false;
                if(res.success) { 
                    showAlert(res.message, false); 
                    document.getElementById('player-search').value=''; 
                    document.getElementById('unpaid-checkbox').checked=false; 
                } else {`;

const newSellLogic = `
            socket.emit('sell_ticket', payload, (res) => {
                btn.disabled = false;
                if(res.success) { 
                    printReceipt(payload.member_phone, payload.tour_id, payload.buy_in_amount);
                    showAlert(res.message, false); 
                    document.getElementById('player-search').value=''; 
                    document.getElementById('unpaid-checkbox').checked=false; 
                } else {`;

code = code.replace(oldSellLogic, newSellLogic);

fs.writeFileSync('client/cashier.html', code);
