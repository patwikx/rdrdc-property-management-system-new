"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { DocumentType, Prisma } from "@prisma/client"

const DocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  fileUrl: z.string().min(1, "File URL is required"),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
})

type DocumentFormData = z.infer<typeof DocumentSchema>

export interface DocumentWithDetails {
  id: string
  name: string
  description: string | null
  documentType: DocumentType
  fileUrl: string
  createdAt: Date
  updatedAt: Date
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
  }
  property: {
    id: string
    propertyName: string
    propertyCode: string
  } | null
  unit: {
    id: string
    unitNumber: string
    property: {
      id: string
      propertyName: string
      propertyCode: string
    }
  } | null
  tenant: {
    id: string
    firstName: string | null
    lastName: string | null
    bpCode: string
    company: string
  } | null
}

export interface DocumentListItem {
  id: string
  name: string
  description: string | null
  documentType: DocumentType
  fileUrl: string
  createdAt: Date
  uploadedBy: {
    firstName: string
    lastName: string
  }
  property: {
    propertyName: string
    propertyCode: string
  } | null
  unit: {
    unitNumber: string
    property: {
      propertyName: string
    }
  } | null
  tenant: {
    firstName: string | null
    lastName: string | null
    bpCode: string
  } | null
}

export async function createDocument(data: DocumentFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = DocumentSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, description, documentType, fileUrl, propertyId, unitId, tenantId } = validatedFields.data

  try {
    // Validate relationships exist
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      })
      if (!property) {
        return { error: "Property not found" }
      }
    }

    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      })
      if (!unit) {
        return { error: "Unit not found" }
      }
    }

    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      })
      if (!tenant) {
        return { error: "Tenant not found" }
      }
    }

    const document = await prisma.document.create({
      data: {
        name,
        description,
        documentType,
        fileUrl,
        propertyId,
        unitId,
        tenantId,
        uploadedById: session.user.id,
      },
    })

    revalidatePath("/documents")
    return { success: "Document created successfully", document }
  } catch (error) {
    console.error("Error creating document:", error)
    return {
      error: "Failed to create document",
    }
  }
}

export async function updateDocument(id: string, data: Partial<DocumentFormData>) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = DocumentSchema.partial().safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      return {
        error: "Document not found",
      }
    }

    const updateData: Prisma.DocumentUpdateInput = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.documentType !== undefined) updateData.documentType = data.documentType
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
    if (data.propertyId !== undefined) {
      updateData.property = data.propertyId ? { connect: { id: data.propertyId } } : { disconnect: true }
    }
    if (data.unitId !== undefined) {
      updateData.unit = data.unitId ? { connect: { id: data.unitId } } : { disconnect: true }
    }
    if (data.tenantId !== undefined) {
      updateData.tenant = data.tenantId ? { connect: { id: data.tenantId } } : { disconnect: true }
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/documents")
    revalidatePath(`/documents/${id}`)
    return { success: "Document updated successfully", document }
  } catch (error) {
    console.error("Error updating document:", error)
    return {
      error: "Failed to update document",
    }
  }
}

export async function deleteDocument(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      return {
        error: "Document not found",
      }
    }

    await prisma.document.delete({
      where: { id },
    })

    revalidatePath("/documents")
    return { success: "Document deleted successfully" }
  } catch (error) {
    console.error("Error deleting document:", error)
    return {
      error: "Failed to delete document",
    }
  }
}

export async function getDocuments(
  page = 1,
  limit = 10,
  search?: string,
  documentType?: DocumentType,
  propertyId?: string,
  unitId?: string,
  tenantId?: string
): Promise<{
  documents: DocumentListItem[]
  totalCount: number
  totalPages: number
}> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const skip = (page - 1) * limit

  const where: Prisma.DocumentWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (documentType) {
    where.documentType = documentType
  }

  if (propertyId) {
    where.propertyId = propertyId
  }

  if (unitId) {
    where.unitId = unitId
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        property: {
          select: {
            propertyName: true,
            propertyCode: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
            property: {
              select: {
                propertyName: true,
              },
            },
          },
        },
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            bpCode: true,
          },
        },
      },
    }),
    prisma.document.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / limit)

  return {
    documents,
    totalCount,
    totalPages,
  }
}

export async function getDocumentById(id: string): Promise<DocumentWithDetails | null> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      property: {
        select: {
          id: true,
          propertyName: true,
          propertyCode: true,
        },
      },
      unit: {
        select: {
          id: true,
          unitNumber: true,
          property: {
            select: {
              id: true,
              propertyName: true,
              propertyCode: true,
            },
          },
        },
      },
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          bpCode: true,
          company: true,
        },
      },
    },
  })

  return document
}

export async function getDocumentsByProperty(propertyId: string): Promise<DocumentListItem[]> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const documents = await prisma.document.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      property: {
        select: {
          propertyName: true,
          propertyCode: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
          property: {
            select: {
              propertyName: true,
            },
          },
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          bpCode: true,
        },
      },
    },
  })

  return documents
}

export async function getDocumentsByUnit(unitId: string): Promise<DocumentListItem[]> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const documents = await prisma.document.findMany({
    where: { unitId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      property: {
        select: {
          propertyName: true,
          propertyCode: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
          property: {
            select: {
              propertyName: true,
            },
          },
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          bpCode: true,
        },
      },
    },
  })

  return documents
}

export async function getDocumentsByTenant(tenantId: string): Promise<DocumentListItem[]> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const documents = await prisma.document.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      property: {
        select: {
          propertyName: true,
          propertyCode: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
          property: {
            select: {
              propertyName: true,
            },
          },
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          bpCode: true,
        },
      },
    },
  })

  return documents
}
//

export async function getPropertiesForSelect() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      propertyName: true,
      propertyCode: true,
    },
    orderBy: {
      propertyCode: 'asc',
    },
  })

  return properties
}

export async function getUnitsForSelect() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const units = await prisma.unit.findMany({
    select: {
      id: true,
      unitNumber: true,
      property: {
        select: {
          propertyName: true,
        },
      },
    },
    orderBy: [
      { property: { propertyName: 'asc' } },
      { unitNumber: 'asc' },
    ],
  })

  return units
}

export async function getTenantsForSelect() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bpCode: true,
      company: true,
    },
    orderBy: {
      bpCode: 'asc',
    },
  })

  return tenants
}

export async function getDocumentStats() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalDocuments,
    documentsThisMonth,
    recentUploads,
    documentsByType
  ] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    }),
    prisma.document.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    }),
    prisma.document.groupBy({
      by: ['documentType'],
      _count: {
        id: true
      }
    })
  ])

  const documentsByTypeMap = documentsByType.reduce((acc, item) => {
    acc[item.documentType] = item._count.id
    return acc
  }, {} as Record<DocumentType, number>)

  // Ensure all document types are represented
  const allTypes: DocumentType[] = ['LEASE', 'CONTRACT', 'INVOICE', 'MAINTENANCE', 'OTHER']
  allTypes.forEach(type => {
    if (!documentsByTypeMap[type]) {
      documentsByTypeMap[type] = 0
    }
  })

  return {
    totalDocuments,
    documentsThisMonth,
    recentUploads,
    documentsByType: documentsByTypeMap
  }
}

export async function getRecentDocuments(limit = 5): Promise<DocumentListItem[]> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const documents = await prisma.document.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      property: {
        select: {
          propertyName: true,
          propertyCode: true,
        },
      },
      unit: {
        select: {
          unitNumber: true,
          property: {
            select: {
              propertyName: true,
            },
          },
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          bpCode: true,
        },
      },
    },
  })

  return documents
}