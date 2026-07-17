import crypto from "crypto";
import { config } from "../config.js";

export function generateLicenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const groups = [];

  for (let group = 0; group < 4; group += 1) {
    let value = "";
    for (let i = 0; i < 4; i += 1) {
      value += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    groups.push(value);
  }

  return groups.join("-");
}

export function normalizeLicenseKey(key) {
  return String(key || "").trim().toUpperCase();
}

export function licenseHint(key) {
  const normalized = normalizeLicenseKey(key);
  return normalized.length >= 4 ? normalized.slice(-4) : "----";
}

export function hashLicenseKey(key) {
  return crypto
    .createHmac("sha256", config.licenseHashSecret)
    .update(normalizeLicenseKey(key))
    .digest("hex");
}

export function hashFingerprint(fingerprint) {
  return crypto
    .createHash("sha256")
    .update(String(fingerprint || "").trim())
    .digest("hex");
}

export function expiryDate(days = config.licenseExpiryDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function isExpired(dateValue) {
  return Boolean(dateValue && new Date(dateValue).getTime() < Date.now());
}
