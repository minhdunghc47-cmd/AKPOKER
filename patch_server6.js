const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

// Patch add_staff
code = code.replace(
  /const \{ id, name, pin, role, base_salary \} = payload;/g, 
  "const { id, name, pin, role, base_salary, dob, cccd, cccd_date, address, photo } = payload;"
);

code = code.replace(
  /base_salary: Number\(base_salary\) \|\| 50000,/,
  "base_salary: Number(base_salary) || 50000,\n      dob, cccd, cccd_date, address, photo,"
);

// Patch update_staff
code = code.replace(
  /db\.staff\[staffIndex\]\.base_salary = Number\(base_salary\) \|\| 50000;/,
  "db.staff[staffIndex].base_salary = Number(base_salary) || 50000;\n    if(dob) db.staff[staffIndex].dob = dob;\n    if(cccd) db.staff[staffIndex].cccd = cccd;\n    if(cccd_date) db.staff[staffIndex].cccd_date = cccd_date;\n    if(address) db.staff[staffIndex].address = address;\n    if(photo !== undefined) db.staff[staffIndex].photo = photo;"
);

fs.writeFileSync('server/server.js', code);
