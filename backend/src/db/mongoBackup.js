import { MongoClient } from "mongodb";
import { config } from "../config.js";

let clientPromise = null;
let indexesReady = false;

export function isMongoBackupEnabled() {
  return Boolean(config.mongo.uri);
}

async function getDb() {
  if (!isMongoBackupEnabled()) return null;

  if (!clientPromise) {
    const client = new MongoClient(config.mongo.uri, {
      serverSelectionTimeoutMS: 5000
    });
    clientPromise = client.connect()
      .then(async (connectedClient) => {
        console.log("[mongo-backup] connected");
        return connectedClient;
      })
      .catch((error) => {
        clientPromise = null;
        console.error("[mongo-backup] connection failed", error);
        throw error;
      });
  }

  const client = await clientPromise;
  const db = client.db(config.mongo.dbName);

  if (!indexesReady) {
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("licenses").createIndex({ licenseHash: 1 }, { unique: true }),
      db.collection("licenses").createIndex({ email: 1 }),
      db.collection("purchases").createIndex({ paymentProvider: 1, paymentId: 1 }, { unique: true }),
      db.collection("devices").createIndex({ licenseHash: 1, deviceHash: 1 }, { unique: true }),
      db.collection("activationAttempts").createIndex({ createdAt: -1 })
    ]);
    indexesReady = true;
  }

  return db;
}

async function safeRun(label, fn) {
  if (!isMongoBackupEnabled()) return null;
  try {
    return await fn(await getDb());
  } catch (error) {
    console.error(`[mongo-backup] ${label} failed`, error);
    return null;
  }
}

export async function mirrorPurchase({ user, license, purchase }) {
  return safeRun("mirrorPurchase", async (db) => {
    const now = new Date();

    await db.collection("users").updateOne(
      { email: user.email },
      {
        $set: {
          name: user.name,
          email: user.email,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: user.created_at ? new Date(user.created_at) : now
        }
      },
      { upsert: true }
    );

    await db.collection("licenses").updateOne(
      { licenseHash: license.licenseHash },
      {
        $set: {
          licenseHash: license.licenseHash,
          licenseHint: license.licenseHint,
          email: user.email,
          status: license.status || "inactive",
          licenseType: license.licenseType || "standard",
          expiryDate: license.expiryDate || null,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    if (purchase) {
      await db.collection("purchases").updateOne(
        { paymentProvider: purchase.paymentProvider, paymentId: purchase.paymentId },
        {
          $set: {
            ...purchase,
            email: user.email,
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        { upsert: true }
      );
    }
  });
}

export async function mongoPurchaseExists(paymentProvider, paymentId) {
  return safeRun("mongoPurchaseExists", async (db) => {
    return db.collection("purchases").findOne({ paymentProvider, paymentId });
  });
}

export async function findMongoLicenseByHash(licenseHash) {
  return safeRun("findMongoLicenseByHash", async (db) => {
    return db.collection("licenses").findOne({ licenseHash });
  });
}

export async function activateMongoLicense({ licenseHash, email, deviceHash }) {
  return safeRun("activateMongoLicense", async (db) => {
    const license = await db.collection("licenses").findOne({ licenseHash });
    if (!license || license.email !== email) return null;
    if (license.status === "blocked") return { status: "blocked" };
    if (license.expiryDate && new Date(license.expiryDate).getTime() < Date.now()) {
      await db.collection("licenses").updateOne({ licenseHash }, { $set: { status: "expired", updatedAt: new Date() } });
      return { status: "expired" };
    }

    const existingDevice = await db.collection("devices").findOne({ licenseHash });
    if (existingDevice && existingDevice.deviceHash !== deviceHash) {
      return { status: "device_mismatch" };
    }

    const now = new Date();
    await db.collection("devices").updateOne(
      { licenseHash, deviceHash },
      {
        $set: {
          licenseHash,
          deviceHash,
          lastActivity: now
        },
        $setOnInsert: {
          activationTimestamp: now
        }
      },
      { upsert: true }
    );

    await db.collection("licenses").updateOne(
      { licenseHash },
      {
        $set: {
          status: "active",
          deviceHash,
          activationDate: license.activationDate || now,
          lastVerification: now,
          updatedAt: now
        }
      }
    );

    return { status: "success" };
  });
}

export async function verifyMongoLicense({ licenseHash, deviceHash }) {
  return safeRun("verifyMongoLicense", async (db) => {
    const license = await db.collection("licenses").findOne({ licenseHash });
    if (!license) return null;
    if (license.status === "blocked") return { status: "blocked" };
    if (license.expiryDate && new Date(license.expiryDate).getTime() < Date.now()) {
      await db.collection("licenses").updateOne({ licenseHash }, { $set: { status: "expired", updatedAt: new Date() } });
      return { status: "expired" };
    }
    if (!license.deviceHash) return { status: "invalid", reason: "License is not activated" };
    if (license.deviceHash !== deviceHash) return { status: "invalid", reason: "Device mismatch" };

    const now = new Date();
    await Promise.all([
      db.collection("devices").updateOne({ licenseHash, deviceHash }, { $set: { lastActivity: now } }),
      db.collection("licenses").updateOne({ licenseHash }, { $set: { lastVerification: now, updatedAt: now } })
    ]);

    return {
      status: "valid",
      licenseType: license.licenseType,
      expiryDate: license.expiryDate || null
    };
  });
}

export async function logMongoActivationAttempt(payload) {
  return safeRun("logMongoActivationAttempt", async (db) => {
    await db.collection("activationAttempts").insertOne({
      ...payload,
      createdAt: new Date()
    });
  });
}
