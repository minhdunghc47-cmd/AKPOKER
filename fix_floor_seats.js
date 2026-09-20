const fs = require('fs');
let code = fs.readFileSync('client/floor_ipad.html', 'utf8');

const oldSeatLogic = /seatPositions\.forEach\(\(pos, index\) => \{\s*const player = tablePlayers\[index\];/;
const newSeatLogic = `seatPositions.forEach((pos, index) => {
                    const player = tablePlayers.find(p => p.seat === pos.id);`;
code = code.replace(oldSeatLogic, newSeatLogic);

fs.writeFileSync('client/floor_ipad.html', code);
console.log('Fixed floor ipad seats');
