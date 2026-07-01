import Stripe from 'stripe';
import 'dotenv/config';

// Initialize Stripe with your private API secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * LOGIC: Automatically calculate and route a revenue deposit upon a successful sale
 * @param {number} totalOrderAmount - Gross sales amount from Shopify (in cents)
 * @param {string} supplierAccountId - The connected account ID for your supplier if using Stripe Connect
 */
export async function processAutomatedRevenueDeposit(totalOrderAmount, supplierAccountId) {
  try {
    console.log(`🤖 Robot calculating revenue split for gross charge: $${(totalOrderAmount / 100).toFixed(2)}`);

    // Define your business logic rules (e.g., Keep 30% profit margin, route 70% to supplier/logistics)
    const supplierShare = Math.round(totalOrderAmount * 0.70);
    const ventureProfit = totalOrderAmount - supplierShare;

    console.log(`💰 Routing $${(supplierShare / 100).toFixed(2)} to supplier/reserve network.`);
    console.log(`📈 Depositing net profit of $${(ventureProfit / 100).toFixed(2)} directly to Jesse's Digital Ventures.`);

    // Programmatically execute a transfer split using Stripe Connect
    const transfer = await stripe.transfers.create({
      amount: supplierShare,
      currency: 'cad',
      destination: supplierAccountId, // Connected supplier routing target
      description: 'Automated high-ticket logistics allocation',
    });

    if (transfer.id) {
      console.log(`✅ Revenue split successfully deposited! Transfer ID: ${transfer.id}`);
    }
  } catch (error) {
    console.error("❌ Revenue Deposit Automation Error:", error.message);
  }
}
