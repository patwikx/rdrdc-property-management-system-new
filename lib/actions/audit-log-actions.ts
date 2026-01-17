"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { EntityType, AuditAction, Prisma } from "@prisma/client"
import { headers } from "next/headers"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilters {
  // Entity filters
  entityId?: string
  entityType?: EntityType | EntityType[]
  
  // Action filters
  action?: AuditAction | AuditAction[]
  
  // User filters
  userId?: string
  userIds?: string[]
  
  // Date range
  startDate?: Date
  endDate?: Date
  
  // Search
  searchTerm?: string // Search in changes JSON or metadata
  
  // IP/Device filters
  ipAddress?: string
  
  // Pagination & sorting
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'entityType' | 'action' | 'userId'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Audit log item with user details
 */
export interface AuditLogItem {
  id: string
  entityId: string
  entityType: EntityType
  action: AuditAction
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  changes: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

/**
 * Paginated audit log response
 */
export interface AuditLogListResult {
  items: AuditLogItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  totalLogs: number
  todayLogs: number
  weekLogs: number
  monthLogs: number
  byAction: Record<AuditAction, number>
  byEntityType: Record<EntityType, number>
  topUsers: Array<{
    userId: string
    userName: string
    actionCount: number
  }>
  recentActivity: Array<{
    hour: string
    count: number
  }>
}

/**
 * Input for creating an audit log
 */
export interface CreateAuditLogInput {
  entityId: string
  entityType: EntityType
  action: AuditAction
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Standard action response
 */
export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// CREATE AUDIT LOG
// ============================================================================

/**
 * Create a new audit log entry
 * Automatically captures user ID, IP address, and user agent
 */
export async function createAuditLog(
  input: CreateAuditLogInput
): Promise<ActionResponse<AuditLogItem>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get request headers for IP and user agent
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] ?? 
                      headersList.get("x-real-ip") ?? 
                      null
    const userAgent = headersList.get("user-agent") ?? null

    const auditLog = await prisma.auditLog.create({
      data: {
        entityId: input.entityId,
        entityType: input.entityType,
        action: input.action,
        userId: session.user.id,
        changes: input.changes as Prisma.InputJsonValue | undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress,
        userAgent,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    })

    return {
      success: true,
      data: {
        id: auditLog.id,
        entityId: auditLog.entityId,
        entityType: auditLog.entityType,
        action: auditLog.action,
        user: auditLog.user,
        changes: auditLog.changes as Record<string, unknown> | null,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata as Record<string, unknown> | null,
        createdAt: auditLog.createdAt,
      }
    }
  } catch (error) {
    console.error("Error creating audit log:", error)
    return { success: false, error: "Failed to create audit log" }
  }
}

/**
 * Helper function to log an action (simplified wrapper)
 * Can be called from other server actions
 */
export async function logAuditAction(
  entityType: EntityType,
  entityId: string,
  action: AuditAction,
  changes?: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user?.id) return

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] ?? 
                      headersList.get("x-real-ip") ?? 
                      null
    const userAgent = headersList.get("user-agent") ?? null

    await prisma.auditLog.create({
      data: {
        entityId,
        entityType,
        action,
        userId: session.user.id,
        changes: changes as Prisma.InputJsonValue | undefined,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        ipAddress,
        userAgent,
      }
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main action
    console.error("Error logging audit action:", error)
  }
}

// ============================================================================
// GET AUDIT LOGS (LIST)
// ============================================================================

/**
 * Get paginated list of audit logs with comprehensive filters
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<ActionResponse<AuditLogListResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const page = filters.page ?? 1
    const pageSize = Math.min(filters.pageSize ?? 50, 100) // Cap at 100
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {}

    if (filters.entityId) {
      where.entityId = filters.entityId
    }

    if (filters.entityType) {
      const typeArray = Array.isArray(filters.entityType)
        ? filters.entityType
        : [filters.entityType]
      where.entityType = { in: typeArray }
    }

    if (filters.action) {
      const actionArray = Array.isArray(filters.action)
        ? filters.action
        : [filters.action]
      where.action = { in: actionArray }
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.userIds?.length) {
      where.userId = { in: filters.userIds }
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    if (filters.ipAddress) {
      where.ipAddress = filters.ipAddress
    }

    if (filters.searchTerm) {
      where.OR = [
        { changes: { path: [], string_contains: filters.searchTerm } },
        { metadata: { path: [], string_contains: filters.searchTerm } },
        { entityId: { contains: filters.searchTerm, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {}
    const sortBy = filters.sortBy ?? 'createdAt'
    const sortOrder = filters.sortOrder ?? 'desc'
    
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'entityType') {
      orderBy.entityType = sortOrder
    } else if (sortBy === 'action') {
      orderBy.action = sortOrder
    } else if (sortBy === 'userId') {
      orderBy.userId = sortOrder
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          }
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where })
    ])

    const items: AuditLogItem[] = logs.map(log => ({
      id: log.id,
      entityId: log.entityId,
      entityType: log.entityType,
      action: log.action,
      user: log.user,
      changes: log.changes as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    }))

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        }
      }
    }
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return { success: false, error: "Failed to fetch audit logs" }
  }
}

// ============================================================================
// GET SINGLE AUDIT LOG
// ============================================================================

/**
 * Get a single audit log by ID
 */
export async function getAuditLogById(
  id: string
): Promise<ActionResponse<AuditLogItem>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    })

    if (!log) {
      return { success: false, error: "Audit log not found" }
    }

    return {
      success: true,
      data: {
        id: log.id,
        entityId: log.entityId,
        entityType: log.entityType,
        action: log.action,
        user: log.user,
        changes: log.changes as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata as Record<string, unknown> | null,
        createdAt: log.createdAt,
      }
    }
  } catch (error) {
    console.error("Error fetching audit log:", error)
    return { success: false, error: "Failed to fetch audit log" }
  }
}

// ============================================================================
// GET AUDIT LOGS FOR ENTITY
// ============================================================================

/**
 * Get all audit logs for a specific entity (e.g., all logs for a specific property)
 */
export async function getAuditLogsForEntity(
  entityType: EntityType,
  entityId: string,
  options: {
    page?: number
    pageSize?: number
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<ActionResponse<AuditLogListResult>> {
  return getAuditLogs({
    entityType,
    entityId,
    page: options.page,
    pageSize: options.pageSize,
    sortOrder: options.sortOrder ?? 'desc',
  })
}

/**
 * Get all audit logs for a specific user
 */
export async function getAuditLogsForUser(
  userId: string,
  options: {
    page?: number
    pageSize?: number
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<ActionResponse<AuditLogListResult>> {
  return getAuditLogs({
    userId,
    page: options.page,
    pageSize: options.pageSize,
    startDate: options.startDate,
    endDate: options.endDate,
  })
}

// ============================================================================
// AUDIT LOG STATISTICS
// ============================================================================

/**
 * Get comprehensive audit log statistics
 */
export async function getAuditLogStats(
  filters: {
    startDate?: Date
    endDate?: Date
    entityType?: EntityType
  } = {}
): Promise<ActionResponse<AuditLogStats>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

    // Build base where clause
    const baseWhere: Prisma.AuditLogWhereInput = {}
    if (filters.startDate || filters.endDate) {
      baseWhere.createdAt = {}
      if (filters.startDate) baseWhere.createdAt.gte = filters.startDate
      if (filters.endDate) baseWhere.createdAt.lte = filters.endDate
    }
    if (filters.entityType) {
      baseWhere.entityType = filters.entityType
    }

    // Execute all queries in parallel
    const [
      totalLogs,
      todayLogs,
      weekLogs,
      monthLogs,
      actionCounts,
      entityTypeCounts,
      topUsersData,
      recentLogsData
    ] = await Promise.all([
      prisma.auditLog.count({ where: baseWhere }),
      prisma.auditLog.count({ 
        where: { ...baseWhere, createdAt: { gte: todayStart } } 
      }),
      prisma.auditLog.count({ 
        where: { ...baseWhere, createdAt: { gte: weekStart } } 
      }),
      prisma.auditLog.count({ 
        where: { ...baseWhere, createdAt: { gte: monthStart } } 
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: baseWhere,
        _count: { action: true },
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where: baseWhere,
        _count: { entityType: true },
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: baseWhere,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    ])

    // Get user details for top users
    const topUserIds = topUsersData.map(u => u.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]))

    // Build byAction map
    const byAction: Record<AuditAction, number> = {
      [AuditAction.CREATE]: 0,
      [AuditAction.UPDATE]: 0,
      [AuditAction.DELETE]: 0,
      [AuditAction.LOGIN]: 0,
      [AuditAction.LOGOUT]: 0,
      [AuditAction.PASSWORD_CHANGE]: 0,
      [AuditAction.EMAIL_CHANGE]: 0,
      [AuditAction.PERMISSION_CHANGE]: 0,
      [AuditAction.STATUS_CHANGE]: 0,
      [AuditAction.ASSIGNMENT]: 0,
      [AuditAction.PAYMENT_PROCESSED]: 0,
      [AuditAction.DOCUMENT_UPLOAD]: 0,
    }
    actionCounts.forEach(item => {
      byAction[item.action] = item._count.action
    })

    // Build byEntityType map
    const byEntityType: Record<EntityType, number> = {
      [EntityType.USER]: 0,
      [EntityType.PROPERTY]: 0,
      [EntityType.UNIT]: 0,
      [EntityType.LEASE]: 0,
      [EntityType.TENANT]: 0,
      [EntityType.MAINTENANCE_REQUEST]: 0,
      [EntityType.PAYMENT]: 0,
      [EntityType.DOCUMENT]: 0,
      [EntityType.UTILITY_BILL]: 0,
      [EntityType.PROPERTY_TAX]: 0,
      [EntityType.UNIT_TAX]: 0,
      [EntityType.PROJECT]: 0,
      [EntityType.BOARD]: 0,
      [EntityType.TASK]: 0,
      [EntityType.COMMENT]: 0,
    }
    entityTypeCounts.forEach(item => {
      byEntityType[item.entityType] = item._count.entityType
    })

    // Format top users
    const topUsers = topUsersData.map(item => ({
      userId: item.userId,
      userName: userMap.get(item.userId) ?? 'Unknown',
      actionCount: item._count.userId,
    }))

    // Calculate hourly activity for last 24 hours
    const hourlyMap = new Map<string, number>()
    for (let i = 0; i < 24; i++) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000)
      const hourKey = hour.toISOString().slice(0, 13)
      hourlyMap.set(hourKey, 0)
    }
    recentLogsData.forEach(log => {
      const hourKey = log.createdAt.toISOString().slice(0, 13)
      hourlyMap.set(hourKey, (hourlyMap.get(hourKey) ?? 0) + 1)
    })
    const recentActivity = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .reverse()

    return {
      success: true,
      data: {
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        byAction,
        byEntityType,
        topUsers,
        recentActivity,
      }
    }
  } catch (error) {
    console.error("Error fetching audit log stats:", error)
    return { success: false, error: "Failed to fetch audit log statistics" }
  }
}

// ============================================================================
// EXPORT AUDIT LOGS
// ============================================================================

/**
 * Export audit logs as JSON (for download/reporting)
 */
export async function exportAuditLogs(
  filters: AuditLogFilters = {}
): Promise<ActionResponse<AuditLogItem[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Override pagination for export - get all matching records (up to 10000)
    const result = await getAuditLogs({
      ...filters,
      page: 1,
      pageSize: 10000, // Max export limit
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error ?? "Failed to export" }
    }

    return {
      success: true,
      data: result.data.items,
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error)
    return { success: false, error: "Failed to export audit logs" }
  }
}

// ============================================================================
// DELETE OLD AUDIT LOGS (ADMIN ONLY)
// ============================================================================

/**
 * Delete audit logs older than a specified date
 * Only available to ADMIN users
 */
export async function deleteOldAuditLogs(
  olderThan: Date
): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { success: false, error: "Only administrators can delete audit logs" }
    }

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: olderThan }
      }
    })

    // Log this admin action
    await logAuditAction(
      EntityType.USER,
      session.user.id,
      AuditAction.DELETE,
      { deletedCount: result.count, olderThan: olderThan.toISOString() },
      { adminAction: 'DELETE_OLD_AUDIT_LOGS' }
    )

    return {
      success: true,
      data: { deletedCount: result.count }
    }
  } catch (error) {
    console.error("Error deleting old audit logs:", error)
    return { success: false, error: "Failed to delete old audit logs" }
  }
}

// ============================================================================
// HELPER: GET ENTITY TYPES & ACTIONS
// ============================================================================

/**
 * Get available entity types for filtering
 */
export async function getEntityTypes(): Promise<ActionResponse<EntityType[]>> {
  return {
    success: true,
    data: Object.values(EntityType),
  }
}

/**
 * Get available audit actions for filtering
 */
export async function getAuditActions(): Promise<ActionResponse<AuditAction[]>> {
  return {
    success: true,
    data: Object.values(AuditAction),
  }
}

/**
 * Get users who have audit log entries (for user filter dropdown)
 */
export async function getAuditLogUsers(): Promise<ActionResponse<Array<{
  id: string
  firstName: string
  lastName: string
  email: string
}>>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userIds = await prisma.auditLog.findMany({
      select: { userId: true },
      distinct: ['userId'],
    })

    const users = await prisma.user.findMany({
      where: { id: { in: userIds.map(u => u.userId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { firstName: 'asc' },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error("Error fetching audit log users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}
