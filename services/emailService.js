require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Resend } = require('resend');

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
  } catch (err) { console.error('Email service failed:', err); }
};

const sendAbandonedCartHook = async (customerEmail) => {
  if (!process.env.RESEND_API_KEY) return console.warn('[Email] Recovery hook blocked: Missing Key.');
  
  // DYNAMIC PRICING: Calculate Incentive (e.g., -15% if floor is 0.85)
  const floor = parseFloat(process.env.DYNAMIC_PRICING_FLOOR) || 1.00;
  const discountPercent = Math.round((1 - floor) * 100);
  const discountMsg = discountPercent > 0 ? `<p style="color: #fbbf24; font-weight: bold;">CRITICAL OVERRIDE: We've applied a ${discountPercent}% mission credit to your signal. Deploy now to secure the rate.</p>` : '';

  try {
    const { data, error } = await resend.emails.send({
      from: 'JDV Sentry <onboarding@resend.dev>',
      to: [customerEmail],
      subject: 'RECOVERY SIGNAL: Your Tech Stack is Incomplete',
      html: `
        <div style="background: #09090b; color: white; padding: 2rem; font-family: sans-serif; border: 1px solid #dc2626;">
          <h1 style="color: #dc2626;">Signal Detected: Cart Left In-Flight.</h1>
          <p>Our sentry nodes detected a mission interruption. Your high-tech gear is still holding in the queue.</p>
          ${discountMsg}
          <div style="margin-top: 2rem;">
            <a href="https://payment-event-hub.preview.emergentagent.com/shop" style="background: #dc2626; color: white; padding: 1rem 2rem; text-decoration: none; font-weight: bold; border-radius: 4px;">RECOVER MISSION</a>
          </div>
          <p style="margin-top: 2rem; font-size: 0.8rem; color: #71717a;">Jesse's Digital Ventures — Sentry Mode Active</p>
        </div>
      `
    });
    if (error) console.error('Abandoned Cart Email error:', error);
  } catch (err) { console.error('Email hook failed:', err); }
};

const sendWaitlistWelcome = async (customerEmail, referralToken, position) => {
  if (!process.env.RESEND_API_KEY) return console.warn('[Email] Waitlist hook blocked: Missing Key.');
  try {
    const { data, error } = await resend.emails.send({
      from: 'JDV Growth <onboarding@resend.dev>',
      to: [customerEmail],
      subject: 'MISSION BRIEF: You Are on the JDV Waitlist',
      html: `
        <div style="background: #09090b; color: white; padding: 2rem; font-family: sans-serif; border: 1px solid #38bdf8;">
          <h1 style="color: #38bdf8;">Access Pending.</h1>
          <p>The architecture is expanding. You have successfully secured a position on the Jesse's Digital Ventures waitlist.</p>
          <div style="background: #18181b; padding: 1.5rem; border-radius: 8px; border: 1px solid #27272a; margin: 1rem 0;">
            <p style="margin: 0; color: #94a3b8;">Current Position:</p>
            <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">#${position}</p>
            <p style="margin: 1rem 0 0 0; color: #94a3b8;">Your Referral Signal:</p>
            <code style="background: #000; padding: 0.5rem; color: #38bdf8; display: block; margin-top: 0.5rem;">${referralToken}</code>
          </div>
          <p>Share your signal. Every peer you bring into the network moves you closer to the front of the line.</p>
          <p>Jesse's Digital Ventures — Architecting Tomorrow.</p>
        </div>
      `
    });
  } catch (err) { console.error('Waitlist hook failed:', err); }
};

module.exports = { sendMissionConfirmed, sendAbandonedCartHook, sendWaitlistWelcome };
