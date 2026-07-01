import 'dotenv/config';
import log from './secureLogger.js';

/**
 * JDV REVENUE VAULT - Autonomous Profit & Payout Logic
 * Designed for Jesse's Digital Ventures (v1.0)
 */

const REVENUE_RESERVE_RATE = 0.25; // 25% risk reserve
const PAYOUT_THRESHOLD = 100.00;   // Minimum for bank transfer
const SELLVIA_FEE_ESTIMATE = 1.50; // Per order estimate

export const DESTINATIONS = {
  CIBC_CHEQUING: "CIBC - Main Chequing",
  CIBC_SAVINGS: "CIBC - Savings",
  WISE: "Wise - Multi-currency"
};

/**
 * Calculates net profit after Sellvia costs and risk reserves.
 * @param {number} grossSales - Total sales from Shopify
 * @returns {object} - Breakdown of available vs reserved cash
 */
export function calculateNetRevenue(grossSales) {
  const reserve = grossSales * REVENUE_RESERVE_RATE;
  const netAfterReserve = grossSales - reserve;
  
  return {
    gross: grossSales.toFixed(2),
    reserve: reserve.toFixed(2),
    available_for_payout: netAfterReserve.toFixed(2),
    hold_period: "125 Days"
  };
}

/**
 * Logic to determine where funds should be routed based on account balances.
 * Currently defaults to CIBC as requested by the architect.
 */
export async function determinePayoutDestination(availableBalance) {
  log.info("Analyzing payout eligibility...", { balance: availableBalance });

  if (availableBalance < PAYOUT_THRESHOLD) {
    log.warn("Payout threshold not reached.", { 
      current: availableBalance, 
      needed: PAYOUT_THRESHOLD 
    });
    return null;
  }

  // Logic: Set deposits from Neo to CIBC
  log.info("Funds ready for autonomous transfer.", {
    amount: availableBalance,
    target: DESTINATIONS.CIBC_CHEQUING
  });

  return {
    amount: availableBalance,
    destination: DESTINATIONS.CIBC_CHEQUING,
    status: "READY_FOR_MANUAL_PUSH" // Autonomous execution requires bank API access
  };
}

/**
 * Monthly 'Proof of Performance' generator logic
 */
export function generateRevenueReport(stats) {
  log.info("Generating Autonomous Enterprise Revenue Report...");
  // This data feeds into the NEO_PROOF_REPORT.pdf
  return {
    brand: "Jesse's Digital Ventures",
    total_revenue: stats.totalRevenue,
    automation_level: 4,
    payout_history: stats.payouts ?? []
  };
}

// Example usage if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const sampleSale = 471.71;
  const breakdown = calculateNetRevenue(sampleSale);
  log.info("Sample Revenue Breakdown", breakdown);
}
