const fs = require('fs');
let code = fs.readFileSync('client/hr_management.html', 'utf8');

code = code.replace(
  /onclick='editStaff\(JSON\.stringify\(s\)\)'/g,
  "onclick='editStaff(this.getAttribute(\"data-staff\"))' data-staff='${JSON.stringify(s).replace(/'/g, \"&apos;\").replace(/\"/g, \"&quot;\")}'"
);

fs.writeFileSync('client/hr_management.html', code);
