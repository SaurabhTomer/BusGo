import { z } from "zod"; 

// /search/trips?from=...&to=...&date=2026-11-05
export const searchTripsSchema = z
  .object({
    from: z.uuid({ error: "Select a valid from city" }), // id of city
    to: z.uuid({ error: "Select a valid to city" }), 
    date: z.iso.date({ error: "Date must be like 2026-11-05" }), // (YYYY-MM-DD)
  })
  .refine((data) => data.from !== data.to, {
    error: "From and to city cannot be same", 
    path: ["to"],
  });

