import { z } from "zod";

export const purchaseSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  productId: z.string().trim().min(2),
  paymentProvider: z.enum(["manual", "stripe", "razorpay"]),
  paymentId: z.string().trim().min(2),
  razorpayOrderId: z.string().trim().optional(),
  razorpaySignature: z.string().trim().optional(),
  licenseType: z.enum(["standard", "lifetime", "trial"]).default("standard")
});

export const razorpayOrderSchema = z.object({
  productId: z.string().trim().min(2),
  plan: z.enum(["India Launch", "International"]).default("India Launch")
});

export const activateSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  licenseKey: z.string().trim().min(19).max(32),
  deviceFingerprint: z.string().trim().min(8).max(512)
});

export const verifyLicenseSchema = z.object({
  licenseKey: z.string().trim().min(19).max(32),
  deviceFingerprint: z.string().trim().min(8).max(512)
});

export const downloadSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  licenseKey: z.string().trim().min(19).max(32)
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8)
});

export const manualLicenseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  licenseType: z.enum(["standard", "lifetime", "trial"]).default("standard"),
  expiryDays: z.number().int().min(1).max(3650).optional()
});

export const versionSchema = z.object({
  version: z.string().trim().min(1).max(40),
  downloadPath: z.string().trim().min(3),
  notes: z.string().trim().max(1000).optional(),
  isActive: z.boolean().default(false)
});
