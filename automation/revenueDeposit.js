/** Pure planning only. This module never creates a provider client or transfers money. */
export function calculateRevenueAllocation(totalOrderAmount, supplierBasisPoints) {
  if (!Number.isSafeInteger(totalOrderAmount) || totalOrderAmount < 0) throw new TypeError('Amount must be non-negative safe integer cents.');
  if (!Number.isInteger(supplierBasisPoints) || supplierBasisPoints < 0 || supplierBasisPoints > 10000) throw new TypeError('An explicit reviewed allocation from 0 to 10000 basis points is required.');
  const supplierShare = Number((BigInt(totalOrderAmount) * BigInt(supplierBasisPoints) + 5000n) / 10000n);
  return { totalOrderAmount, supplierShare, retainedShare: totalOrderAmount - supplierShare, status: 'proposal_only', approvalRequired: true, executed: false };
}

// Compatibility boundary: historical callers must not turn proposals into deposits.
export async function processAutomatedRevenueDeposit() {
  return { status: 'unavailable', reason: 'Automated deposits are disabled. Supplier verification and explicit approval are required.', transferId: null, executed: false, approvalRequired: true };
}
