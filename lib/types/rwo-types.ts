import { MaintenanceCategory, Priority, MaintenanceStatus } from "@prisma/client"

/**
 * RWO Types and Error Classes
 * Separated from server actions to comply with "use server" restrictions
 */

// Error types for better-result pattern
export class NotFoundError extends Error {
  readonly _tag = 'NotFoundError' as const
  constructor(public readonly entityType: string, public readonly id: string) {
    super(`${entityType} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  readonly _tag = 'ValidationError' as const
  constructor(public readonly field: string, public readonly message: string) {
    super(`Validation failed for ${field}: ${message}`)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends Error {
  readonly _tag = 'UnauthorizedError' as const
  constructor() {
    super('User is not authorized to perform this action')
    this.name = 'UnauthorizedError'
  }
}

// Types for RWO
export interface RWOWithDetails {
  id: string
  category: MaintenanceCategory
  priority: Priority
  description: string
  status: MaintenanceStatus
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  unit: {
    id: string
    unitNumber: string
    property: {
      id: string
      propertyName: string
    }
  }
  tenant: {
    id: string
    businessName: string
    bpCode: string
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export interface RWOSummary {
  statusCounts: Record<MaintenanceStatus, number>
  priorityCounts: Record<Priority, number>
  totalOpen: number
}

export interface GetRWOsParams {
  propertyId?: string
  priority?: Priority
  category?: MaintenanceCategory
  status?: MaintenanceStatus
}

export interface GetRWOsResult {
  requests: RWOWithDetails[]
  summary: RWOSummary
}

export interface CreateRWOInput {
  unitId: string
  category: MaintenanceCategory
  priority: Priority
  description: string
}

export interface SpaceForRWO {
  id: string
  unitNumber: string
  propertyId: string
  propertyName: string
  tenantId: string
  tenantName: string
}
