import { z } from "zod"; 

// city id (dropdown se aayegi, GET /api/cities wali id)
const sourceCityId = z.uuid({ error: "Select a valid source city" });
const destinationCityId = z.uuid({ error: "Select a valid destination city" });

const distanceKm = z
  .number({ error: "Distance must be a number" }) 
  .int("Distance must be a whole number") 
  .min(1, "Distance must be at least 1 km") 
  .max(5000, "Distance can be at most 5000 km"); 


export const createRouteSchema = z
  .object({
    sourceCityId,
    destinationCityId,
    distanceKm: distanceKm.optional(), 
  })
  .refine((data) => data.sourceCityId !== data.destinationCityId, {
    error: "Source and destination cannot be same", 
    path: ["destinationCityId"],
  });

// sirf distance badal sakte hain
export const updateRouteSchema = z.object({
  distanceKm,
});


export const idParamSchema = z.object({
  id: z.uuid("Invalid route id"),
});

