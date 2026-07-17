import crypto from "crypto";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { config } from "../config.js";

const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;
const razorpay = config.razorpay.keyId && config.razorpay.keySecret
  ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
  : null;

export const checkoutPlans = {
  "India Launch": {
    amount: 9900,
    currency: "INR",
    licenseType: "standard",
    description: "Keshav With Velo India Launch"
  },
  International: {
    amount: 100,
    currency: "USD",
    licenseType: "standard",
    description: "Keshav With Velo International"
  }
};

export async function createRazorpayOrder({ plan, productId }) {
  if (!razorpay) {
    const error = new Error("Razorpay is not configured");
    error.statusCode = 503;
    throw error;
  }

  const details = checkoutPlans[plan] || checkoutPlans["India Launch"];
  const receipt = `${productId}-${Date.now()}`.slice(0, 40);

  const order = await razorpay.orders.create({
    amount: details.amount,
    currency: details.currency,
    receipt,
    notes: {
      productId,
      plan
    }
  });

  return {
    keyId: config.razorpay.keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    plan,
    licenseType: details.licenseType,
    description: details.description
  };
}

export async function verifyPayment({ paymentProvider, paymentId, razorpayOrderId, razorpaySignature }) {
  if (config.nodeEnv !== "production" && paymentProvider === "manual") {
    return { verified: true, amount: 9900, currency: "INR", raw: { mode: "manual-dev" } };
  }

  if (paymentProvider === "stripe") {
    if (!stripe) return { verified: false, reason: "Stripe is not configured" };

    const session = await stripe.checkout.sessions.retrieve(paymentId);
    if (session.payment_status !== "paid") {
      return { verified: false, reason: "Stripe payment is not paid" };
    }

    return {
      verified: true,
      amount: session.amount_total,
      currency: session.currency,
      raw: session
    };
  }

  if (paymentProvider === "razorpay") {
    if (!razorpay) return { verified: false, reason: "Razorpay is not configured" };

    const expected = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return { verified: false, reason: "Razorpay signature verification failed" };
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (!["captured", "authorized"].includes(payment.status)) {
      return { verified: false, reason: "Razorpay payment is not captured" };
    }

    return {
      verified: true,
      amount: payment.amount,
      currency: payment.currency,
      raw: payment
    };
  }

  return { verified: false, reason: "Unsupported payment provider" };
}
