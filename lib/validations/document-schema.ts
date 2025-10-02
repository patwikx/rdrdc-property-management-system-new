import * as z from "zod";
import { DocumentType } from "@prisma/client";

export const DocumentSchema = z.object({
  name: z.string().min(1, {
    message: "Document name is required",
  }).max(200, {
    message: "Document name must be less than 200 characters",
  }),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType, {
    message: "Please select a valid document type",
  }),
  fileUrl: z.string().min(1, {
    message: "File URL is required",
  }),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  uploadedById: z.string().optional(),
});

export const DocumentUpdateSchema = DocumentSchema.partial().extend({
  id: z.string().min(1, {
    message: "Document ID is required",
  }),
});

export type DocumentFormData = z.infer<typeof DocumentSchema>;
export type DocumentUpdateData = z.infer<typeof DocumentUpdateSchema>;