"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

export interface UserWithDetails {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNo: string | null
  role: UserRole
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
  isRecommendingApprover: boolean
  isFinalApprover: boolean
  _count: {
    createdProperties: number
    assignedMaintenance: number
    uploadedDocuments: number
    ownedProjects: number
    assignedTasks: number
    createdTasks: number
    auditLogs: number
    notifications: number
    createdNotices: number
  }
  tenant?: {
    id: string
    bpCode: string
    businessName: string
    status: string
  } | null
}

export async function getUsers(
  page: number = 1,
  limit: number = 12,
  search?: string,
  role?: UserRole
): Promise<{
  users: UserWithDetails[]
  totalCount: number
  totalPages: number
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { contactNo: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {},
        role ? { role } : {}
      ]
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              createdProperties: true,
              assignedMaintenance: true,
              uploadedDocuments: true,
              ownedProjects: true,
              assignedTasks: true,
              createdTasks: true,
              auditLogs: true,
              notifications: true,
              createdNotices: true
            }
          },
          tenant: {
            select: {
              id: true,
              bpCode: true,
              businessName: true,
              status: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      prisma.user.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      users: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNo: user.contactNo,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isRecommendingApprover: user.isRecommendingApprover,
        isFinalApprover: user.isFinalApprover,
        _count: user._count,
        tenant: user.tenant
      })),
      totalCount,
      totalPages
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Failed to fetch users")
  }
}

export async function getUserStats(): Promise<{
  total: number
  admins: number
  managers: number
  staff: number
  tenants: number
  active: number
  verified: number
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const [users, verified] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),
      prisma.user.count({
        where: {
          emailVerified: { not: null }
        }
      })
    ])

    const stats = users.reduce((acc, user) => {
      acc.total += user._count.role
      switch (user.role) {
        case 'ADMIN':
          acc.admins += user._count.role
          break
        case 'MANAGER':
          acc.managers += user._count.role
          break
        case 'STAFF':
          acc.staff += user._count.role
          break
        case 'TENANT':
          acc.tenants += user._count.role
          break
      }
      return acc
    }, {
      total: 0,
      admins: 0,
      managers: 0,
      staff: 0,
      tenants: 0,
      active: 0,
      verified
    })

    // Count active users (those with recent activity or verified email)
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          { emailVerified: { not: null } },
          { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Active in last 30 days
        ]
      }
    })

    stats.active = activeUsers

    return stats
  } catch (error) {
    console.error("Error fetching user stats:", error)
    throw new Error("Failed to fetch user statistics")
  }
}

export async function createUser(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  contactNo?: string
  role: UserRole
  isRecommendingApprover?: boolean
  isFinalApprover?: boolean
}): Promise<{
  success: boolean
  user?: UserWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        contactNo: data.contactNo || null,
        role: data.role,
        isRecommendingApprover: data.isRecommendingApprover ?? false,
        isFinalApprover: data.isFinalApprover ?? false
      },
      include: {
        _count: {
          select: {
            createdProperties: true,
            assignedMaintenance: true,
            uploadedDocuments: true,
            ownedProjects: true,
            assignedTasks: true,
            createdTasks: true,
            auditLogs: true,
            notifications: true,
            createdNotices: true
          }
        },
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            status: true
          }
        }
      }
    })

    revalidatePath("/users")
    
    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNo: user.contactNo,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isRecommendingApprover: user.isRecommendingApprover,
        isFinalApprover: user.isFinalApprover,
        _count: user._count,
        tenant: user.tenant
      }
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function updateUser(data: {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  contactNo?: string
  role?: UserRole
  isRecommendingApprover?: boolean
  isFinalApprover?: boolean
}): Promise<{
  success: boolean
  user?: UserWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: data.id }
    })

    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Check if email is being changed and if it already exists
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (emailExists) {
        return { success: false, error: "Email already exists" }
      }
    }

    const updateData: {
      firstName?: string
      lastName?: string
      email?: string
      contactNo?: string | null
      role?: UserRole
      isRecommendingApprover?: boolean
      isFinalApprover?: boolean
    } = {}

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.email !== undefined) updateData.email = data.email
    if (data.contactNo !== undefined) updateData.contactNo = data.contactNo || null
    if (data.role !== undefined) updateData.role = data.role
    if (data.isRecommendingApprover !== undefined) updateData.isRecommendingApprover = data.isRecommendingApprover
    if (data.isFinalApprover !== undefined) updateData.isFinalApprover = data.isFinalApprover

    const user = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
      include: {
        _count: {
          select: {
            createdProperties: true,
            assignedMaintenance: true,
            uploadedDocuments: true,
            ownedProjects: true,
            assignedTasks: true,
            createdTasks: true,
            auditLogs: true,
            notifications: true,
            createdNotices: true
          }
        },
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            status: true
          }
        }
      }
    })

    revalidatePath("/users")
    
    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNo: user.contactNo,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isRecommendingApprover: user.isRecommendingApprover,
        isFinalApprover: user.isFinalApprover,
        _count: user._count,
        tenant: user.tenant
      }
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

export async function changeUserPassword(data: {
  id: string
  newPassword: string
  isAdminReset?: boolean
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: data.id }
    })

    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Hash new password
    const hashedPassword = await hash(data.newPassword, 12)

    await prisma.user.update({
      where: { id: data.id },
      data: { password: hashedPassword }
    })

    revalidatePath("/users")
    
    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Failed to change password" }
  }
}

export async function getUserById(id: string): Promise<{
  success: boolean
  user?: UserWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdProperties: true,
            assignedMaintenance: true,
            uploadedDocuments: true,
            ownedProjects: true,
            assignedTasks: true,
            createdTasks: true,
            auditLogs: true,
            notifications: true,
            createdNotices: true
          }
        },
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            status: true
          }
        }
      }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNo: user.contactNo,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isRecommendingApprover: user.isRecommendingApprover,
        isFinalApprover: user.isFinalApprover,
        _count: user._count,
        tenant: user.tenant
      }
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { success: false, error: "Failed to fetch user" }
  }
}

export async function deleteUser(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Prevent self-deletion
    if (session.user.id === id) {
      return { success: false, error: "Cannot delete your own account" }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdProperties: true,
            assignedMaintenance: true,
            uploadedDocuments: true,
            ownedProjects: true,
            assignedTasks: true,
            createdTasks: true
          }
        }
      }
    })

    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Check if user has dependencies
    const hasDependencies = Object.values(existingUser._count).some(count => count > 0)
    
    if (hasDependencies) {
      return { 
        success: false, 
        error: "Cannot delete user with existing properties, tasks, or other dependencies" 
      }
    }

    await prisma.user.delete({
      where: { id }
    })

    revalidatePath("/users")
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}