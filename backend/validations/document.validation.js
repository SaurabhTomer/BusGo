import { z } from "zod";
 

export const uploadDocumentSchema = z.object({
  type: z.enum(["PAN", "GST"], { error: "type must be PAN or GST" }),
});
 

export const idParamSchema = z.object({
  id: z.uuid({ error: "Invalid id" }),
});
 