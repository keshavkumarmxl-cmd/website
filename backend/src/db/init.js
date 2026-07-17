import bcrypt from "bcryptjs";
import { db } from "./connection.js";
import { config } from "../config.js";

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  purchase_history TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  amount INTEGER,
  currency TEXT,
  status TEXT NOT NULL,
  raw_payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(payment_provider, payment_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_hash TEXT NOT NULL UNIQUE,
  license_hint TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  activation_date TEXT,
  device_id INTEGER,
  last_verification TEXT,
  expiry_date TEXT,
  license_type TEXT NOT NULL DEFAULT 'standard',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_id INTEGER NOT NULL,
  hardware_fingerprint_hash TEXT NOT NULL,
  activation_timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(license_id, hardware_fingerprint_hash),
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activation_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  license_hint TEXT,
  device_fingerprint_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  result TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS extension_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  download_path TEXT NOT NULL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_license_id ON devices(license_id);
CREATE INDEX IF NOT EXISTS idx_activation_attempts_created ON activation_attempts(created_at);
`);

const admin = db.prepare("SELECT id FROM admins WHERE email = ?").get(config.adminEmail);
if (!admin) {
  db.prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)").run(
    config.adminEmail,
    bcrypt.hashSync(config.adminPassword, 12)
  );
}

const activeVersion = db.prepare("SELECT id FROM extension_versions WHERE is_active = 1").get();
if (!activeVersion) {
  db.prepare(`
    INSERT OR IGNORE INTO extension_versions (version, download_path, notes, is_active)
    VALUES (?, ?, ?, 1)
  `).run("1.0.0", config.extensionZipPath, "Initial extension ZIP");
}

console.log("Database initialized.");
