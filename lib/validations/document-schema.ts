import { z } from "zod"
import { DocumentType } from "@prisma/client"

export const DocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  fileUrl: z.string().min(1, "File URL is required"),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
})

export const DocumentUpdateSchema = DocumentSchema.extend({
  id: z.string().min(1, "Document ID is required"),
}).partial().required({ id: true })

export type DocumentFormData = z.infer<typeof DocumentSchema>
export type DocumentUpdateData = z.infer<typeof DocumentUpdateSchema>