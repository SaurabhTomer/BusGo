import { z } from "zod"; // zod import

const name = z
  .string({ error: "City name is required" }) // field hona chahiye
  .trim() // spaces hata do
  .min(2, "City name must be at least 2 characters") // minimum 2 letters
  .max(50, "City name can be at most 50 characters") // maximum 50 letters
  .regex(/^[A-Za-z .'-]+$/, "City name can only have letters, spaces, dot, dash"); // sirf letters wagairah

const state = z.string().trim().min(2, "State is too short").max(50, "State is too long");

// city banane ke liye
const createCitySchema = z.object({
  name,
  state: state.optional(), // state optional
});

// city update ke liye: koi bhi field bhej sakte hain
const updateCitySchema = z
  .object({
    name: name.optional(),
    state: state.optional(),
    isActive: z.boolean({ error: "isActive must be true or false" }).optional(), // dobara chalu karne ke liye
  })
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update"); // khali body na ho

// URL ki id check
const idParamSchema = z.object({
  id: z.uuid("Invalid city id"),
});

export { createCitySchema, updateCitySchema, idParamSchema };