import { z } from "zod";
 

export const createOrderSchema = z.object({
  bookingId: z.uuid({ error: "Valid bookingId is required" }),
});
 
// payment ke baad frontend ko Razorpay se ye 3 cheezein milti hain
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string({ error: "razorpay_order_id is required" }).min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string({ error: "razorpay_payment_id is required" }).min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string({ error: "razorpay_signature is required" }).min(1, "razorpay_signature is required"),
});
 