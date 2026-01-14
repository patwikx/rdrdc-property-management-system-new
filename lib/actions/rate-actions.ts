"use server"

import { prisma } from "@/lib/prisma"
import { 
  RateChangeType, 
  RateOverrideType, 
  RateApprovalStatus,
  ApprovalStep,
  RateChangeRequest,
  RateOverride,
  RateHistory
} from "@prisma/client"
import { revalidatePath } from "next/cache"

// ============================================================================
// Types
// ============================================================================

export interface CreateRateChangeRequestData {
  leaseUnitId: string
  proposedRate: number
  changeType: RateChangeType
  effectiveDate: Date
  reason: string
  requestedById: string
}

export interface CreateRateOverrideData {
  leaseUnitId: string
  overrideType: RateOverrideType
  fixedRate?: number
  percentageCap?: number
  effectiveFrom: Date
  effectiveTo?: Date
  reason: string
  requestedById: string
}

export interface RateChangeRequestWithDetails extends RateChangeRequest {
  leaseUnit: {
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
    lease: {
      id: string
      tenant: {
        id: string
        bpCode: string
        company: string
        businessName: string
      }
    }
  }
  requestedBy: {
    id: string
    firstName: string
    lastName: string
  }
  recommendedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
  approvedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
  rejectedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export interface RateOverrideWithDetails extends RateOverride {
  leaseUnit: {
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
    lease: {
      id: string
      tenant: {
        id: string
        bpCode: string
        company: string
        businessName: string
      }
    }
  }
  requestedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface RateHistoryWithDetails extends RateHistory {
  leaseUnit: {
    id: string
    rentAmount: number
    unit: {
      id: string
      unitNumber: string
    }
  }
}

// ============================================================================
// Create Rate Change Request (Requirements 2.1, 2.2, 2.3, 2.4)
// ============================================================================

/**
 * Creates a new rate change request with PENDING status.
 * Records the current rate, proposed rate, change type, and requester info.
 */
export async function createRateChangeRequest(
  data: CreateRateChangeRequestData
): Promise<{ success: boolean; request?: RateChangeRequest; error?: string }> {
  try {
    // Validate lease unit exists and get current rate
    const leaseUnit = await prisma.leaseUnit.findUnique({
      where: { id: data.leaseUnitId },
      include: {
        lease: true
      }
    })

    if (!leaseUnit) {
      return { success: false, error: "Lease unit not found" }
    }

    // Validate proposed rate is positive
    if (data.proposedRate <= 0) {
      return { success: false, error: "Proposed rate must be positive" }
    }

    // Create the rate change request with PENDING status (Requirement 2.3)
    // Records requestedById and requestedAt (Requirement 2.4)
    const request = await prisma.rateChangeRequest.create({
      data: {
        leaseUnitId: data.leaseUnitId,
        currentRate: leaseUnit.rentAmount,
        proposedRate: data.proposedRate,
        changeType: data.changeType,
        effectiveDate: data.effectiveDate,
        reason: data.reason,
        requestedById: data.requestedById,
        status: RateApprovalStatus.PENDING // Requirement 2.3
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true, request }
  } catch (error) {
    console.error('Error creating rate change request:', error)
    return { success: false, error: "Failed to create rate change request" }
  }
}

// ============================================================================
// Create Rate Override (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
// ============================================================================

/**
 * Creates a new rate override request.
 * Supports FIXED_RATE, PERCENTAGE_CAP, and NO_INCREASE types.
 */
export async function createRateOverride(
  data: CreateRateOverrideData
): Promise<{ success: boolean; override?: RateOverride; error?: string }> {
  try {
    // Validate lease unit exists
    const leaseUnit = await prisma.leaseUnit.findUnique({
      where: { id: data.leaseUnitId }
    })

    if (!leaseUnit) {
      return { success: false, error: "Lease unit not found" }
    }

    // Validate override type specific fields
    if (data.overrideType === RateOverrideType.FIXED_RATE) {
      if (!data.fixedRate || data.fixedRate <= 0) {
        return { success: false, error: "Fixed rate must be provided and positive for FIXED_RATE override" }
      }
    }

    if (data.overrideType === RateOverrideType.PERCENTAGE_CAP) {
      if (!data.percentageCap || data.percentageCap <= 0) {
        return { success: false, error: "Percentage cap must be provided and positive for PERCENTAGE_CAP override" }
      }
    }

    // Validate date range if effectiveTo is provided
    if (data.effectiveTo && data.effectiveTo <= data.effectiveFrom) {
      return { success: false, error: "Effective to date must be after effective from date" }
    }

    // Create the rate override with PENDING status
    const override = await prisma.rateOverride.create({
      data: {
        leaseUnitId: data.leaseUnitId,
        overrideType: data.overrideType,
        fixedRate: data.overrideType === RateOverrideType.FIXED_RATE ? data.fixedRate : null,
        percentageCap: data.overrideType === RateOverrideType.PERCENTAGE_CAP ? data.percentageCap : null,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        reason: data.reason,
        requestedById: data.requestedById,
        status: RateApprovalStatus.PENDING
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true, override }
  } catch (error) {
    console.error('Error creating rate override:', error)
    return { success: false, error: "Failed to create rate override" }
  }
}

// ============================================================================
// Rate History Functions (Requirements 5.1, 5.2, 5.3, 5.4)
// ============================================================================

export interface CreateRateHistoryData {
  leaseUnitId: string
  previousRate: number
  newRate: number
  changeType: RateChangeType
  effectiveDate: Date
  reason?: string
  requestId?: string
  isAutoApplied?: boolean
}

/**
 * Creates a rate history record when a rate change is applied.
 * Records previousRate, newRate, changeType, effectiveDate, and optional metadata.
 * (Requirements 5.1, 5.2, 5.3)
 * 
 * @param data - The rate history data to create
 * @returns Success status with the created history record or error message
 */
export async function createRateHistory(
  data: CreateRateHistoryData
): Promise<{ success: boolean; history?: RateHistory; error?: string }> {
  try {
    // Validate lease unit exists
    const leaseUnit = await prisma.leaseUnit.findUnique({
      where: { id: data.leaseUnitId }
    })

    if (!leaseUnit) {
      return { success: false, error: "Lease unit not found" }
    }

    // Validate rates are positive
    if (data.previousRate < 0 || data.newRate < 0) {
      return { success: false, error: "Rate values must be non-negative" }
    }

    // Create the rate history record (Requirement 5.1)
    const history = await prisma.rateHistory.create({
      data: {
        leaseUnitId: data.leaseUnitId,
        previousRate: data.previousRate,
        newRate: data.newRate,
        changeType: data.changeType,
        effectiveDate: data.effectiveDate,
        reason: data.reason || null,
        requestId: data.requestId || null,
        isAutoApplied: data.isAutoApplied ?? false // Requirement 5.2
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true, history }
  } catch (error) {
    console.error('Error creating rate history:', error)
    return { success: false, error: "Failed to create rate history record" }
  }
}

/**
 * Gets rate history for a lease unit in chronological order.
 * Returns all rate changes with previous/new rates, change type, and effective date.
 * (Requirement 5.4)
 */
export async function getRateHistory(
  leaseUnitId: string
): Promise<RateHistoryWithDetails[]> {
  try {
    const history = await prisma.rateHistory.findMany({
      where: { leaseUnitId },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true
              }
            }
          }
        }
      },
      orderBy: { effectiveDate: 'asc' } // Chronological order (Requirement 5.4)
    })

    return history
  } catch (error) {
    console.error('Error fetching rate history:', error)
    return []
  }
}

// ============================================================================
// Get Active Override (Requirements 4.2, 4.3, 4.4, 4.5)
// ============================================================================

/**
 * Gets the currently active override for a lease unit.
 * An override is active if:
 * - Status is APPROVED
 * - Current date is >= effectiveFrom
 * - Current date is <= effectiveTo (or effectiveTo is null for indefinite)
 */
export async function getActiveOverride(
  leaseUnitId: string
): Promise<RateOverrideWithDetails | null> {
  try {
    const now = new Date()

    const override = await prisma.rateOverride.findFirst({
      where: {
        leaseUnitId,
        status: RateApprovalStatus.APPROVED,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } }
        ]
      },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { effectiveFrom: 'desc' } // Get most recent if multiple
    })

    return override
  } catch (error) {
    console.error('Error fetching active override:', error)
    return null
  }
}

// ============================================================================
// Get Rate Change Request by ID
// ============================================================================

/**
 * Gets a rate change request by ID with full details.
 */
export async function getRateChangeRequestById(
  requestId: string
): Promise<RateChangeRequestWithDetails | null> {
  try {
    const request = await prisma.rateChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        recommendedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return request
  } catch (error) {
    console.error('Error fetching rate change request:', error)
    return null
  }
}

// ============================================================================
// Get Rate Override by ID
// ============================================================================

/**
 * Gets a rate override by ID with full details.
 */
export async function getRateOverrideById(
  overrideId: string
): Promise<RateOverrideWithDetails | null> {
  try {
    const override = await prisma.rateOverride.findUnique({
      where: { id: overrideId },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return override
  } catch (error) {
    console.error('Error fetching rate override:', error)
    return null
  }
}

// ============================================================================
// Get Rate Change Requests for Lease Unit
// ============================================================================

/**
 * Gets all rate change requests for a lease unit.
 */
export async function getRateChangeRequestsForLeaseUnit(
  leaseUnitId: string
): Promise<RateChangeRequestWithDetails[]> {
  try {
    const requests = await prisma.rateChangeRequest.findMany({
      where: { leaseUnitId },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        recommendedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return requests
  } catch (error) {
    console.error('Error fetching rate change requests:', error)
    return []
  }
}

// ============================================================================
// Get Rate Overrides for Lease Unit
// ============================================================================

/**
 * Gets all rate overrides for a lease unit.
 */
export async function getRateOverridesForLeaseUnit(
  leaseUnitId: string
): Promise<RateOverrideWithDetails[]> {
  try {
    const overrides = await prisma.rateOverride.findMany({
      where: { leaseUnitId },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return overrides
  } catch (error) {
    console.error('Error fetching rate overrides:', error)
    return []
  }
}

// ============================================================================
// Two-Step Approval Workflow (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
// ============================================================================

/**
 * First approval step - Recommending approver recommends a rate change request.
 * Transitions status from PENDING to RECOMMENDED.
 * Records recommendedById, recommendedAt, and recommendedRemarks.
 * (Requirement 3.1, 3.2)
 */
export async function recommendRateChange(
  requestId: string,
  recommendedById: string,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user has recommending approver permission
    const user = await prisma.user.findUnique({
      where: { id: recommendedById },
      select: { isRecommendingApprover: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (!user.isRecommendingApprover) {
      return { success: false, error: "User does not have recommending approver permission" }
    }

    // Get the rate change request
    const request = await prisma.rateChangeRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return { success: false, error: "Rate change request not found" }
    }

    // Validate current status is PENDING (Requirement 3.1)
    if (request.status !== RateApprovalStatus.PENDING) {
      return { success: false, error: `Cannot recommend request with status ${request.status}. Only PENDING requests can be recommended.` }
    }

    // Prevent self-approval
    if (request.requestedById === recommendedById) {
      return { success: false, error: "Cannot recommend your own request" }
    }

    // Update to RECOMMENDED status (Requirement 3.2)
    await prisma.rateChangeRequest.update({
      where: { id: requestId },
      data: {
        status: RateApprovalStatus.RECOMMENDED,
        recommendedById,
        recommendedAt: new Date(),
        recommendedRemarks: remarks || null
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error recommending rate change:', error)
    return { success: false, error: "Failed to recommend rate change" }
  }
}

/**
 * Final approval step - Final approver approves a rate change request.
 * Transitions status from RECOMMENDED to APPROVED.
 * Records approvedById, approvedAt, and approvalRemarks.
 * (Requirement 3.3, 3.4)
 */
export async function approveRateChange(
  requestId: string,
  approvedById: string,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user has final approver permission
    const user = await prisma.user.findUnique({
      where: { id: approvedById },
      select: { isFinalApprover: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (!user.isFinalApprover) {
      return { success: false, error: "User does not have final approver permission" }
    }

    // Get the rate change request
    const request = await prisma.rateChangeRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return { success: false, error: "Rate change request not found" }
    }

    // Validate current status is RECOMMENDED (Requirement 3.3)
    if (request.status !== RateApprovalStatus.RECOMMENDED) {
      return { success: false, error: `Cannot approve request with status ${request.status}. Only RECOMMENDED requests can be approved.` }
    }

    // Prevent self-approval
    if (request.requestedById === approvedById) {
      return { success: false, error: "Cannot approve your own request" }
    }

    // Update to APPROVED status (Requirement 3.4)
    await prisma.rateChangeRequest.update({
      where: { id: requestId },
      data: {
        status: RateApprovalStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
        approvalRemarks: remarks || null
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error approving rate change:', error)
    return { success: false, error: "Failed to approve rate change" }
  }
}

/**
 * Reject a rate change request at any step.
 * Can reject from PENDING or RECOMMENDED status.
 * Records rejectedById, rejectedAt, rejectedReason, and rejectedAtStep.
 * (Requirement 3.5)
 */
export async function rejectRateChange(
  requestId: string,
  rejectedById: string,
  reason: string,
  step: ApprovalStep
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate reason is provided
    if (!reason || reason.trim() === '') {
      return { success: false, error: "Rejection reason is required" }
    }

    // Verify user has appropriate permission based on step
    const user = await prisma.user.findUnique({
      where: { id: rejectedById },
      select: { isRecommendingApprover: true, isFinalApprover: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check permission based on step
    if (step === ApprovalStep.RECOMMENDING && !user.isRecommendingApprover) {
      return { success: false, error: "User does not have recommending approver permission" }
    }

    if (step === ApprovalStep.FINAL && !user.isFinalApprover) {
      return { success: false, error: "User does not have final approver permission" }
    }

    // Get the rate change request
    const request = await prisma.rateChangeRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return { success: false, error: "Rate change request not found" }
    }

    // Validate current status allows rejection at this step
    if (step === ApprovalStep.RECOMMENDING && request.status !== RateApprovalStatus.PENDING) {
      return { success: false, error: `Cannot reject at recommending step with status ${request.status}. Only PENDING requests can be rejected at recommending step.` }
    }

    if (step === ApprovalStep.FINAL && request.status !== RateApprovalStatus.RECOMMENDED) {
      return { success: false, error: `Cannot reject at final step with status ${request.status}. Only RECOMMENDED requests can be rejected at final step.` }
    }

    // Update to REJECTED status (Requirement 3.5)
    await prisma.rateChangeRequest.update({
      where: { id: requestId },
      data: {
        status: RateApprovalStatus.REJECTED,
        rejectedById,
        rejectedAt: new Date(),
        rejectedReason: reason,
        rejectedAtStep: step
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error rejecting rate change:', error)
    return { success: false, error: "Failed to reject rate change" }
  }
}

/**
 * Get pending approvals for a user based on their approval type.
 * - 'recommending': Returns PENDING requests for recommending approvers
 * - 'final': Returns RECOMMENDED requests for final approvers
 */
export async function getPendingApprovals(
  userId: string,
  approvalType: 'recommending' | 'final'
): Promise<RateChangeRequestWithDetails[]> {
  try {
    // Verify user has appropriate permission
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isRecommendingApprover: true, isFinalApprover: true }
    })

    if (!user) {
      return []
    }

    // Check permission based on approval type
    if (approvalType === 'recommending' && !user.isRecommendingApprover) {
      return []
    }

    if (approvalType === 'final' && !user.isFinalApprover) {
      return []
    }

    // Determine which status to filter by
    const status = approvalType === 'recommending' 
      ? RateApprovalStatus.PENDING 
      : RateApprovalStatus.RECOMMENDED

    const requests = await prisma.rateChangeRequest.findMany({
      where: { 
        status,
        // Exclude requests made by the same user (can't approve own requests)
        requestedById: { not: userId }
      },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        recommendedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first for FIFO processing
    })

    return requests
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return []
  }
}

// ============================================================================
// Rate Override Approval Functions (Requirement 4.6)
// ============================================================================

/**
 * First approval step for rate override - Recommending approver recommends.
 * Transitions status from PENDING to RECOMMENDED.
 */
export async function recommendRateOverride(
  overrideId: string,
  recommendedById: string,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user has recommending approver permission
    const user = await prisma.user.findUnique({
      where: { id: recommendedById },
      select: { isRecommendingApprover: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (!user.isRecommendingApprover) {
      return { success: false, error: "User does not have recommending approver permission" }
    }

    // Get the rate override
    const override = await prisma.rateOverride.findUnique({
      where: { id: overrideId }
    })

    if (!override) {
      return { success: false, error: "Rate override not found" }
    }

    // Validate current status is PENDING
    if (override.status !== RateApprovalStatus.PENDING) {
      return { success: false, error: `Cannot recommend override with status ${override.status}. Only PENDING overrides can be recommended.` }
    }

    // Prevent self-approval
    if (override.requestedById === recommendedById) {
      return { success: false, error: "Cannot recommend your own request" }
    }

    // Update to RECOMMENDED status
    await prisma.rateOverride.update({
      where: { id: overrideId },
      data: {
        status: RateApprovalStatus.RECOMMENDED,
        recommendedById,
        recommendedAt: new Date(),
        recommendedRemarks: remarks || null
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error recommending rate override:', error)
    return { success: false, error: "Failed to recommend rate override" }
  }
}

/**
 * Final approval step for rate override - Final approver approves.
 * Transitions status from RECOMMENDED to APPROVED.
 */
export async function approveRateOverride(
  overrideId: string,
  approvedById: string,
  remarks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user has final approver permission
    const user = await prisma.user.findUnique({
      where: { id: approvedById },
      select: { isFinalApprover: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (!user.isFinalApprover) {
      return { success: false, error: "User does not have final approver permission" }
    }

    // Get the rate override
    const override = await prisma.rateOverride.findUnique({
      where: { id: overrideId }
    })

    if (!override) {
      return { success: false, error: "Rate override not found" }
    }

    // Validate current status is RECOMMENDED
    if (override.status !== RateApprovalStatus.RECOMMENDED) {
      return { success: false, error: `Cannot approve override with status ${override.status}. Only RECOMMENDED overrides can be approved.` }
    }

    // Prevent self-approval
    if (override.requestedById === approvedById) {
      return { success: false, error: "Cannot approve your own request" }
    }

    // Update to APPROVED status
    await prisma.rateOverride.update({
      where: { id: overrideId },
      data: {
        status: RateApprovalStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
        approvalRemarks: remarks || null
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error approving rate override:', error)
    return { success: false, error: "Failed to approve rate override" }
  }
}

/**
 * Reject a rate override at any step.
 * Can reject from PENDING or RECOMMENDED status.
 */
export async function rejectRateOverride(
  overrideId: string,
  rejectedById: string,
  reason: string,
  step: ApprovalStep
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate reason is provided
    if (!reason || reason.trim() === '') {
      return { success: false, error: "Rejection reason is required" }
    }

    // Verify user has appropriate permission based on step
    const user = await prisma.user.findUnique({
      where: { id: rejectedById },
      select: { isRecommendingApprover: true, isFinalApprover: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check permission based on step
    if (step === ApprovalStep.RECOMMENDING && !user.isRecommendingApprover) {
      return { success: false, error: "User does not have recommending approver permission" }
    }

    if (step === ApprovalStep.FINAL && !user.isFinalApprover) {
      return { success: false, error: "User does not have final approver permission" }
    }

    // Get the rate override
    const override = await prisma.rateOverride.findUnique({
      where: { id: overrideId }
    })

    if (!override) {
      return { success: false, error: "Rate override not found" }
    }

    // Validate current status allows rejection at this step
    if (step === ApprovalStep.RECOMMENDING && override.status !== RateApprovalStatus.PENDING) {
      return { success: false, error: `Cannot reject at recommending step with status ${override.status}. Only PENDING overrides can be rejected at recommending step.` }
    }

    if (step === ApprovalStep.FINAL && override.status !== RateApprovalStatus.RECOMMENDED) {
      return { success: false, error: `Cannot reject at final step with status ${override.status}. Only RECOMMENDED overrides can be rejected at final step.` }
    }

    // Update to REJECTED status
    await prisma.rateOverride.update({
      where: { id: overrideId },
      data: {
        status: RateApprovalStatus.REJECTED,
        rejectedById,
        rejectedAt: new Date(),
        rejectedReason: reason,
        rejectedAtStep: step
      }
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error rejecting rate override:', error)
    return { success: false, error: "Failed to reject rate override" }
  }
}

// ============================================================================
// Rate Calculation Functions (Requirements 4.2, 4.3, 4.4)
// ============================================================================

/**
 * Calculates the new rate considering any active overrides.
 * 
 * Override behavior:
 * - FIXED_RATE: Returns the fixed rate regardless of standard increase (Requirement 4.2)
 * - PERCENTAGE_CAP: Limits the increase to the cap percentage (Requirement 4.3)
 * - NO_INCREASE: Returns the current rate unchanged (Requirement 4.4)
 * - No override: Applies the standard increase percentage
 * 
 * @param currentRate - The current rent amount
 * @param standardIncreasePercentage - The standard increase percentage (e.g., 10 for 10%)
 * @param override - The active rate override, if any
 * @returns The calculated new rate
 */
export async function calculateNewRate(
  currentRate: number,
  standardIncreasePercentage: number,
  override: RateOverride | null
): Promise<number> {
  // If no override, apply standard increase
  if (!override) {
    const increaseAmount = currentRate * (standardIncreasePercentage / 100)
    return currentRate + increaseAmount
  }

  // Handle override types
  switch (override.overrideType) {
    case RateOverrideType.FIXED_RATE:
      // Requirement 4.2: Lock rate at the specified fixed rate
      return override.fixedRate ?? currentRate
    
    case RateOverrideType.PERCENTAGE_CAP:
      // Requirement 4.3: Limit increase to the percentage cap
      const cappedPercentage = Math.min(
        standardIncreasePercentage,
        override.percentageCap ?? standardIncreasePercentage
      )
      const cappedIncrease = currentRate * (cappedPercentage / 100)
      return currentRate + cappedIncrease
    
    case RateOverrideType.NO_INCREASE:
      // Requirement 4.4: No rate increase during override period
      return currentRate
    
    default:
      // Fallback: apply standard increase
      const defaultIncrease = currentRate * (standardIncreasePercentage / 100)
      return currentRate + defaultIncrease
  }
}

/**
 * Applies an approved rate change to a LeaseUnit.
 * Updates the LeaseUnit's rentAmount and lastIncreaseDate.
 * Creates a RateHistory record to track the change.
 * 
 * @param requestId - The ID of the approved RateChangeRequest
 * @returns Success status and any error message
 */
export async function applyRateChange(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the rate change request
    const request = await prisma.rateChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        leaseUnit: {
          include: {
            lease: true
          }
        }
      }
    })

    if (!request) {
      return { success: false, error: "Rate change request not found" }
    }

    // Validate the request is approved
    if (request.status !== RateApprovalStatus.APPROVED && request.status !== RateApprovalStatus.AUTO_APPLIED) {
      return { success: false, error: `Cannot apply rate change with status ${request.status}. Only APPROVED or AUTO_APPLIED requests can be applied.` }
    }

    // Validate the lease is active
    if (request.leaseUnit.lease.status !== 'ACTIVE') {
      return { success: false, error: "Cannot apply rate change to a non-active lease" }
    }

    const previousRate = request.leaseUnit.rentAmount
    const newRate = request.proposedRate

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update the LeaseUnit's rent amount and last increase date
      await tx.leaseUnit.update({
        where: { id: request.leaseUnitId },
        data: {
          rentAmount: newRate,
          lastIncreaseDate: request.effectiveDate
        }
      })

      // Create a rate history record
      await tx.rateHistory.create({
        data: {
          leaseUnitId: request.leaseUnitId,
          previousRate,
          newRate,
          changeType: request.changeType,
          effectiveDate: request.effectiveDate,
          reason: request.reason,
          requestId: request.id,
          isAutoApplied: request.isFlagged // Auto-applied if it was flagged (scheduled increase)
        }
      })

      // Update the lease's total rent amount
      // Get all lease units for this lease and sum their rent amounts
      const leaseUnits = await tx.leaseUnit.findMany({
        where: { leaseId: request.leaseUnit.leaseId }
      })

      // Calculate new total (update the one we just changed)
      const totalRent = leaseUnits.reduce((sum, lu) => {
        if (lu.id === request.leaseUnitId) {
          return sum + newRate
        }
        return sum + lu.rentAmount
      }, 0)

      await tx.lease.update({
        where: { id: request.leaseUnit.leaseId },
        data: { totalRentAmount: totalRent }
      })
    })

    revalidatePath('/tenants/leases')
    
    return { success: true }
  } catch (error) {
    console.error('Error applying rate change:', error)
    return { success: false, error: "Failed to apply rate change" }
  }
}

/**
 * Get pending rate override approvals for a user based on their approval type.
 * - 'recommending': Returns PENDING overrides for recommending approvers
 * - 'final': Returns RECOMMENDED overrides for final approvers
 */
export async function getPendingOverrideApprovals(
  userId: string,
  approvalType: 'recommending' | 'final'
): Promise<RateOverrideWithDetails[]> {
  try {
    // Verify user has appropriate permission
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isRecommendingApprover: true, isFinalApprover: true }
    })

    if (!user) {
      return []
    }

    // Check permission based on approval type
    if (approvalType === 'recommending' && !user.isRecommendingApprover) {
      return []
    }

    if (approvalType === 'final' && !user.isFinalApprover) {
      return []
    }

    // Determine which status to filter by
    const status = approvalType === 'recommending' 
      ? RateApprovalStatus.PENDING 
      : RateApprovalStatus.RECOMMENDED

    const overrides = await prisma.rateOverride.findMany({
      where: { 
        status,
        // Exclude requests made by the same user (can't approve own requests)
        requestedById: { not: userId }
      },
      include: {
        leaseUnit: {
          select: {
            id: true,
            rentAmount: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                }
              }
            },
            lease: {
              select: {
                id: true,
                tenant: {
                  select: {
                    id: true,
                    bpCode: true,
                    company: true,
                    businessName: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first for FIFO processing
    })

    return overrides
  } catch (error) {
    console.error('Error fetching pending override approvals:', error)
    return []
  }
}


// ============================================================================
// Scheduled Rate Increase Processing (Requirements 1.4, 1.5)
// ============================================================================

export interface ProcessScheduledRateIncreasesResult {
  processed: number
  errors: string[]
  details: {
    leaseId: string
    leaseUnitId: string
    previousRate: number
    newRate: number
    success: boolean
    error?: string
  }[]
}

/**
 * Processes scheduled rate increases for all eligible leases.
 * 
 * This function:
 * 1. Finds all active leases where nextScheduledIncrease <= today and autoIncreaseEnabled = true
 * 2. For each lease unit, checks for active overrides and calculates the new rate
 * 3. Creates a flagged RateChangeRequest with AUTO_APPLIED status
 * 4. Applies the rate change to the LeaseUnit
 * 5. Creates a RateHistory record with isAutoApplied = true
 * 6. Updates the lease's nextScheduledIncrease for the next interval
 * 
 * (Requirements 1.4, 1.5)
 * 
 * @returns Object containing count of processed increases and any errors
 */
export async function processScheduledRateIncreases(): Promise<ProcessScheduledRateIncreasesResult> {
  const result: ProcessScheduledRateIncreasesResult = {
    processed: 0,
    errors: [],
    details: []
  }

  try {
    const now = new Date()

    // 1. Find all active leases where nextScheduledIncrease <= today and autoIncreaseEnabled = true
    // (Requirement 1.4)
    const dueLeases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        autoIncreaseEnabled: true,
        nextScheduledIncrease: { lte: now }
      },
      include: {
        leaseUnits: {
          include: {
            unit: true
          }
        }
      }
    })

    // Get a system user for auto-applied requests (first admin user)
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (!systemUser) {
      return {
        ...result,
        errors: ['No admin user found to process scheduled increases']
      }
    }

    // Process each due lease
    for (const lease of dueLeases) {
      const standardIncreasePercentage = lease.standardIncreasePercentage ?? 10
      const increaseIntervalYears = lease.increaseIntervalYears ?? 3

      // Process each lease unit
      for (const leaseUnit of lease.leaseUnits) {
        const detail: ProcessScheduledRateIncreasesResult['details'][0] = {
          leaseId: lease.id,
          leaseUnitId: leaseUnit.id,
          previousRate: leaseUnit.rentAmount,
          newRate: 0,
          success: false
        }

        try {
          // 2. Check for active override
          const override = await getActiveOverrideInternal(leaseUnit.id)

          // 3. Calculate new rate based on override or standard increase
          const newRate = await calculateNewRate(
            leaseUnit.rentAmount,
            standardIncreasePercentage,
            override
          )

          detail.newRate = newRate

          // Skip if rate doesn't change (e.g., NO_INCREASE override)
          if (newRate === leaseUnit.rentAmount) {
            detail.success = true
            result.details.push(detail)
            continue
          }

          // Use a transaction to ensure atomicity
          await prisma.$transaction(async (tx) => {
            // 4. Create flagged RateChangeRequest with AUTO_APPLIED status (Requirement 1.5)
            const rateChangeRequest = await tx.rateChangeRequest.create({
              data: {
                leaseUnitId: leaseUnit.id,
                currentRate: leaseUnit.rentAmount,
                proposedRate: newRate,
                changeType: RateChangeType.STANDARD_INCREASE,
                effectiveDate: now,
                reason: `Scheduled ${standardIncreasePercentage}% increase after ${increaseIntervalYears} years`,
                isFlagged: true, // Flagged for review (Requirement 1.5)
                status: RateApprovalStatus.AUTO_APPLIED, // Auto-applied status
                requestedById: systemUser.id
              }
            })

            // 5. Update the LeaseUnit's rent amount and last increase date
            await tx.leaseUnit.update({
              where: { id: leaseUnit.id },
              data: {
                rentAmount: newRate,
                lastIncreaseDate: now
              }
            })

            // 6. Create a rate history record with isAutoApplied = true (Requirement 5.2)
            await tx.rateHistory.create({
              data: {
                leaseUnitId: leaseUnit.id,
                previousRate: leaseUnit.rentAmount,
                newRate,
                changeType: RateChangeType.STANDARD_INCREASE,
                effectiveDate: now,
                reason: `Scheduled ${standardIncreasePercentage}% increase after ${increaseIntervalYears} years`,
                requestId: rateChangeRequest.id,
                isAutoApplied: true // Requirement 5.2
              }
            })

            // 7. Update the lease's total rent amount
            const allLeaseUnits = await tx.leaseUnit.findMany({
              where: { leaseId: lease.id }
            })

            const totalRent = allLeaseUnits.reduce((sum, lu) => {
              if (lu.id === leaseUnit.id) {
                return sum + newRate
              }
              return sum + lu.rentAmount
            }, 0)

            await tx.lease.update({
              where: { id: lease.id },
              data: { totalRentAmount: totalRent }
            })
          })

          detail.success = true
          result.processed++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          detail.error = errorMessage
          result.errors.push(`Failed to process lease unit ${leaseUnit.id}: ${errorMessage}`)
        }

        result.details.push(detail)
      }

      // 8. Update nextScheduledIncrease for the lease (after processing all units)
      try {
        const nextIncrease = new Date(now)
        nextIncrease.setFullYear(nextIncrease.getFullYear() + increaseIntervalYears)

        await prisma.lease.update({
          where: { id: lease.id },
          data: { nextScheduledIncrease: nextIncrease }
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to update nextScheduledIncrease for lease ${lease.id}: ${errorMessage}`)
      }
    }

    // Revalidate paths after processing
    revalidatePath('/tenants/leases')

    return result
  } catch (error) {
    console.error('Error processing scheduled rate increases:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      ...result,
      errors: [...result.errors, `Fatal error: ${errorMessage}`]
    }
  }
}

/**
 * Internal helper to get active override without the full details.
 * Used by processScheduledRateIncreases to avoid circular dependencies.
 */
async function getActiveOverrideInternal(
  leaseUnitId: string
): Promise<RateOverride | null> {
  const now = new Date()

  const override = await prisma.rateOverride.findFirst({
    where: {
      leaseUnitId,
      status: RateApprovalStatus.APPROVED,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: now } }
      ]
    },
    orderBy: { effectiveFrom: 'desc' }
  })

  return override
}

/**
 * Gets all leases that are due for scheduled rate increases.
 * Useful for previewing which leases will be affected before running processScheduledRateIncreases.
 * 
 * @returns Array of leases due for rate increases with their lease units
 */
export async function getLeasesWithDueRateIncreases() {
  const now = new Date()

  const dueLeases = await prisma.lease.findMany({
    where: {
      status: 'ACTIVE',
      autoIncreaseEnabled: true,
      nextScheduledIncrease: { lte: now }
    },
    include: {
      tenant: {
        select: {
          id: true,
          bpCode: true,
          company: true,
          businessName: true
        }
      },
      leaseUnits: {
        include: {
          unit: {
            select: {
              id: true,
              unitNumber: true,
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
    }
  })

  return dueLeases
}
