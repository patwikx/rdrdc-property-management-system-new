import * as z from "zod";

export const PropertyTaxSchema = z.object({
  propertyTitleId: z.string().min(1, {
    message: "Property title ID is required",
  }),
  taxYear: z.number().min(1900, {
    message: "Tax year must be valid",
  }).max(new Date().getFullYear() + 10, {
    message: "Tax year cannot be too far in the future",
  }),
  TaxDecNo: z.string().min(1, {
    message: "Tax declaration number is required",
  }).max(100, {
    message: "Tax declaration number must be less than 100 characters",
  }),
  taxAmount: z.number().min(0, {
    message: "Tax amount must be 0 or greater",
  }),
  dueDate: z.date({
    message: "Due date is required",
  }),
  isPaid: z.boolean().optional(),
  paidDate: z.date().optional(),
  remarks: z.string().optional(),
  isAnnual: z.boolean().optional(),
  isQuarterly: z.boolean().optional(),
  whatQuarter: z.string().optional(),
  processedBy: z.string().optional(),
  markedAsPaidBy: z.string().optional(),
  paidRemarks: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const PropertyTaxUpdateSchema = PropertyTaxSchema.partial().extend({
  id: z.string().min(1, {
    message: "Tax ID is required",
  }),
});

export type PropertyTaxFormData = z.infer<typeof PropertyTaxSchema>;
export type PropertyTaxUpdateData = z.infer<typeof PropertyTaxUpdateSchema>;