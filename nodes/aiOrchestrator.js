/** Legacy boundary: no live AI model or demand forecasting has been verified. */
export async function getMissionPredictions() {
  return { predicted_high_demand_sku: null, scaling_multiplier: null, status: 'unavailable', timestamp: null, source: null };
}
