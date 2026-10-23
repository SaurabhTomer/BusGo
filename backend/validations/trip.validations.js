import { z } from "zod"; 
const busId = z.uuid({ error: "Select a valid bus" }); 
const routeId = z.uuid({ error: "Select a valid route" }); 

// time ISO format me, timezone ke saath: "2026-11-05T21:00:00+05:30"
// string ko Date me badal dete hain 
const dateTime = (label) =>
  z.iso
    .datetime({ offset: true, error: `${label} must be like 2026-11-05T21:00:00+05:30` })
    .transform((value) => new Date(value));

const price = z
  .number({ error: "Price must be a number" }) 
  .int("Price must be a whole number")
  .min(1, "Price must be at least 1 rupee") 
  .max(20000, "Price can be at most 20000 rupees");



export const createTripSchema = z
  .object({
    busId,
    sourceCityId, 
    destinationCityId, 
    departureTime: dateTime("Departure time"),
    arrivalTime: dateTime("Arrival time"),
    price,
  })
  .refine((data) => data.sourceCityId !== data.destinationCityId, {
    error: "Source and destination cannot be same", 
    path: ["destinationCityId"],
  })
  .refine((data) => data.departureTime > new Date(), {
    error: "Departure time must be in the future", 
    path: ["departureTime"],
  })
  .refine((data) => data.arrivalTime > data.departureTime, {
    error: "Arrival time must be after departure time",
    path: ["arrivalTime"],
  });



export const updateTripSchema = z
  .object({
    price: price.optional(),
    departureTime: dateTime("Departure time").optional(),
    arrivalTime: dateTime("Arrival time").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update"); 



export const listQuerySchema = z.object({
  status: z
    .enum(["SCHEDULED", "CANCELLED", "COMPLETED"], {
      error: "Status must be SCHEDULED, CANCELLED or COMPLETED",
    })
    .optional(),
});



export const idParamSchema = z.object({
  id: z.uuid("Invalid trip id"),
});

