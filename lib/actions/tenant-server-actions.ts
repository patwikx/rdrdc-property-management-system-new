"use server"

import { 
  getAllTenants, 
  getTenantById, 
  createTenant, 
  updateTenant, 
  deleteTenant,
  TenantWithDetails 
} from "./tenant-actions"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface TenantFormData {
  bpCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  company: string
  businessName: string
  status: "ACTIVE" | "INACTIVE" | "PENDING"
  // Personal Information
  homeAddress?: string
  facebookName?: string
  // Business Information
  natureOfBusiness?: string
  yearsInBusiness?: string
  positionInCompany?: string
  officeAddress?: string
  facebookPage?: string
  website?: string
  authorizedSignatory?: string
  isStore?: boolean
  isOffice?: boolean
  isFranchise?: boolean
  // Bank Details
  bankName1?: string
  bankAddress1?: string
  bankName2?: string
  bankAddress2?: string
  // Other Business
  otherBusinessName?: string
  otherBusinessAddress?: string
}

interface FloorOverride {
  floorId: string
  customRate?: number
  customRent?: number
}

interface SelectedUnit {
  unitId: string
  customRentAmount?: number
  floorOverrides?: FloorOverride[]
}

interface LeaseData {
  selectedUnits: SelectedUnit[]
  startDate: Date
  endDate: Date
  totalRentAmount: number
  securityDeposit?: number
  leaseStatus: "ACTIVE" | "PENDING"
}

interface TenantWithLeaseData extends TenantFormData {
  createLease: boolean
  leaseData?: LeaseData
}

// Return types for proper TypeScript handling
interface CreateTenantWithLeaseSuccess {
  success: true
  data: {
    tenant: {
      id: string
      bpCode: string
      firstName: string | null
      lastName: string | null
      email: string
      phone: string
      emergencyContactName: string | null
      emergencyContactPhone: string | null
      company: string
      businessName: string
      status: string
      createdAt: Date
      updatedAt: Date
      userId: string | null
      createdById: string | null
    }
    lease?: {
      id: string
      tenantId: string
      startDate: Date
      endDate: Date
      totalRentAmount: number
      securityDeposit: number
      status: string
      terminationDate: Date | null
      terminationReason: string | null
      createdAt: Date
      updatedAt: Date
    }
    leaseUnits?: {
      id: string
      leaseId: string
      unitId: string
      rentAmount: number
      createdAt: Date
      updatedAt: Date
    }[]
  }
}

interface CreateTenantWithLeaseError {
  success: false
  error: string
}

type CreateTenantWithLeaseResult = CreateTenantWithLeaseSuccess | CreateTenantWithLeaseError

export async function getAllTenantsAction(): Promise<TenantWithDetails[]> {
  return await getAllTenants()
}

export async function getTenantByIdAction(id: string): Promise<TenantWithDetails | null> {
  return await getTenantById(id)
}

export async function createTenantAction(data: TenantFormData) {
  return await createTenant({
    ...data,
    isStore: data.isStore ?? false,
    isOffice: data.isOffice ?? false,
    isFranchise: data.isFranchise ?? false,
  })
}

export async function createTenantWithLeaseAction(data: TenantWithLeaseData): Promise<CreateTenantWithLeaseResult> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the tenant first
      const tenantResult = await createTenant({
        bpCode: data.bpCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        company: data.company,
        businessName: data.businessName,
        status: data.status,
        isStore: data.isStore ?? false,
        isOffice: data.isOffice ?? false,
        isFranchise: data.isFranchise ?? false,
      })

      if (tenantResult.error) {
        throw new Error(tenantResult.error)
      }

      const tenant = tenantResult.data
      if (!tenant) {
        throw new Error("Failed to create tenant")
      }

      // 2. If lease creation is requested, create the lease
      if (data.createLease && data.leaseData) {
        const lease = await tx.lease.create({
          data: {
            tenantId: tenant.id,
            startDate: data.leaseData.startDate,
            endDate: data.leaseData.endDate,
            totalRentAmount: data.leaseData.totalRentAmount,
            securityDeposit: data.leaseData.securityDeposit || 0,
            status: data.leaseData.leaseStatus,
          },
        })

        // 3. Create lease units for each selected unit
        const leaseUnits = await Promise.all(
          data.leaseData.selectedUnits.map(async (selectedUnit) => {
            return await tx.leaseUnit.create({
              data: {
                leaseId: lease.id,
                unitId: selectedUnit.unitId,
                rentAmount: selectedUnit.customRentAmount || 0,
              },
            })
          })
        )

        // Note: Floor overrides are not stored in a separate table according to your schema
        // The custom rates are calculated and stored as the total rentAmount per unit
        // If you need to track individual floor rates, you'd need to add a LeaseUnitFloor model

        return {
          success: true,
          data: {
            tenant,
            lease,
            leaseUnits,
          },
        } as CreateTenantWithLeaseSuccess
      }

      return {
        success: true,
        data: {
          tenant,
        },
      } as CreateTenantWithLeaseSuccess
    })

    return result
  } catch (error) {
    console.error("Error creating tenant with lease:", error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: "Failed to create tenant with lease",
    }
  }
}

export async function updateTenantAction(id: string, data: Partial<TenantFormData>) {
  return await updateTenant(id, data)
}

export async function deleteTenantAction(id: string) {
  return await deleteTenant(id)
}