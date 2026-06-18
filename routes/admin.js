const express = require('express');
const router = express.Router();
const { runDeploymentSweep } = require('../services/deploymentMap');
const { scaleCurrency } = require('../services/currencyScaler');
const { runLeadHuntingSweep } = require('../workers/leadHunter');
const { cacheWrapNode } = require('../services/cacheNode');
router.get('/system-sweep', async (req, res) => {
  try {
    const liveNetworkMap = await runDeploymentSweep();
    const regionalPricingScale = await cacheWrapNode('regional_pricing', 60, async () => {
        return { usMarket: scaleCurrency(150.00, 'USD'), euMarket: scaleCurrency(150.00, 'EUR') };
    });
    const results = await runLeadHuntingSweep([{ name: "Sarah Jenkins", totalOrderVolume: 1250 }]);
    res.json({ success: true, infrastructureMap: liveNetworkMap, multicurrencyMatrix: regionalPricingScale, leadHuntingPipeline: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
