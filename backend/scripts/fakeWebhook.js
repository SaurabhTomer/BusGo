// usage: node scripts/fakeWebhook.js order_xxx
// Razorpay jaisi payment.captured event server ko bhejta hai
import "dotenv/config";
import crypto from "crypto";

const orderId = process.argv[2];
const URL = "http://localhost:8000/api/payments/webhook";

const body = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_webhook123", order_id: orderId } } },
});

// signature raw body pe, webhook secret se
const signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

const res = await fetch(URL, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-razorpay-signature": signature },
  body,
});
console.log(res.status, await res.text());