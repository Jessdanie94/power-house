import { calculateNetRevenue, determinePayoutDestination } from './revenueVault.js';
import log from './secureLogger.js';

/**
 * MAIN REVENUE APP ORCHESTRATOR
 * Runs daily to check balances and alert for payouts.
 */

async function runRevenueCheck() {
  log.info("🤖 Revenue App: Starting daily sync...");

  // 1. Fetch current sales (Mocking until shpat_ token arrives)
  const currentSales = 471.71; 
  
  // 2. Run the logic
  const revenueData = calculateNetRevenue(currentSales);
  log.info("JDV Financial Health Check", revenueData);

  // 3. Check for payout readiness
  const payout = await determinePayoutDestination(parseFloat(revenueData.available_for_payout));

  if (payout) {
    log.info("💰 ACTION REQUIRED: Funds hit 00 threshold.", {
      action: "Log in to Sellvia and push to " + payout.destination
    });
  } else {
    log.info("🚱 Status: Accumulating capital. No payout ready today.");
  }
}

runRevenueCheck().catch(err => log.error("Revenue App Failure", err));
