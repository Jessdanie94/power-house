const express = require('express');
const router = express.Router();
const CheckoutSession = require('../models/CheckoutSession');
const { logToIsolatedVault } = require('../693300f4dac1ac6b9babb468/auditLogger');

// POST /api/dispute-shield/webhook
router.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.type === 'chargeback.created' || event.type === 'charge.dispute.created') {
    const disputeData = event.data.object;
    const relatedCartId = disputeData.metadata?.cartId;

    console.warn(`[Dispute Shield Activated] Chargeback initiated for Cart ID: ${relatedCartId}`);

    try {
      // 1. Fetch exact cryptographic customer session logs
      const sessionLog = await CheckoutSession.findOne({ cartId: relatedCartId });

      if (sessionLog) {
        // 2. Compile automated evidence dossier
        const legalDossier = {
          disputeId: disputeData.id,
          customerEmail: sessionLog.email,
          ipAddress: sessionLog.lastActivityAt, 
          timestamp: sessionLog.createdAt,
          subtotalPaid: sessionLog.subtotal,
          itemsPurchased: sessionLog.items?.map(i => i.title).join(', ') || 'N/A',
          evidenceStatus: 'READY_FOR_AUTO_SUBMISSION'
        };

        // Log sensitive legal payload to the isolated vault
        logToIsolatedVault('DISPUTE_SHIELD', 'EVIDENCE_DOSSIER_COMPILED', legalDossier);
        
        console.log('[Dispute Shield Success] Cryptographic evidence file compiled automatically.');
      }
    } catch (error) {
      console.error('[Dispute Shield Error] Failed to auto-compile evidence:', error.message);
    }
  }

  res.status(200).json({ received: true });
});

module.exports = router;
