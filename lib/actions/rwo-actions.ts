"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { MaintenanceCategory, Priority, MaintenanceStatus, Prisma } from "@prisma/client"
import { Result, Ok, Err } from "better-result"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from "@/lib/types/rwo-types"
import type {
  RWOWithDetails,
  RWOSummary,
  GetRWOsParams,
  GetRWOsResult,
  CreateRWOInput,
  SpaceForRWO,
} from "@/lib/types/rwo-types"

/**
 * RWO (Repair Work Order) Server Actions
 * Requirements: 2.2, 2.6, 2.7, 2.8, 2.9, 2.13
 */

// Validation schema for creating RWO
const CreateRWOSchema = z.object({
  unitId: z.string().min(1, "Space selection is required"),
  category: z.nativeEnum(MaintenanceCategory, { message: "Category is required" }),
  priority: z.nativeEnum(Priority, { message: "Priority is required" }),
  description: z.string().min(1, "Description is required"),
})

/**
 * Get RWOs with filtering
 * Requirements: 2.2, 2.9
 */
export async function getRWOs(
  params: GetRWOsParams = {}
): Promise<GetRWOsResult> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const { propertyId, priority, category, status } = params

  // Build where clause
  const where: Prisma.MaintenanceRequestWhereInput = {}

  if (propertyId) {
    where.unit = { propertyId }
  }

  if (priority) {
    where.priority = priority
  }

  if (category) {
    where.category = category
  }

  if (status) {
    where.status = status
  }

  // Fetch RWOs with related data
  const requests = await prisma.maintenanceRequest.findMany({
    where,
    orderBy: [
      { priority: 'asc' }, // EMERGENCY first
      { createdAt: 'desc' }
    ],
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
      },
      tenant: {
        select: {
          id: true,
          businessName: true,
          bpCode: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  // Transform to RWOWithDetails
  const transformedRequests: RWOWithDetails[] = requests.map(req => ({
    id: req.id,
    category: req.category,
    priority: req.priority,
    description: req.description,
    status: req.status,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    completedAt: req.completedAt,
    unit: {
      id: req.unit.id,
      unitNumber: req.unit.unitNumber,
      property: {
        id: req.unit.property.id,
        propertyName: req.unit.property.propertyName
      }
    },
    tenant: {
      id: req.tenant.id,
      businessName: req.tenant.businessName,
      bpCode: req.tenant.bpCode
    },
    assignedTo: req.assignedTo ? {
      id: req.assignedTo.id,
      firstName: req.assignedTo.firstName,
      lastName: req.assignedTo.lastName
    } : null
  }))

  // Calculate summary
  const summary = await calculateRWOSummaryInternal(where)

  return {
    requests: transformedRequests,
    summary
  }
}

/**
 * Calculate RWO summary statistics (internal helper)
 * Requirements: 2.13
 */
async function calculateRWOSummaryInternal(
  baseWhere: Prisma.MaintenanceRequestWhereInput = {}
): Promise<RWOSummary> {
  // Get counts by status
  const statusGroups = await prisma.maintenanceRequest.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: { status: true }
  })

  // Get counts by priority
  const priorityGroups = await prisma.maintenanceRequest.groupBy({
    by: ['priority'],
    where: baseWhere,
    _count: { priority: true }
  })

  // Initialize counts with all possible values
  const statusCounts: Record<MaintenanceStatus, number> = {
    PENDING: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0
  }

  const priorityCounts: Record<Priority, number> = {
    EMERGENCY: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  }

  // Fill in actual counts
  statusGroups.forEach(group => {
    statusCounts[group.status] = group._count.status
  })

  priorityGroups.forEach(group => {
    priorityCounts[group.priority] = group._count.priority
  })

  // Calculate total open (PENDING + ASSIGNED + IN_PROGRESS)
  const totalOpen = statusCounts.PENDING + statusCounts.ASSIGNED + statusCounts.IN_PROGRESS

  return {
    statusCounts,
    priorityCounts,
    totalOpen
  }
}

/**
 * Get RWO summary only (without requests list)
 * Requirements: 2.13
 */
export async function getRWOSummary(
  propertyId?: string
): Promise<RWOSummary> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const where: Prisma.MaintenanceRequestWhereInput = {}

  if (propertyId) {
    where.unit = { propertyId }
  }

  return calculateRWOSummaryInternal(where)
}

/**
 * Update RWO status with better-result error handling
 * Requirements: 2.7, 2.8
 */
export async function updateRWOStatus(
  requestId: string,
  newStatus: MaintenanceStatus
): Promise<Result<RWOWithDetails, NotFoundError | UnauthorizedError>> {
  const session = await auth()

  if (!session?.user?.id) {
    return new Err(new UnauthorizedError())
  }

  // Check if request exists
  const existingRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId }
  })

  if (!existingRequest) {
    return new Err(new NotFoundError('MaintenanceRequest', requestId))
  }

  // Update the status
  const completedAt = newStatus === MaintenanceStatus.COMPLETED ? new Date() : null

  const updated = await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: { 
      status: newStatus,
      completedAt: completedAt ?? existingRequest.completedAt
    },
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
      },
      tenant: {
        select: {
          id: true,
          businessName: true,
          bpCode: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  revalidatePath('/maintenance/rwo')

  const result: RWOWithDetails = {
    id: updated.id,
    category: updated.category,
    priority: updated.priority,
    description: updated.description,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    completedAt: updated.completedAt,
    unit: {
      id: updated.unit.id,
      unitNumber: updated.unit.unitNumber,
      property: {
        id: updated.unit.property.id,
        propertyName: updated.unit.property.propertyName
      }
    },
    tenant: {
      id: updated.tenant.id,
      businessName: updated.tenant.businessName,
      bpCode: updated.tenant.bpCode
    },
    assignedTo: updated.assignedTo ? {
      id: updated.assignedTo.id,
      firstName: updated.assignedTo.firstName,
      lastName: updated.assignedTo.lastName
    } : null
  }

  return new Ok(result)
}

/**
 * Create a new RWO with validation
 * Requirements: 2.5, 2.6
 */
export async function createRWO(
  data: CreateRWOInput
): Promise<Result<RWOWithDetails, ValidationError | NotFoundError | UnauthorizedError>> {
  const session = await auth()

  if (!session?.user?.id) {
    return new Err(new UnauthorizedError())
  }

  // Validate input
  const validation = CreateRWOSchema.safeParse(data)
  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return new Err(new ValidationError(firstError.path.join('.'), firstError.message))
  }

  const { unitId, category, priority, description } = validation.data

  // Check if unit exists and get tenant
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      leaseUnits: {
        where: {
          lease: {
            status: 'ACTIVE'
          }
        },
        include: {
          lease: {
            select: {
              tenantId: true
            }
          }
        },
        take: 1
      }
    }
  })

  if (!unit) {
    return new Err(new NotFoundError('Unit', unitId))
  }

  // Get tenant from active lease
  const tenantId = unit.leaseUnits[0]?.lease?.tenantId
  if (!tenantId) {
    return new Err(new ValidationError('unitId', 'No active tenant found for this space'))
  }

  // Create the RWO
  const created = await prisma.maintenanceRequest.create({
    data: {
      unitId,
      tenantId,
      category,
      priority,
      description,
      status: MaintenanceStatus.PENDING
    },
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
      },
      tenant: {
        select: {
          id: true,
          businessName: true,
          bpCode: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  })

  revalidatePath('/maintenance/rwo')

  const result: RWOWithDetails = {
    id: created.id,
    category: created.category,
    priority: created.priority,
    description: created.description,
    status: created.status,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    completedAt: created.completedAt,
    unit: {
      id: created.unit.id,
      unitNumber: created.unit.unitNumber,
      property: {
        id: created.unit.property.id,
        propertyName: created.unit.property.propertyName
      }
    },
    tenant: {
      id: created.tenant.id,
      businessName: created.tenant.businessName,
      bpCode: created.tenant.bpCode
    },
    assignedTo: null
  }

  return new Ok(result)
}

/**
 * Get spaces with active tenants for RWO creation dropdown
 */
export async function getSpacesForRWO(
  propertyId?: string
): Promise<SpaceForRWO[]> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const where: Prisma.UnitWhereInput = {
    leaseUnits: {
      some: {
        lease: {
          status: 'ACTIVE'
        }
      }
    }
  }

  if (propertyId) {
    where.propertyId = propertyId
  }

  const units = await prisma.unit.findMany({
    where,
    include: {
      property: {
        select: {
          id: true,
          propertyName: true
        }
      },
      leaseUnits: {
        where: {
          lease: {
            status: 'ACTIVE'
          }
        },
        include: {
          lease: {
            include: {
              tenant: {
                select: {
                  id: true,
                  businessName: true
                }
              }
            }
          }
        },
        take: 1
      }
    },
    orderBy: [
      { property: { propertyName: 'asc' } },
      { unitNumber: 'asc' }
    ]
  })

  return units
    .filter(unit => unit.leaseUnits[0]?.lease?.tenant)
    .map(unit => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      propertyId: unit.property.id,
      propertyName: unit.property.propertyName,
      tenantId: unit.leaseUnits[0].lease.tenant.id,
      tenantName: unit.leaseUnits[0].lease.tenant.businessName
    }))
}

/**
 * Get all properties for filter dropdown
 */
export async function getPropertiesForRWOFilter(): Promise<Array<{ id: string; propertyName: string }>> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      propertyName: true
    },
    orderBy: {
      propertyName: 'asc'
    }
  })

  return properties
}
