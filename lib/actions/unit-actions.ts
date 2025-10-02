import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UnitSchema, UnitFormData } from "@/lib/validations/unit-schema"
import { Prisma, UnitStatus, FloorType } from "@prisma/client"

export interface UnitWithDetails {
  id: string
  unitNumber: string
  totalArea: number
  totalRent: number
  status: UnitStatus
  createdAt: Date
  updatedAt: Date
  property: {
    id: string
    propertyName: string
    address: string
    propertyType: string
  }
  propertyTitle: {
    id: string
    titleNo: string
    lotNo: string
    lotArea: number
    registeredOwner: string
  } | null
  unitFloors: {
    id: string
    floorType: FloorType
    area: number
    rate: number
    rent: number
  }[]
  leaseUnits: {
    id: string
    rentAmount: number
    lease: {
      id: string
      startDate: Date
      endDate: Date
      totalRentAmount: number
      securityDeposit: number
      status: string
      terminationDate: Date | null
      terminationReason: string | null
      createdAt: Date
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
      }
    }
  }[]
  unitTaxes: {
    id: string
    taxYear: number
    taxDecNo: string
    taxAmount: number
    dueDate: Date
    isPaid: boolean
    paidDate: Date | null
    remarks: string | null
    isAnnual: boolean
    isQuarterly: boolean
    whatQuarter: string | null
  }[]
  maintenanceRequests: {
    id: string
    category: string
    priority: string
    description: string
    status: string
    createdAt: Date
    completedAt: Date | null
  }[]
  documents: {
    id: string
    name: string
    description: string | null
    documentType: string
    fileUrl: string
    createdAt: Date
  }[]
  utilityAccounts: {
    id: string
    utilityType: string
    accountNumber: string
    meterNumber: string | null
    remarks: string | null
    billingId: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }[]
}

async function getUnitByIdInternal(id: string): Promise<UnitWithDetails | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            address: true,
            propertyType: true,
          }
        },
        propertyTitle: {
          select: {
            id: true,
            titleNo: true,
            lotNo: true,
            lotArea: true,
            registeredOwner: true,
          }
        },
        unitFloors: {
          select: {
            id: true,
            floorType: true,
            area: true,
            rate: true,
            rent: true,
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        leaseUnits: {
          select: {
            id: true,
            rentAmount: true,
            lease: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                totalRentAmount: true,
                securityDeposit: true,
                status: true,
                terminationDate: true,
                terminationReason: true,
                createdAt: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    emergencyContactName: true,
                    emergencyContactPhone: true,
                    company: true,
                    businessName: true,
                    status: true,
                  }
                }
              }
            }
          },
          orderBy: {
            lease: {
              createdAt: 'desc'
            }
          }
        },
        unitTaxes: {
          select: {
            id: true,
            taxYear: true,
            taxDecNo: true,
            taxAmount: true,
            dueDate: true,
            isPaid: true,
            paidDate: true,
            remarks: true,
            isAnnual: true,
            isQuarterly: true,
            whatQuarter: true,
          },
          orderBy: {
            taxYear: 'desc'
          }
        },
        maintenanceRequests: {
          select: {
            id: true,
            category: true,
            priority: true,
            description: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        documents: {
          select: {
            id: true,
            name: true,
            description: true,
            documentType: true,
            fileUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        utilityAccounts: {
          select: {
            id: true,
            utilityType: true,
            accountNumber: true,
            meterNumber: true,
            remarks: true,
            billingId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!unit) {
      return null
    }

    return {
      id: unit.id,
      unitNumber: unit.unitNumber,
      totalArea: unit.totalArea,
      totalRent: unit.totalRent,
      status: unit.status,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
      property: {
        id: unit.property.id,
        propertyName: unit.property.propertyName,
        address: unit.property.address,
        propertyType: unit.property.propertyType,
      },
      propertyTitle: unit.propertyTitle,
      unitFloors: unit.unitFloors,
      leaseUnits: unit.leaseUnits,
      unitTaxes: unit.unitTaxes,
      maintenanceRequests: unit.maintenanceRequests,
      documents: unit.documents,
      utilityAccounts: unit.utilityAccounts,
    }
  } catch (error) {
    console.error("Error fetching unit:", error)
    throw new Error("Failed to fetch unit")
  }
}

export async function createUnit(data: UnitFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Validate the input data
    const validatedData = UnitSchema.parse(data)

    // Create the unit
    const unit = await prisma.unit.create({
      data: {
        propertyId: validatedData.propertyId,
        propertyTitleId: validatedData.propertyTitleId === "no-title" ? null : validatedData.propertyTitleId,
        unitNumber: validatedData.unitNumber,
        totalArea: validatedData.totalArea,
        totalRent: validatedData.totalRent,
        status: validatedData.status,
      },
    })

    return { success: true, unit }
  } catch (error) {
    console.error("Error creating unit:", error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { error: "A unit with this number already exists in this property" }
      }
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const details: Record<string, { _errors: string[] }> = {}
      
      zodError.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!details[field]) {
          details[field] = { _errors: [] }
        }
        details[field]._errors.push(issue.message)
      })
      
      return { error: "Validation failed", details }
    }
    
    return { error: "Failed to create unit" }
  }
}

interface FloorConfigData {
  id?: string // Optional for new floors
  floorType: string
  area: number
  ratePerSqm: number
  floorRent: number
}

export async function updateUnit(id: string, data: Partial<UnitFormData>) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Validate the input data if it's a complete update
    if (data.unitNumber && data.totalArea !== undefined && data.totalRent !== undefined && data.status) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const validatedData = UnitSchema.parse(data)
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(data.unitNumber && { unitNumber: data.unitNumber }),
        ...(data.totalArea !== undefined && { totalArea: data.totalArea }),
        ...(data.totalRent !== undefined && { totalRent: data.totalRent }),
        ...(data.status && { status: data.status }),
        ...(data.propertyTitleId !== undefined && { 
          propertyTitleId: data.propertyTitleId === "no-title" || data.propertyTitleId === "" ? null : data.propertyTitleId 
        }),
      },
    })

    return { success: true, unit }
  } catch (error) {
    console.error("Error updating unit:", error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { error: "A unit with this number already exists in this property" }
      }
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const details: Record<string, { _errors: string[] }> = {}
      
      zodError.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!details[field]) {
          details[field] = { _errors: [] }
        }
        details[field]._errors.push(issue.message)
      })
      
      return { error: "Validation failed", details }
    }
    
    return { error: "Failed to update unit" }
  }
}

export async function updateUnitWithFloors(
  id: string, 
  unitData: Partial<UnitFormData>, 
  floorsData: FloorConfigData[]
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Validate the input data
    if (unitData.unitNumber && unitData.totalArea !== undefined && unitData.totalRent !== undefined && unitData.status) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const validatedData = UnitSchema.parse(unitData)
    }

    // Use transaction to update unit and floors atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update the unit
      const unit = await tx.unit.update({
        where: { id },
        data: {
          ...(unitData.unitNumber && { unitNumber: unitData.unitNumber }),
          ...(unitData.totalArea !== undefined && { totalArea: unitData.totalArea }),
          ...(unitData.totalRent !== undefined && { totalRent: unitData.totalRent }),
          ...(unitData.status && { status: unitData.status }),
          ...(unitData.propertyTitleId !== undefined && { 
            propertyTitleId: unitData.propertyTitleId === "no-title" || unitData.propertyTitleId === "" ? null : unitData.propertyTitleId 
          }),
        },
      })

      // Delete existing floors
      await tx.unitFloor.deleteMany({
        where: { unitId: id }
      })

      // Create new floors
      if (floorsData.length > 0) {
        await tx.unitFloor.createMany({
          data: floorsData.map(floor => ({
            unitId: id,
            floorType: floor.floorType.toUpperCase().replace(' ', '_') as FloorType,
            area: floor.area,
            rate: floor.ratePerSqm,
            rent: floor.floorRent,
          }))
        })
      }

      return unit
    })

    return { success: true, unit: result }
  } catch (error) {
    console.error("Error updating unit with floors:", error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { error: "A unit with this number already exists in this property" }
      }
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const details: Record<string, { _errors: string[] }> = {}
      
      zodError.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!details[field]) {
          details[field] = { _errors: [] }
        }
        details[field]._errors.push(issue.message)
      })
      
      return { error: "Validation failed", details }
    }
    
    return { error: "Failed to update unit" }
  }
}

export async function deleteUnit(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.unit.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting unit:", error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return { error: "Cannot delete unit with existing leases or maintenance requests" }
      }
    }
    
    return { error: "Failed to delete unit" }
  }
}

// Export the internal function for server components
export { getUnitByIdInternal }