import { z } from "zod"; 
import { signupSchema } from "./auth.validations.js"; 

// ---------- Operator ke extra fields ----------

const agencyName = z
  .string({ error: "Agency name is required" }) 
  .trim() 
  .min(2, "Agency name must be at least 2 characters") 
  .max(80, "Agency name can be at most 80 characters"); 

const gstNo = z
  .string({ error: "GST number is required" })
  .trim() 
  .toUpperCase() 
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    "Enter a valid 15 character GST number" // GSTIN  format
  );

const contactPhone = z
  .string({ error: "Contact phone is required" }) 
  .trim() 
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian phone number");

const address = z
  .string({ error: "Address is required" })
  .trim() 
  .min(10, "Address must be at least 10 characters")
  .max(200, "Address can be at most 200 characters"); 

// ---------- Asli schema ----------

// operator signup = normal signup ke fields + agency ke fields
 export const operatorSignupSchema = signupSchema.extend({
  agencyName,
  gstNo,
  contactPhone,
  address,
});

export const bookingsQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"], { error: "Invalid status" }).optional(),
});