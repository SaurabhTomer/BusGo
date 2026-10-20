import { z } from "zod"; 



const name = z
  .string({ error: "Bus name is required" }) 
  .trim() 
  .min(2, "Bus name must be at least 2 characters") 
  .max(60, "Bus name can be at most 60 characters"); 

const busNumber = z
  .string({ error: "Bus number is required" }) 
  .trim() 
  .toUpperCase() 
  .regex(/^[A-Z0-9 -]{4,15}$/, "Enter a valid bus number"); // letters, numbers, space, dash, 4 se 15 characters

const type = z.enum(["SEATER", "SLEEPER"], {
  error: "Bus type must be SEATER or SLEEPER", 
});

const totalSeats = z
  .number({ error: "Total seats is required" }) // number 
  .int("Total seats must be a whole number") // decimal nahi
  .min(1, "Bus must have at least 1 seat") 
  .max(60, "Bus can have at most 60 seats");

// ----------  schemas ----------


const createBusSchema = z.object({
  name,
  busNumber,
  type,
  totalSeats,
});

// bus update karne ke liye except busnumber and totalseats
const updateBusSchema = z
  .object({
    name: name.optional(),
    type: type.optional(),
    isActive: z.boolean({ error: "isActive must be true or false" }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update"); // khali body na ho

// check busid send in param
const idParamSchema = z.object({
  id: z.uuid("Invalid bus id"), 
});

export { createBusSchema, updateBusSchema, idParamSchema };