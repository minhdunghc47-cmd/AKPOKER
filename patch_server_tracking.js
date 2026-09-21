const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// 1. clock_in
code = code.replace(
    /s\.last_in = Date\.now\(\);/g,
    "s.last_in = Date.now();\n    s.total_dealing_ms = 0;\n    s.session_start = null;"
);

// 2. clock_out
code = code.replace(
    /s\.total_minutes \+= diffMins;\n\s*}/g,
    "s.total_minutes += diffMins;\n    }\n    if (s.session_start) {\n      s.total_dealing_ms = (s.total_dealing_ms || 0) + (now - s.session_start);\n      s.session_start = null;\n    }"
);

// 3. close_table (around line 522)
code = code.replace(
    /if \(staff && staff\.status === 'busy'\) staff\.status = 'waiting';/g,
    "if (staff && staff.status === 'busy') {\n                staff.status = 'waiting';\n                if (staff.session_start) {\n                    staff.total_dealing_ms = (staff.total_dealing_ms || 0) + (Date.now() - staff.session_start);\n                    staff.session_start = null;\n                }\n            }"
);

// 4. assign_dealer (old dealer logic)
code = code.replace(
    /if \(oldStaff\) oldStaff\.status = 'waiting';/g,
    "if (oldStaff) {\n              oldStaff.status = 'waiting';\n              if (oldStaff.session_start) {\n                  oldStaff.total_dealing_ms = (oldStaff.total_dealing_ms || 0) + (Date.now() - oldStaff.session_start);\n                  oldStaff.session_start = null;\n              }\n          }"
);

// 5. assign_dealer (new dealer logic)
code = code.replace(
    /if \(newStaff\) newStaff\.status = 'busy';/g,
    "if (newStaff) {\n          newStaff.status = 'busy';\n          newStaff.session_start = Date.now();\n      }"
);

fs.writeFileSync('server/server.js', code);
console.log('Patched server tracking');
