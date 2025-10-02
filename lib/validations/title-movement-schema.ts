import * as z from "zod";
import { TitleMovementStatus } from "@prisma/client";

export const TitleMovementSchema = z.object({
  propertyId: z.string().min(1, {
    message: "Property ID is required",
  }),
  requestedBy: z.string().optional(),
  status: z.nativeEnum(TitleMovementStatus, {
    message: "Please select a valid status",
  }),
  location: z.string().min(1, {
    message: "Location is required",
  }).max(200, {
    message: "Location must be less than 200 characters",
  }),
  purpose: z.string().min(1, {
    message: "Purpose is required",
  }).max(500, {
    message: "Purpose must be less than 500 characters",
  }),
  remarks: z.string().optional(),
  requestDate: z.date({
    message: "Request date is required",
  }),
  returnDate: z.date().optional(),
});

export const TitleMovementUpdateSchema = TitleMovementSchema.partial().extend({
  id: z.string().min(1, {
    message: "Movement ID is required",
  }),
});

export type TitleMovementFormData = z.infer<typeof TitleMovementSchema>;
export type TitleMovementUpdateData = z.infer<typeof TitleMovementUpdateSchema>;