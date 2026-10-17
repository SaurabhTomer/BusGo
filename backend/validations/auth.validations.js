
import { z } from "zod";


// NAME rule
const name = z
  .string({ error: "Name is required" })        // give this error if name field is empty or name is not in string
  .trim() 
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name can be at most 50 characters")
  .regex(/^[A-Za-z ]+$/, "Name can only have letters and spaces"); 

// EMAIL rule
const email = z
  .string({ error: "Email is required" }) 
  .trim() 
  .toLowerCase() 
  .pipe(z.email("Enter a valid email")); //  email format check 

// PHONE rule Indian Number
const phone = z
  .string({ error: "Phone is required" }) 
  .trim() // spaces hata do
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian phone number"); 

// PASSWORD rule
const password = z
  .string({ error: "Password is required" }) 
  .min(8, "Password must be at least 8 characters") 
  .max(64, "Password can be at most 64 characters"); 


// OTP rule
const otp = z
  .string({ error: "OTP is required" }) 
  .trim() 
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits"); 


  
// ----------  schemas  ----------

const sendOtpSchema = z.object({
  phone, // phone check
});

const verifyOtpSchema = z.object({
  phone, // kis phone ka OTP hai
  otp, // user ne jo OTP daala
});


const signupSchema = z.object({
  name, // name check
  email, // email check
  phone, // phone check
  password, // password check
});

export { sendOtpSchema, verifyOtpSchema, signupSchema };