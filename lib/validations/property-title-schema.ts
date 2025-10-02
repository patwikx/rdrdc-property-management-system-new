import * as z from "zod";

export const PropertyTitleSchema = z.object({
  propertyId: z.string().min(1, {
    message: "Property ID is required",
  }),
  titleNo: z.string().min(1, {
    message: "Title number is required",
  }).max(100, {
    message: "Title number must be less than 100 characters",
  }),
  lotNo: z.string().min(1, {
    message: "Lot number is required",
  }).max(100, {
    message: "Lot number must be less than 100 characters",
  }),
  lotArea: z.number().min(0.01, {
    message: "Lot area must be greater than 0",
  }),
  registeredOwner: z.string().min(1, {
    message: "Registered owner is required",
  }).max(200, {
    message: "Registered owner must be less than 200 characters",
  }),
  isEncumbered: z.boolean().optional(),
  encumbranceDetails: z.string().optional(),
});

export const PropertyTitleUpdateSchema = PropertyTitleSchema.partial().extend({
  id: z.string().min(1, {
    message: "Title ID is required",
  }),
});

export type PropertyTitleFormData = z.infer<typeof PropertyTitleSchema>;
export type PropertyTitleUpdateData = z.infer<typeof PropertyTitleUpdateSchema>;