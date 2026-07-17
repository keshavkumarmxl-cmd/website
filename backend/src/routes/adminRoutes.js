import bcrypt from "bcryptjs";
import express from "express";
import { db } from "../db/connection.js";
import { validate } from "../middleware/validate.js";
import { createAdminToken, requireAdmin } from "../middleware/auth.js";
import { adminLoginSchema, manualLicenseSchema, versionSchema } from "../schemas.js";
import { expiryDate, generateLicenseKey, hashLicenseKey, licenseHint } from "../utils/license.js";

export const adminRoutes = express.Router();

adminRoutes.post("/login", validate(adminLoginSchema), (req, res) => {
  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(req.body.email);
  if (!admin || !bcrypt.compareSync(req.body.password, admin.password_hash)) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  return res.json({ token: createAdminToken(admin) });
});

adminRoutes.use(requireAdmin);

adminRoutes.get("/users", (req, res) => {
  const rows = db.prepare(`
    SELECT users.id, users.name, users.email, users.purchase_history, users.created_at,
      COUNT(licenses.id) AS license_count
    FROM users
    LEFT JOIN licenses ON licenses.user_id = users.id
    GROUP BY users.id
    ORDER BY users.created_at DESC
  `).all();

  res.json(rows.map((row) => ({ ...row, purchase_history: JSON.parse(row.purchase_history || "[]") })));
});

adminRoutes.get("/licenses", (req, res) => {
  const q = `%${String(req.query.q || "").trim()}%`;
  const rows = db.prepare(`
    SELECT licenses.id, licenses.license_hint, licenses.status, licenses.activation_date,
      licenses.device_id, licenses.last_verification, licenses.expiry_date, licenses.license_type,
      licenses.created_at, users.name, users.email
    FROM licenses
    JOIN users ON users.id = licenses.user_id
    WHERE users.email LIKE ? OR users.name LIKE ? OR licenses.license_hint LIKE ?
    ORDER BY licenses.created_at DESC
  `).all(q, q, q);

  res.json(rows);
});

adminRoutes.post("/licenses/:id/block", (req, res) => {
  db.prepare("UPDATE licenses SET status = 'blocked' WHERE id = ?").run(req.params.id);
  res.json({ status: "success" });
});

adminRoutes.post("/licenses/:id/unblock", (req, res) => {
  db.prepare("UPDATE licenses SET status = CASE WHEN device_id IS NULL THEN 'inactive' ELSE 'active' END WHERE id = ?").run(req.params.id);
  res.json({ status: "success" });
});

adminRoutes.post("/licenses/:id/reset-device", (req, res) => {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM devices WHERE license_id = ?").run(req.params.id);
    db.prepare(`
      UPDATE licenses
      SET status = 'inactive', device_id = NULL, activation_date = NULL, last_verification = NULL
      WHERE id = ?
    `).run(req.params.id);
  });
  tx();
  res.json({ status: "success" });
});

adminRoutes.get("/activation-attempts", (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM activation_attempts
    ORDER BY created_at DESC
    LIMIT 250
  `).all();
  res.json(rows);
});

adminRoutes.post("/manual-license", validate(manualLicenseSchema), (req, res) => {
  const { name, email, licenseType, expiryDays } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  const userId = user
    ? user.id
    : db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run(name, email).lastInsertRowid;

  for (let i = 0; i < 8; i += 1) {
    const key = generateLicenseKey();
    try {
      db.prepare(`
        INSERT INTO licenses (license_hash, license_hint, user_id, status, expiry_date, license_type)
        VALUES (?, ?, ?, 'inactive', ?, ?)
      `).run(hashLicenseKey(key), licenseHint(key), userId, expiryDate(expiryDays || 365), licenseType);
      return res.status(201).json({ status: "success", email, licenseKey: key });
    } catch (error) {
      if (!String(error.message).includes("UNIQUE")) throw error;
    }
  }

  return res.status(500).json({ error: "Could not generate manual license" });
});

adminRoutes.get("/versions", (req, res) => {
  res.json(db.prepare("SELECT * FROM extension_versions ORDER BY created_at DESC").all());
});

adminRoutes.post("/versions", validate(versionSchema), (req, res) => {
  const tx = db.transaction(() => {
    if (req.body.isActive) {
      db.prepare("UPDATE extension_versions SET is_active = 0").run();
    }

    db.prepare(`
      INSERT INTO extension_versions (version, download_path, notes, is_active)
      VALUES (?, ?, ?, ?)
    `).run(req.body.version, req.body.downloadPath, req.body.notes || null, req.body.isActive ? 1 : 0);
  });

  tx();
  res.status(201).json({ status: "success" });
});
