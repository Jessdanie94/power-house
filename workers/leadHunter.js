const runLeadHuntingSweep = async (leads) => leads.map(l => ({ ...l, priority: 'S-TIER' }));
module.exports = { runLeadHuntingSweep };
