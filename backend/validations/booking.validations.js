import { z } from "zod";

// ek booking me max 6 seats
export const createBookingSchema = z.object({
  tripId: z.uuid({ error: "Valid tripId is required" }),
  seatIds: z
    .array(z.uuid({ error: "Invalid seat id" }), { error: "seatIds must be an array" })
    .min(1, "Select at least 1 seat")
    .max(6, "You can book at most 6 seats")
    .refine((ids) => new Set(ids).size === ids.length, { error: "Duplicate seats not allowed" }),
});

// URL ke :id ke liye
export const bookingIdParamSchema = z.object({
  id: z.uuid({ error: "Invalid booking id" }),
});