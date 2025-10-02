import * as z from "zod";
import { PropertyType } from "@prisma/client";

export const PropertySchema = z.object({
  propertyCode: z.string().min(1, {
    message: "Property code is required",
  }).max(50, {
    message: "Property code must be less than 50 characters",
  }),
  propertyName: z.string().min(1, {
    message: "Property name is required",
  }).max(200, {
    message: "Property name must be less than 200 characters",
  }),
  leasableArea: z.number().min(0.01, {
    message: "Leasable area must be greater than 0",
  }),
  address: z.string().min(1, {
    message: "Address is required",
  }).max(500, {
    message: "Address must be less than 500 characters",
  }),
  propertyType: z.nativeEnum(PropertyType, {
    message: "Please select a valid property type",
  }),
  totalUnits: z.number().min(0, {
    message: "Total units must be 0 or greater",
  }).optional(),
});

export const PropertyUpdateSchema = PropertySchema.partial().extend({
  id: z.string().min(1, {
    message: "Property ID is required",
  }),
});

export type PropertyFormData = z.infer<typeof PropertySchema>;
export type PropertyUpdateData = z.infer<typeof PropertyUpdateSchema>;