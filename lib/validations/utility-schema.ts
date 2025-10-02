import * as z from "zod";
import { UtilityType } from "@prisma/client";

export const PropertyUtilitySchema = z.object({
  propertyId: z.string().min(1, {
    message: "Property ID is required",
  }),
  utilityType: z.nativeEnum(UtilityType, {
    message: "Please select a valid utility type",
  }),
  provider: z.string().min(1, {
    message: "Provider name is required",
  }).max(200, {
    message: "Provider name must be less than 200 characters",
  }),
  accountNumber: z.string().min(1, {
    message: "Account number is required",
  }).max(100, {
    message: "Account number must be less than 100 characters",
  }),
  meterNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const PropertyUtilityUpdateSchema = PropertyUtilitySchema.partial().extend({
  id: z.string().min(1, {
    message: "Utility ID is required",
  }),
});

export type PropertyUtilityFormData = z.infer<typeof PropertyUtilitySchema>;
export type PropertyUtilityUpdateData = z.infer<typeof PropertyUtilityUpdateSchema>;