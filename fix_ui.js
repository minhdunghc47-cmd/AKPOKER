const fs = require('fs');

const files = [
    'client/hr_kiosk.html',
    'client/index.html',
    'client/god_mode.html',
    'client/hr_management.html',
    'client/cashier.html',
    'client/td_dashboard.html',
    'client/floor_ipad.html',
    'client/main_tv.html'
];

const touchCss = `
        /* Tối ưu hóa UI/UX cho màn hình cảm ứng & di động */
        button, select, input {
            min-height: 48px !important;
        }
        .seat {
            min-height: auto !important; /* Ngoại trừ ghế ngồi trên bàn poker */
        }
        @media (max-width: 1024px) {
            .table-container, table, .overflow-y-auto, .overflow-x-auto { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            body { padding: 10px !important; }
            /* Tăng khoảng cách các phần tử để dễ bấm trên iPad */
            .tour-card { margin-bottom: 20px; }
            .poker-table-bg { margin: 20px 0; }
        }
        @media (max-width: 768px) {
            /* Chuyển 2 cột thành 1 cột */
            .flex-row, .flex-1.flex.gap-6, .flex.gap-6, .flex.gap-8 { flex-direction: column !important; }
            .w-1\\/3, .w-2\\/3, .w-1\\/4, .w-3\\/4, .w-\\[380px\\], .w-\\[480px\\] { width: 100% !important; min-width: 100% !important; }
            .h-screen { height: auto !important; min-height: 100vh; overflow-y: auto !important; }
            body { overflow-y: auto !important; }
            .glass-panel { padding: 15px !important; }
            
            /* Dành cho các tour card/bàn */
            .grid-cols-2, .grid-cols-3, .xl\\:grid-cols-2 { grid-template-columns: 1fr !important; }
            
            /* Đảm bảo khoảng cách chạm trên mobile */
            .tour-card { margin-bottom: 24px; }
            .poker-table-bg { margin: 24px 0; }
        }
`;

const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // 1. Thay thế meta viewport
    code = code.replace(/<meta name="viewport".*?>/, viewportMeta);

    // 2. Chèn CSS tối ưu
    if (!code.includes('Tối ưu hóa UI/UX')) {
        code = code.replace('</style>', touchCss + '\n    </style>');
    }

    fs.writeFileSync(file, code);
});
console.log('Done fix_ui.js');
