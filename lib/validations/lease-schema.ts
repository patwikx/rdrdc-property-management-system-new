import { z } from "zod"

export const LeaseSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  startDate: z.date({
    message: "Start date is required",
  }),
  endDate: z.date({
    message: "End date is required",
  }),
  securityDeposit: z.number().min(0, "Security deposit must be positive"),
  unitIds: z.array(z.string()).min(1, "At least one unit is required"),
  unitRentAmounts: z.record(z.string(), z.number().min(0, "Rent amount must be positive"))
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine((data) => {
  // Ensure all selected units have rent amounts
  return data.unitIds.every(unitId => 
    data.unitRentAmounts[unitId] !== undefined && data.unitRentAmounts[unitId] > 0
  )
}, {
  message: "All selected units must have rent amounts",
  path: ["unitRentAmounts"],
})

export const LeaseUpdateSchema = z.object({
  id: z.string().min(1, "Lease ID is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  securityDeposit: z.number().min(0, "Security deposit must be positive").optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'TERMINATED', 'EXPIRED']).optional(),
  terminationDate: z.date().nullable().optional(),
  terminationReason: z.string().nullable().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const LeaseTerminationSchema = z.object({
  id: z.string().min(1, "Lease ID is required"),
  reason: z.string().min(1, "Termination reason is required")
})

export type LeaseFormData = z.infer<typeof LeaseSchema>
export type LeaseUpdateFormData = z.infer<typeof LeaseUpdateSchema>
export type LeaseTerminationFormData = z.infer<typeof LeaseTerminationSchema>