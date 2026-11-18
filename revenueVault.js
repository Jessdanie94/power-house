/** Legacy calculations only; no environment loading, account routing or financial execution. */
export function calculateNetRevenue(grossSales, reserveRate = null) {
  if (grossSales == null || reserveRate == null) return { status: 'unavailable', gross: null, reserve: null, available_for_payout: null, executed: false };
  if (!Number.isFinite(grossSales) || grossSales < 0 || !Number.isFinite(reserveRate) || reserveRate < 0 || reserveRate > 1) throw new TypeError('Reviewed non-negative gross and reserve rate are required.');
  return { status: 'estimate_only', gross: grossSales, reserve: grossSales * reserveRate, available_for_payout: null, estimate_after_reserve: grossSales * (1 - reserveRate), approvalRequired: true, executed: false };
}
export async function determinePayoutDestination() {
  return { status: 'unavailable', destination: null, amount: null, approvalRequired: true, executed: false };
}
export function generateRevenueReport(stats = {}) {
  return { status: 'unverified', total_revenue: stats.totalRevenue ?? null, payout_history: stats.payouts ?? null, automation_level: null, source: null };
}
