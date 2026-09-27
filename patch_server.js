const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

const createTourReplacement = `
  socket.on('create_tour', requireRole(socket, ['god', 'td'], (data) => {
    const { name, selectedTableIds, settings, starting_stack, buyin_fee, buy_in_fee, scheduled_start } = data;
console.log('CREATE_TOUR DATA:', data);
    const tablesToLock = db.tables.filter(t => selectedTableIds.includes(t.id));
    const canLock = tablesToLock.every(t => !t.is_locked);

    if (canLock && name && selectedTableIds.length > 0) {
      const tourId = 'T' + Date.now();
      tablesToLock.forEach(t => { t.is_locked = true; t.tour_id = tourId; });

      const newTour = {
        id: tourId, name: name, tables: selectedTableIds, entries: 0, dealer_assigned: false, buyin_fee: buyin_fee || buy_in_fee || 0,
        status: scheduled_start ? 'pending' : 'paused', players: [],
        scheduled_start: scheduled_start || null,
        fund: { total_paid: 0, expenses: 0, debt: 0, net_fund: 0, payout_pool: 0 },
        settings: settings || { level_time: 20, late_reg_level: 6, min_players: 6 },
        starting_stack: Number(starting_stack) || 100000,
        current_level_idx: 0,
        time_remaining: (settings && settings.level_time ? settings.level_time : 20) * 60,
        blinds_structure: data.blinds_structure || JSON.parse(JSON.stringify(defaultBlinds))
      };

      if (!newTour.settings.min_players) newTour.settings.min_players = 6;

      db.tournaments.push(newTour);
      broadcastState();
`;

code = code.replace(/socket\.on\('create_tour', requireRole\(socket, \['god', 'td'\], \(data\) => \{[\s\S]*?broadcastState\(\);/m, createTourReplacement.trim());


// Now update the clock loop to check for pending tours
const clockLoopRegex = /setInterval\(\(\) => \{\n\s*let stateChanged = false;\n\s*db\.tournaments\.forEach\(t => \{/m;
const newClockLoop = `setInterval(() => {
  let stateChanged = false;
  const nowMs = Date.now();
  db.tournaments.forEach(t => {
    if (t.status === 'pending' && t.scheduled_start && nowMs >= t.scheduled_start) {
        t.status = 'running';
        stateChanged = true;
    }`;
code = code.replace(clockLoopRegex, newClockLoop);

fs.writeFileSync('server/server.js', code);
