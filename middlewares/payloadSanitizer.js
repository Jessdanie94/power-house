/**
 * JDV Payload Sanitizer: Middleware to clean and validate fulfillment signals.
 * Architected for Infrastructure 4.5.1
 */
const sanitizeFulfillmentPayload = (req, res, next) => {
  // Gracefully handle array formats from automation sync webhooks
  const products = Array.isArray(req.body) ? req.body : [req.body];

  for (let product of products) {
    // Ensure critical high-ticket item parameters exist
    if (!product.sku) {
      console.error(`[Sync Drop] Rejected entry: Product missing unique SKU mapping identifier.`);
      return res.status(400).json({ error: "Missing SKU structural requirement" });
    }

    // Force strict formatting strings to prevent database projection failures
    product.sku = String(product.sku).trim().toUpperCase();
    
    // Default safety values for shipping parameters
    if (!product.shippingWeight) product.shippingWeight = 0;
    if (product.price) product.price = parseFloat(product.price);
  }

  next();
};

module.exports = { sanitizeFulfillmentPayload };
