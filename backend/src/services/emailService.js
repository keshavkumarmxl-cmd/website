import nodemailer from "nodemailer";
import { config } from "../config.js";
import { db } from "../db/connection.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTutorialUrl() {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get("tutorial_youtube_url");
  return String(row?.value || "").trim();
}

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

function buildPurchaseEmail({ name, email, licenseKey, downloadUrl, tutorialUrl }) {
  const subject = "Your Keshav With Velo activation details";
  const tutorialText = tutorialUrl ? `
Tutorial video:
${tutorialUrl}
` : "";
  const tutorialHtml = tutorialUrl ? `
      <p><strong>Tutorial video:</strong> <a href="${escapeHtml(tutorialUrl)}">Watch setup tutorial</a></p>
  ` : "";
  const text = `Hi ${name},

Thank you for buying Keshav With Velo.

Activation email:
${email}

Activation key:
${licenseKey}

Download link:
${downloadUrl}
${tutorialText}

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
      <p>Hi ${escapeHtml(name)}, thank you for buying Keshav With Velo.</p>
      <p><strong>Download:</strong> <a href="${escapeHtml(downloadUrl)}">Download Keshav With Velo</a></p>
      ${tutorialHtml}
      <p><strong>Activation email:</strong><br>${escapeHtml(email)}</p>
      <p><strong>Activation key:</strong></p>
      <p style="font-size:22px;font-weight:700;letter-spacing:2px">${escapeHtml(licenseKey)}</p>
      <h3>Activation</h3>
      <ol>
        <li>Download and install the extension ZIP.</li>
        ${tutorialUrl ? "<li>Watch the tutorial video if you need setup help.</li>" : ""}
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

async function sendWithSmtp({ email, subject, text, html }) {
  const transport = createTransport();
  if (!transport) return null;

  const info = await transport.sendMail({
    from: config.smtp.from,
    to: email,
    subject,
    text,
    html
  });

  return { sent: true, provider: "smtp", id: info.messageId };
}

export async function sendPurchaseEmail({ name, email, licenseKey, downloadUrl }) {
  const { subject, text, html } = buildPurchaseEmail({ name, email, licenseKey, downloadUrl, tutorialUrl: getTutorialUrl() });
  const failures = [];

  try {
    const resendDelivery = await sendWithResend({ email, subject, text, html });
    if (resendDelivery) return resendDelivery;
  } catch (error) {
    failures.push({
      provider: "resend",
      status: error.status || null,
      message: error.message || "Resend delivery failed"
    });
    console.error("[resend email failed; trying smtp fallback]", {
      to: email,
      status: error.status || null,
      message: error.message || "Resend delivery failed"
    });
  }

  try {
    const smtpDelivery = await sendWithSmtp({ email, subject, text, html });
    if (smtpDelivery) {
      return failures.length
        ? { ...smtpDelivery, fallbackUsed: true, failedProviders: failures }
        : smtpDelivery;
    }
  } catch (error) {
    failures.push({
      provider: "smtp",
      status: error.responseCode || null,
      message: error.message || "SMTP delivery failed"
    });
    console.error("[smtp email failed]", {
      to: email,
      status: error.responseCode || null,
      message: error.message || "SMTP delivery failed"
    });
  }

  console.error("[purchase email not delivered]", {
    to: email,
    failedProviders: failures.map((failure) => failure.provider)
  });
  return {
    sent: false,
    error: failures.length ? "all_email_providers_failed" : "email_not_configured",
    failedProviders: failures
  };
}
