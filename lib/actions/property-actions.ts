"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PropertySchema, PropertyUpdateSchema, PropertyFormData, PropertyUpdateData } from "@/lib/validations/property-schema"
import { revalidatePath } from "next/cache"
import { FloorType, Prisma, PropertyType, UnitStatus } from "@prisma/client"

export interface PropertyWithDetails {
  id: string
  propertyCode: string
  propertyName: string
  leasableArea: number
  address: string
  propertyType: PropertyType
  totalUnits: number | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    firstName: string
    lastName: string
  }
  units: {
    id: string
    unitNumber: string
    status: UnitStatus
    totalArea: number
    totalRent: number
    propertyTitle: {
      titleNo: string
      lotNo: string
    } | null
    unitFloors?: {
      id: string
      floorType: FloorType
      area: number
      rate: number
      rent: number
    }[]
  }[]
  titles: {
    id: string
    titleNo: string
    lotNo: string
    lotArea: number
    registeredOwner: string
    isEncumbered: boolean
    encumbranceDetails: string | null
    propertyTaxes: {
      id: string
      taxYear: number
      TaxDecNo: string
      taxAmount: number
      dueDate: Date
      isPaid: boolean
      paidDate: Date | null
      remarks: string | null
      isAnnual: boolean
      isQuarterly: boolean
      whatQuarter: string | null
    }[]
  }[]
  documents: {
    id: string
    name: string
    description: string | null
    documentType: string
    fileUrl: string
    createdAt: Date
    uploadedBy: {
      firstName: string
      lastName: string
    }
  }[]
  utilities: {
    id: string
    utilityType: string
    provider: string
    accountNumber: string
    meterNumber: string | null
    isActive: boolean
  }[]
  titleMovements: {
    id: string
    status: string
    location: string
    purpose: string
    requestDate: Date
    returnDate: Date | null
    user: {
      firstName: string
      lastName: string
    }
  }[]
  _count: {
    units: number
    documents: number
    utilities: number
    titles: number
    titleMovements: number
  }
}

export interface PropertyListItem {
  id: string
  propertyCode: string
  propertyName: string
  leasableArea: number
  address: string
  propertyType: PropertyType
  totalUnits: number | null
  createdAt: Date
  _count: {
    units: number
  }
  units: {
    status: string
  }[]
}

export async function createProperty(data: PropertyFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertySchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { propertyCode, propertyName, leasableArea, address, propertyType, totalUnits } = validatedFields.data

  try {
    // Check if property code already exists
    const existingProperty = await prisma.property.findUnique({
      where: { propertyCode },
    })

    if (existingProperty) {
      return {
        error: "Property code already exists",
      }
    }

    const property = await prisma.property.create({
      data: {
        propertyCode,
        propertyName,
        leasableArea,
        address,
        propertyType,
        totalUnits: totalUnits || 0,
        createdById: session.user.id,
      },
    })

    revalidatePath("/properties")
    return { success: "Property created successfully", property }
  } catch (error) {
    console.error("Error creating property:", error)
    return {
      error: "Failed to create property",
    }
  }
}

export async function updateProperty(data: PropertyUpdateData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { id, propertyCode, propertyName, leasableArea, address, propertyType, totalUnits } = validatedFields.data

  try {
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return {
        error: "Property not found",
      }
    }

    // Check if property code is being changed and if it already exists
    if (propertyCode && propertyCode !== existingProperty.propertyCode) {
      const codeExists = await prisma.property.findUnique({
        where: { propertyCode },
      })

      if (codeExists) {
        return {
          error: "Property code already exists",
        }
      }
    }

    const updateData: Prisma.PropertyUpdateInput = {}
    
    if (propertyCode !== undefined) updateData.propertyCode = propertyCode
    if (propertyName !== undefined) updateData.propertyName = propertyName
    if (leasableArea !== undefined) updateData.leasableArea = leasableArea
    if (address !== undefined) updateData.address = address
    if (propertyType !== undefined) updateData.propertyType = propertyType
    if (totalUnits !== undefined) updateData.totalUnits = totalUnits

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/properties")
    revalidatePath(`/properties/${id}`)
    return { success: "Property updated successfully", property }
  } catch (error) {
    console.error("Error updating property:", error)
    return {
      error: "Failed to update property",
    }
  }
}

export async function deleteProperty(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        units: true,
        documents: true,
      },
    })

    if (!existingProperty) {
      return {
        error: "Property not found",
      }
    }

    // Check if property has units or documents
    if (existingProperty.units.length > 0) {
      return {
        error: "Cannot delete property with existing units",
      }
    }

    if (existingProperty.documents.length > 0) {
      return {
        error: "Cannot delete property with existing documents",
      }
    }

    await prisma.property.delete({
      where: { id },
    })

    revalidatePath("/properties")
    return { success: "Property deleted successfully" }
  } catch (error) {
    console.error("Error deleting property:", error)
    return {
      error: "Failed to delete property",
    }
  }
}

export async function getProperties(
  page = 1,
  limit = 10,
  search?: string,
  propertyType?: PropertyType
): Promise<{
  properties: PropertyListItem[]
  totalCount: number
  totalPages: number
}> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const skip = (page - 1) * limit

  const where: Prisma.PropertyWhereInput = {}

  if (search) {
    where.OR = [
      { propertyCode: { contains: search, mode: 'insensitive' } },
      { propertyName: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (propertyType) {
    where.propertyType = propertyType
  }

  const [properties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            units: true,
          },
        },
        units: {
          select: {
            status: true,
          },
        },
      },
    }),
    prisma.property.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  return {
    properties,
    totalCount,
    totalPages,
  }
}

export async function getPropertyById(id: string): Promise<PropertyWithDetails | null> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }


  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      units: {
        select: {
          id: true,
          unitNumber: true,
          status: true,
          totalArea: true,
          totalRent: true,
          propertyTitle: {
            select: {
              titleNo: true,
              lotNo: true,
            },
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
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          unitNumber: 'asc',
        },
      },
      titles: {
        select: {
          id: true,
          titleNo: true,
          lotNo: true,
          lotArea: true,
          registeredOwner: true,
          isEncumbered: true,
          encumbranceDetails: true,
          propertyTaxes: {
            select: {
              id: true,
              taxYear: true,
              TaxDecNo: true,
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
              taxYear: 'desc',
            },
          },
        },
        orderBy: {
          titleNo: 'asc',
        },
      },
      documents: {
        select: {
          id: true,
          name: true,
          description: true,
          documentType: true,
          fileUrl: true,
          createdAt: true,
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      utilities: {
        select: {
          id: true,
          utilityType: true,
          provider: true,
          accountNumber: true,
          meterNumber: true,
          isActive: true,
        },
        orderBy: {
          utilityType: 'asc',
        },
      },
      titleMovements: {
        select: {
          id: true,
          status: true,
          location: true,
          purpose: true,
          requestDate: true,
          returnDate: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          requestDate: 'desc',
        },
      },
      _count: {
        select: {
          units: true,
          documents: true,
          utilities: true,
          titles: true,
          titleMovements: true,
        },
      },
    },
  })
  return property
}

export async function getPropertyByCode(propertyCode: string): Promise<PropertyWithDetails | null> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const property = await prisma.property.findUnique({
    where: { propertyCode },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      units: {
        select: {
          id: true,
          unitNumber: true,
          status: true,
          totalArea: true,
          totalRent: true,
          propertyTitle: {
            select: {
              titleNo: true,
              lotNo: true,
            },
          },
        },
        orderBy: {
          unitNumber: 'asc',
        },
      },
      titles: {
        select: {
          id: true,
          titleNo: true,
          lotNo: true,
          lotArea: true,
          registeredOwner: true,
          isEncumbered: true,
          encumbranceDetails: true,
          propertyTaxes: {
            select: {
              id: true,
              taxYear: true,
              TaxDecNo: true,
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
              taxYear: 'desc',
            },
          },
        },
        orderBy: {
          titleNo: 'asc',
        },
      },
      documents: {
        select: {
          id: true,
          name: true,
          description: true,
          documentType: true,
          fileUrl: true,
          createdAt: true,
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      utilities: {
        select: {
          id: true,
          utilityType: true,
          provider: true,
          accountNumber: true,
          meterNumber: true,
          isActive: true,
        },
        orderBy: {
          utilityType: 'asc',
        },
      },
      titleMovements: {
        select: {
          id: true,
          status: true,
          location: true,
          purpose: true,
          requestDate: true,
          returnDate: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          requestDate: 'desc',
        },
      },
      _count: {
        select: {
          units: true,
          documents: true,
          utilities: true,
          titles: true,
          titleMovements: true,
        },
      },
    },
  })

  return property
}

export async function getPropertyStats() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const [
    totalProperties,
    totalAreaResult,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    monthlyRevenueResult
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.aggregate({
      _sum: {
        leasableArea: true
      }
    }),
    prisma.unit.count(),
    prisma.unit.count({
      where: {
        status: 'OCCUPIED'
      }
    }),
    prisma.unit.count({
      where: {
        status: 'VACANT'
      }
    }),
    prisma.lease.aggregate({
      _sum: {
        totalRentAmount: true
      },
      where: {
        status: 'ACTIVE'
      }
    })
  ])

  return {
    totalProperties,
    totalArea: totalAreaResult._sum.leasableArea || 0,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    monthlyRevenue: monthlyRevenueResult._sum.totalRentAmount || 0,
    occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
  }
}