// types/tenant-form.ts
import { z } from "zod"

export const TenantSchema = z.object({
  // Basic Info
  bpCode: z.string().min(1, "BP Code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  
  // Contact Info
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  
  // Business Info
  company: z.string().min(1, "Company is required"),
  businessName: z.string().min(1, "Business name is required"),
  
  // Optional Lease Info
  createLease: z.boolean(),
  propertyId: z.string().optional(),
  selectedUnits: z.array(z.object({
    unitId: z.string(),
    customRentAmount: z.number().optional(),
    floorOverrides: z.array(z.object({
      floorId: z.string(),
      customRate: z.number().optional(),
      customRent: z.number().optional(),
    })).optional(),
  })).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  totalRentAmount: z.number().optional(),
  securityDeposit: z.number().optional(),
  leaseStatus: z.enum(['ACTIVE', 'PENDING']).optional(),
})

export type TenantFormData = z.infer<typeof TenantSchema>

export interface FloorOverride {
  floorId: string
  customRate: number
  customRent: number
}

export interface SelectedUnitData {
  unit: UnitData
  customRentAmount: number
  floorOverrides: FloorOverride[]
}

export type UnitData = {
  id: string
  unitNumber: string | null
  status: string
  totalArea: number | null
  totalRent: number | null
  propertyTitle?: {
    titleNo: string
  } | null
  unitFloors?: Array<{
    id: string
    floorType: string | null
    area: number | null
    rate: number | null
    rent: number | null
  }> | null
}

export const statusOptions = [
  { 
    value: 'PENDING' as const, 
    label: "Pending", 
    description: "Application under review",
    color: "bg-yellow-600"
  },
  { 
    value: 'ACTIVE' as const, 
    label: "Active", 
    description: "Approved and active tenant",
    color: "bg-green-600"
  },
  { 
    value: 'INACTIVE' as const, 
    label: "Inactive", 
    description: "Inactive or suspended",
    color: "bg-gray-600"
  },
]