// usage: node scripts/signPayment.js order_xxx
// /verify test karne ke liye signature banata hai (frontend ke bina)
import "dotenv/config";
import crypto from "crypto";

const orderId = process.argv[2];
const paymentId = "pay_test123456"; // fake chalega, sirf HMAC check hota hai

const signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");

console.log(
  JSON.stringify(
    { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature },
    null,
    2
  )
);