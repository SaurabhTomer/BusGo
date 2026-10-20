import { z } from "zod"; 


export const idParamSchema = z.object({
  id: z.uuid("Invalid id"), 
});

// list ke filter: /operators?status=PENDING (optional)
export const listQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], {
      error: "Status must be PENDING, APPROVED, REJECTED or SUSPENDED",
    })
    .optional(), // na bheje to saare operators
});


export const rejectSchema = z.object({
  reason: z
    .string({ error: "Rejection reason is required" }) 
    .trim() 
    .min(5, "Reason must be at least 5 characters") 
    .max(200, "Reason can be at most 200 characters"), 
});

