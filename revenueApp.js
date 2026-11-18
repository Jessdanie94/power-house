/** Legacy revenue entrypoint: no startup execution, providers, logs or sample sales. */
export async function runRevenueCheck() {
  return {
    status: 'unavailable',
    grossRevenue: null,
    netRevenue: null,
    payout: null,
    source: null,
    observedAt: null,
    approvalRequired: true,
    executed: false
  };
}
