import nodemailer from "nodemailer";
import { config } from "../config.js";

function createTransport() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) return null;

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

function buildPurchaseEmail({ name, licenseKey, downloadUrl }) {
  const subject = "Your Keshav With Velo license key";
  const text = `Hi ${name},

Thank you for buying Keshav With Velo.

Download link (valid for ${config.downloadLinkExpiryHours} hours):
${downloadUrl}

License key:
${licenseKey}

Activation:
1. Download and install the extension ZIP.
2. Open the extension panel in Adobe After Effects.
3. Enter your Gmail/email and license key.
4. Activate on your main editing device.

Important: one license is bound to one device unless reset by admin.

Terms:
- This is a digital product. No refund is available after successful payment.
- One license key activates on one PC only.
- Do not share, resell, leak, modify, or redistribute the extension or included assets.
`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">
      <h2>Keshav With Velo License</h2>
      <p>Hi ${name}, thank you for buying Keshav With Velo.</p>
      <p><strong>Download:</strong> <a href="${downloadUrl}">Download Keshav With Velo</a> (valid for ${config.downloadLinkExpiryHours} hours).</p>
      <p><strong>License key:</strong></p>
      <p style="font-size:22px;font-weight:700;letter-spacing:2px">${licenseKey}</p>
      <h3>Activation</h3>
      <ol>
        <li>Download and install the extension ZIP.</li>
        <li>Open the extension panel in Adobe After Effects.</li>
        <li>Enter your Gmail/email and license key.</li>
        <li>Activate on your main editing device.</li>
      </ol>
      <p>Important: one license is bound to one device unless reset by admin.</p>
      <h3>Terms</h3>
      <ul>
        <li>This is a digital product. No refund is available after successful payment.</li>
        <li>One license key activates on one PC only.</li>
        <li>Do not share, resell, leak, modify, or redistribute the extension or included assets.</li>
      </ul>
    </div>
  `;

  return { subject, text, html };
}

async function sendWithResend({ email, subject, text, html }) {
  if (!config.resend.apiKey) return null;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.resend.from,
      to: email,
      subject,
      text,
      html
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || data.error || `Resend API failed with ${response.status}`;
    const error = new Error(message);
    error.provider = "resend";
    error.status = response.status;
    throw error;
  }

  return { sent: true, provider: "resend", id: data.id };
}

export async function sendPurchaseEmail({ name, email, licenseKey, downloadUrl }) {
  const { subject, text, html } = buildPurchaseEmail({ name, licenseKey, downloadUrl });

  const resendDelivery = await sendWithResend({ email, subject, text, html });
  if (resendDelivery) return resendDelivery;

  const transport = createTransport();
  if (!transport) {
    console.log("[email skipped] SMTP not configured", { to: email, subject, licenseKey, downloadUrl });
    return { sent: false, skipped: true, error: "smtp_not_configured" };
  }

  await transport.sendMail({
    from: config.smtp.from,
    to: email,
    subject,
    text,
    html
  });

  return { sent: true };
}
