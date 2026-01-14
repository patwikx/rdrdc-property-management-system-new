"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const TenantSchema = z.object({
  bpCode: z.string().min(1, "BP Code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  businessName: z.string().min(1, "Business name is required"),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  // Personal Information
  homeAddress: z.string().optional(),
  facebookName: z.string().optional(),
  // Business Information
  natureOfBusiness: z.string().optional(),
  yearsInBusiness: z.string().optional(),
  positionInCompany: z.string().optional(),
  officeAddress: z.string().optional(),
  facebookPage: z.string().optional(),
  website: z.string().optional(),
  authorizedSignatory: z.string().optional(),
  isStore: z.boolean().optional(),
  isOffice: z.boolean().optional(),
  isFranchise: z.boolean().optional(),
  // Bank Details
  bankName1: z.string().optional(),
  bankAddress1: z.string().optional(),
  bankName2: z.string().optional(),
  bankAddress2: z.string().optional(),
  // Other Business
  otherBusinessName: z.string().optional(),
  otherBusinessAddress: z.string().optional(),
})

type TenantFormData = z.infer<typeof TenantSchema>

export interface TenantWithDetails {
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
  // Personal Information
  homeAddress: string | null
  facebookName: string | null
  // Business Information
  natureOfBusiness: string | null
  yearsInBusiness: string | null
  positionInCompany: string | null
  officeAddress: string | null
  facebookPage: string | null
  website: string | null
  authorizedSignatory: string | null
  isStore: boolean
  isOffice: boolean
  isFranchise: boolean
  // Bank Details
  bankName1: string | null
  bankAddress1: string | null
  bankName2: string | null
  bankAddress2: string | null
  // Other Business
  otherBusinessName: string | null
  otherBusinessAddress: string | null
  // Relations
  leases: {
    id: string
    startDate: Date
    endDate: Date
    totalRentAmount: number
    securityDeposit: number
    status: string
    leaseUnits: {
      id: string
      rentAmount: number
      unit: {
        id: string
        unitNumber: string
        property: {
          id: string
          propertyName: string
        }
      }
    }[]
  }[]
  maintenanceRequests: {
    id: string
    category: string
    priority: string
    description: string
    status: string
    createdAt: Date
  }[]
  documents: {
    id: string
    name: string
    documentType: string
    fileUrl: string
    createdAt: Date
  }[]
  pdcs: {
    id: string
    refNo: string
    bankName: string
    dueDate: Date
    checkNo: string
    amount: number
    status: string
  }[]
  notices: {
    id: string
    noticeType: string
    noticeNumber: number
    totalAmount: number
    forMonth: string
    forYear: number
    dateIssued: Date
    isSettled: boolean
  }[]
}

export async function getAllTenants(): Promise<TenantWithDetails[]> {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        leases: {
          include: {
            leaseUnits: {
              include: {
                unit: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        propertyName: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        maintenanceRequests: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        documents: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        pdcs: {
          orderBy: {
            dueDate: 'desc'
          },
          take: 5
        },
        notices: {
          orderBy: {
            dateIssued: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return tenants
  } catch (error) {
    console.error("Error fetching tenants:", error)
    throw new Error("Failed to fetch tenants")
  }
}

export async function getTenantById(id: string): Promise<TenantWithDetails | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        leases: {
          include: {
            leaseUnits: {
              include: {
                unit: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        propertyName: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        maintenanceRequests: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        documents: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        pdcs: {
          orderBy: {
            dueDate: 'desc'
          }
        },
        notices: {
          orderBy: {
            dateIssued: 'desc'
          }
        }
      }
    })

    return tenant
  } catch (error) {
    console.error("Error fetching tenant:", error)
    return null
  }
}

export async function createTenant(data: TenantFormData) {
  try {
    // Validate the input data
    const validatedData = TenantSchema.parse(data)

    // Check if BP Code already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { bpCode: validatedData.bpCode }
    })

    if (existingTenant) {
      return { error: "A tenant with this BP Code already exists" }
    }

    // Check if email already exists
    const existingEmail = await prisma.tenant.findFirst({
      where: { email: validatedData.email }
    })

    if (existingEmail) {
      return { error: "A tenant with this email already exists" }
    }

    // Create the tenant
    const tenant = await prisma.tenant.create({
      data: validatedData
    })

    return { success: true, data: tenant }
  } catch (error) {
    console.error("Error creating tenant:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        error: "Invalid input data", 
        details: error.flatten().fieldErrors 
      }
    }
    
    return { error: "Failed to create tenant" }
  }
}

export async function updateTenant(id: string, data: Partial<TenantFormData>) {
  try {
    // Validate the input data
    const validatedData = TenantSchema.partial().parse(data)

    // Check if BP Code already exists (if being updated)
    if (validatedData.bpCode) {
      const existingTenant = await prisma.tenant.findFirst({
        where: { 
          bpCode: validatedData.bpCode,
          NOT: { id }
        }
      })

      if (existingTenant) {
        return { error: "A tenant with this BP Code already exists" }
      }
    }

    // Check if email already exists (if being updated)
    if (validatedData.email) {
      const existingEmail = await prisma.tenant.findFirst({
        where: { 
          email: validatedData.email,
          NOT: { id }
        }
      })

      if (existingEmail) {
        return { error: "A tenant with this email already exists" }
      }
    }

    // Update the tenant
    const tenant = await prisma.tenant.update({
      where: { id },
      data: validatedData
    })

    return { success: true, data: tenant }
  } catch (error) {
    console.error("Error updating tenant:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        error: "Invalid input data", 
        details: error.flatten().fieldErrors 
      }
    }
    
    return { error: "Failed to update tenant" }
  }
}

export async function deleteTenant(id: string) {
  try {
    // Check if tenant has active leases
    const activeLeases = await prisma.lease.findMany({
      where: {
        tenantId: id,
        status: 'ACTIVE'
      }
    })

    if (activeLeases.length > 0) {
      return { error: "Cannot delete tenant with active leases" }
    }

    // Delete the tenant (cascade will handle related records)
    await prisma.tenant.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting tenant:", error)
    return { error: "Failed to delete tenant" }
  }
}