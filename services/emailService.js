const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendMissionConfirmed = async (customerEmail, customerName, amount, productName) => {
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

module.exports = { sendMissionConfirmed };
