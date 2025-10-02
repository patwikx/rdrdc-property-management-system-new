import * as z from "zod";
import { UnitStatus } from "@prisma/client";

export const UnitSchema = z.object({
  propertyId: z.string().min(1, {
    message: "Property ID is required",
  }),
  unitNumber: z.string().min(1, {
    message: "Unit number is required",
  }).max(50, {
    message: "Unit number must be less than 50 characters",
  }),
  totalArea: z.number().min(0.01, {
    message: "Total area must be greater than 0",
  }),
  totalRent: z.number().min(0, {
    message: "Total rent must be 0 or greater",
  }),
  status: z.nativeEnum(UnitStatus, {
    message: "Please select a valid unit status",
  }),
  propertyTitleId: z.string().optional(),
});

export const UnitUpdateSchema = UnitSchema.partial().extend({
  id: z.string().min(1, {
    message: "Unit ID is required",
  }),
});

export type UnitFormData = z.infer<typeof UnitSchema>;
export type UnitUpdateData = z.infer<typeof UnitUpdateSchema>;