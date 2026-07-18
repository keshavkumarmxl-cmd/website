import fs from "fs";
import path from "path";
import express from "express";
import { db } from "../db/connection.js";
import { config } from "../config.js";
import { validate } from "../middleware/validate.js";
import { activateSchema, downloadSchema, purchaseSchema, razorpayOrderSchema, verifyLicenseSchema } from "../schemas.js";
import { sendPurchaseEmail } from "../services/emailService.js";
import { createRazorpayOrder, verifyPayment } from "../services/paymentService.js";
import { createDownloadToken, readDownloadToken } from "../utils/downloadLink.js";
import {
  expiryDate,
  generateLicenseKey,
  hashFingerprint,
  hashLicenseKey,
  isExpired,
  licenseHint,
  normalizeLicenseKey
} from "../utils/license.js";

export const publicRoutes = express.Router();

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function logAttempt(req, { email, licenseKey, deviceHash, result, reason }) {
  db.prepare(`
    INSERT INTO activation_attempts (email, license_hint, device_fingerprint_hash, ip_address, user_agent, result, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(email || null, licenseKey ? licenseHint(licenseKey) : null, deviceHash || null, clientIp(req), req.headers["user-agent"] || "", result, reason || null);
}

function failedAttemptCount(req, email) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM activation_attempts
    WHERE email = ?
      AND ip_address = ?
      AND result = 'failed'
      AND created_at >= datetime('now', '-1 hour')
  `).get(email, clientIp(req)).count;
}

function createLicenseForUser(userId, licenseType, expiryDays = config.licenseExpiryDays) {
  for (let i = 0; i < 8; i += 1) {
    const key = generateLicenseKey();
    const hash = hashLicenseKey(key);

    try {
      db.prepare(`
        INSERT INTO licenses (license_hash, license_hint, user_id, status, expiry_date, license_type)
        VALUES (?, ?, ?, 'inactive', ?, ?)
      `).run(hash, licenseHint(key), userId, expiryDate(expiryDays), licenseType);

      return key;
    } catch (error) {
      if (!String(error.message).includes("UNIQUE")) throw error;
    }
  }

  throw new Error("Could not generate a unique license key");
}

function upsertUser({ name, email }) {
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existing) return existing;

  const result = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run(name, email);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
}

function appendPurchaseHistory(userId, purchase) {
  const user = db.prepare("SELECT purchase_history FROM users WHERE id = ?").get(userId);
  const history = JSON.parse(user.purchase_history || "[]");
  history.push(purchase);
  db.prepare("UPDATE users SET purchase_history = ? WHERE id = ?").run(JSON.stringify(history), userId);
}

publicRoutes.get("/health", (req, res) => {
  res.json({ status: "ok", service: "licensing", time: new Date().toISOString() });
});

publicRoutes.post("/razorpay/order", validate(razorpayOrderSchema), async (req, res, next) => {
  try {
    const body = req.body;
    if (body.productId !== config.productId) {
      return res.status(400).json({ status: "failed", reason: "Unknown product" });
    }

    const order = await createRazorpayOrder({
      plan: body.plan,
      productId: body.productId,
      name: body.name,
      email: body.email
    });

    return res.status(201).json({
      status: "success",
      order
    });
  } catch (error) {
    return next(error);
  }
});

publicRoutes.post("/purchase", validate(purchaseSchema), async (req, res, next) => {
  try {
    const body = req.body;
    if (body.productId !== config.productId) {
      return res.status(400).json({ status: "failed", reason: "Unknown product" });
    }

    const existingPurchase = db.prepare(`
      SELECT id FROM purchases WHERE payment_provider = ? AND payment_id = ?
    `).get(body.paymentProvider, body.paymentId);

    if (existingPurchase) {
      return res.status(409).json({ status: "failed", reason: "Payment was already used" });
    }

    const payment = await verifyPayment(body);
    if (!payment.verified) {
      return res.status(402).json({ status: "failed", reason: payment.reason || "Payment verification failed" });
    }

    const buyerEmail = body.email || payment.raw?.email;
    const buyerName = body.name || payment.raw?.notes?.name || payment.raw?.contact || "Razorpay Customer";

    if (!buyerEmail) {
      return res.status(400).json({
        status: "failed",
        reason: "Razorpay did not return a buyer email. Enable email collection in Razorpay checkout."
      });
    }

    const tx = db.transaction(() => {
      const user = upsertUser({ name: buyerName, email: buyerEmail });
      const key = createLicenseForUser(user.id, body.licenseType);

      const purchase = {
        productId: body.productId,
        paymentProvider: body.paymentProvider,
        paymentId: body.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        date: new Date().toISOString()
      };

      db.prepare(`
        INSERT INTO purchases (user_id, product_id, payment_provider, payment_id, amount, currency, status, raw_payload)
        VALUES (?, ?, ?, ?, ?, ?, 'paid', ?)
      `).run(user.id, body.productId, body.paymentProvider, body.paymentId, payment.amount || null, payment.currency || null, JSON.stringify(payment.raw || {}));

      appendPurchaseHistory(user.id, purchase);
      return { user, key };
    });

    const { user, key } = tx();
    const downloadToken = createDownloadToken({ email: user.email, licenseKey: key });
    const downloadUrl = `${config.publicBaseUrl}/api/download-link?token=${encodeURIComponent(downloadToken)}`;
    await sendPurchaseEmail({ name: user.name, email: user.email, licenseKey: key, downloadUrl });

    return res.status(201).json({
      status: "success",
      message: "Purchase confirmed. License generated and email queued.",
      email: user.email,
      licenseKey: key,
      downloadUrl
    });
  } catch (error) {
    return next(error);
  }
});

publicRoutes.post("/activate", validate(activateSchema), (req, res) => {
  const { email, licenseKey, deviceFingerprint } = req.body;
  const normalizedKey = normalizeLicenseKey(licenseKey);
  const licenseHash = hashLicenseKey(normalizedKey);
  const deviceHash = hashFingerprint(deviceFingerprint);

  if (failedAttemptCount(req, email) >= config.maxFailedActivationsPerHour) {
    logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "failed", reason: "Too many failed attempts" });
    return res.status(429).json({ status: "failed", reason: "Too many failed activation attempts. Try again later." });
  }

  const license = db.prepare(`
    SELECT licenses.*, users.email
    FROM licenses
    JOIN users ON users.id = licenses.user_id
    WHERE licenses.license_hash = ?
  `).get(licenseHash);

  if (!license || license.email !== email) {
    logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "failed", reason: "Invalid email or license" });
    return res.status(404).json({ status: "failed", reason: "Invalid email or license key" });
  }

  if (license.status === "blocked") {
    logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "failed", reason: "License blocked" });
    return res.status(403).json({ status: "blocked", reason: "License is blocked" });
  }

  if (isExpired(license.expiry_date)) {
    db.prepare("UPDATE licenses SET status = 'expired' WHERE id = ?").run(license.id);
    logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "failed", reason: "License expired" });
    return res.status(403).json({ status: "expired", reason: "License is expired" });
  }

  if (license.device_id) {
    const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(license.device_id);
    if (device?.hardware_fingerprint_hash !== deviceHash) {
      logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "failed", reason: "License already activated on another device" });
      return res.status(409).json({
        status: "failed",
        reason: "License already activated on another device"
      });
    }

    db.prepare("UPDATE devices SET last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(device.id);
    db.prepare("UPDATE licenses SET last_verification = CURRENT_TIMESTAMP WHERE id = ?").run(license.id);
    logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "success", reason: "Already active on this device" });
    return res.json({ status: "success", message: "License already active on this device" });
  }

  const tx = db.transaction(() => {
    const deviceResult = db.prepare(`
      INSERT INTO devices (license_id, hardware_fingerprint_hash)
      VALUES (?, ?)
    `).run(license.id, deviceHash);

    db.prepare(`
      UPDATE licenses
      SET status = 'active',
          activation_date = CURRENT_TIMESTAMP,
          device_id = ?,
          last_verification = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(deviceResult.lastInsertRowid, license.id);
  });

  tx();
  logAttempt(req, { email, licenseKey: normalizedKey, deviceHash, result: "success", reason: "Activated" });
  return res.json({ status: "success", message: "License activated" });
});

publicRoutes.post("/verify-license", validate(verifyLicenseSchema), (req, res) => {
  const licenseHash = hashLicenseKey(req.body.licenseKey);
  const deviceHash = hashFingerprint(req.body.deviceFingerprint);

  const license = db.prepare("SELECT * FROM licenses WHERE license_hash = ?").get(licenseHash);
  if (!license) return res.status(404).json({ status: "invalid" });
  if (license.status === "blocked") return res.status(403).json({ status: "blocked" });
  if (isExpired(license.expiry_date) || license.status === "expired") {
    db.prepare("UPDATE licenses SET status = 'expired' WHERE id = ?").run(license.id);
    return res.status(403).json({ status: "expired" });
  }

  if (!license.device_id) return res.status(403).json({ status: "invalid", reason: "License is not activated" });

  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(license.device_id);
  if (!device || device.hardware_fingerprint_hash !== deviceHash) {
    return res.status(403).json({ status: "invalid", reason: "Device mismatch" });
  }

  db.prepare("UPDATE devices SET last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(device.id);
  db.prepare("UPDATE licenses SET last_verification = CURRENT_TIMESTAMP WHERE id = ?").run(license.id);

  return res.json({
    status: "valid",
    licenseType: license.license_type,
    expiryDate: license.expiry_date
  });
});

publicRoutes.post("/download", validate(downloadSchema), (req, res) => {
  const licenseHash = hashLicenseKey(req.body.licenseKey);
  const license = db.prepare(`
    SELECT licenses.*, users.email
    FROM licenses
    JOIN users ON users.id = licenses.user_id
    WHERE licenses.license_hash = ?
  `).get(licenseHash);

  if (!license || license.email !== req.body.email) {
    return res.status(404).json({ status: "failed", reason: "Invalid email or license key" });
  }

  if (license.status === "blocked") return res.status(403).json({ status: "blocked" });
  if (isExpired(license.expiry_date)) return res.status(403).json({ status: "expired" });

  const activeVersion = db.prepare("SELECT * FROM extension_versions WHERE is_active = 1 ORDER BY id DESC LIMIT 1").get();
  const filePath = path.resolve(process.cwd(), activeVersion?.download_path || config.extensionZipPath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ status: "failed", reason: "Extension ZIP file is not uploaded yet" });
  }

  return res.download(filePath, "keshav-with-velo.zip");
});

publicRoutes.get("/download-link", (req, res) => {
  const token = readDownloadToken(req.query.token);
  if (!token) return res.status(403).send("This download link is invalid or has expired.");

  const licenseHash = hashLicenseKey(token.licenseKey);
  const license = db.prepare(`
    SELECT licenses.*, users.email
    FROM licenses
    JOIN users ON users.id = licenses.user_id
    WHERE licenses.license_hash = ?
  `).get(licenseHash);

  if (!license || license.email !== token.email || license.status === "blocked" || isExpired(license.expiry_date)) {
    return res.status(403).send("This download is no longer available.");
  }

  const activeVersion = db.prepare("SELECT * FROM extension_versions WHERE is_active = 1 ORDER BY id DESC LIMIT 1").get();
  const filePath = path.resolve(process.cwd(), activeVersion?.download_path || config.extensionZipPath);
  if (!fs.existsSync(filePath)) return res.status(404).send("The extension download is not available yet.");

  return res.download(filePath, "keshav-with-velo.zip");
});
