require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Resend } = require('resend');

// Fallback to avoid crash during dev, though JDV key is secured.
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

const sendMissionConfirmed = async (customerEmail, customerName, amount, productName) => {
  if (!process.env.RESEND_API_KEY) return console.warn('[Email] Confirmed Mission signal blocked: Missing Key.');
  try {
    const { data, error } = await resend.emails.send({
      from: 'JDV Mission Control <onboarding@resend.dev>',
      to: [customerEmail],
      subject: 'Mission Confirmed: Your Tech is Preparing for Deployment',
      html: `
        <div style="background: #09090b; color: white; padding: 2rem; font-family: sans-serif;">
          <h1 style="color: #10b981;">Mission Confirmed.</h1>
          <p>Greetings ${customerName},</p>
          <p>Architecting tomorrow starts with the right gear. Your order for the <strong>${productName}</strong> is officially being processed for deployment.</p>
          <div style="background: #18181b; padding: 1rem; border-radius: 8px; border: 1px solid #27272a;">
            <p style="margin: 0;"><strong>Total Funding:</strong> CA$${(amount/100).toFixed(2)}</p>
          </div>
          <p>Our Saskatchewan headquarters is now preparing your dispatch. You will receive a tracking link the moment the unit is operational.</p>
          <p>Jesse's Digital Ventures — Architecting Tomorrow, Today.</p>
        </div>
      `
    });
    if (error) console.error('Email error:', error);
    else console.log('Branded email sent:', data.id);
  } catch (err) {
    console.error('Email service failed:', err);
  }
};

const sendAbandonedCartHook = async (customerEmail) => {
  if (!process.env.RESEND_API_KEY) return console.warn('[Email] Recovery hook blocked: Missing Key.');
  try {
    const { data, error } = await resend.emails.send({
      from: 'JDV Sentry <onboarding@resend.dev>',
      to: [customerEmail],
      subject: 'RECOVERY SIGNAL: Your Tech Stack is Incomplete',
      html: `
        <div style="background: #09090b; color: white; padding: 2rem; font-family: sans-serif; border: 1px solid #dc2626;">
          <h1 style="color: #dc2626;">Signal Detected: Cart Left In-Flight.</h1>
          <p>Our sentry nodes detected a mission interruption. Your high-tech gear is still holding in the queue.</p>
          <p>Secure your digital sovereignty before the stock is reallocated to other sectors.</p>
          <div style="margin-top: 2rem;">
            <a href="https://payment-event-hub.preview.emergentagent.com/shop" style="background: #dc2626; color: white; padding: 1rem 2rem; text-decoration: none; font-weight: bold; border-radius: 4px;">RECOVER MISSION</a>
          </div>
          <p style="margin-top: 2rem; font-size: 0.8rem; color: #71717a;">Jesse's Digital Ventures — Sentry Mode Active</p>
        </div>
      `
    });
    if (error) console.error('Abandoned Cart Email error:', error);
    else console.log('Abandoned Cart recovery email sent:', data.id);
  } catch (err) {
    console.error('Email hook failed:', err);
  }
};

module.exports = { sendMissionConfirmed, sendAbandonedCartHook };
