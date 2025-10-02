// In "@/lib/auth-actions/auth-users.ts"

import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";


/**
 * Fetches a user by their email address.
 * This is used for authentication purposes.
 */
export const getUserByUsername = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email }
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user by their unique email address.
 * Useful for email-based authentication.
 */
export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user by their ID.
 */
export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches basic user information by ID.
 * Returns only essential fields.
 */
export const getUserBasicInfo = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        contactNo: true,
        role: true,
        emailVerified: true,
      },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's email by their ID.
 */
export const getUserEmailById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's full name by their ID.
 * Returns the concatenated first and last name.
 */
export const getUserNameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        firstName: true, 
        lastName: true
      },
    });

    if (!user) return null;

    return `${user.firstName} ${user.lastName}`;
  } catch {
    return null;
  }
};

/**
 * Checks if a user has a specific role.
 * Simple role-based authorization check.
 */
export const userHasRole = async (
  userId: string, 
  role: UserRole
): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === role;
  } catch {
    return false;
  }
};

/**
 * Gets all users with a specific role.
 */
export const getUsersByRole = async (role: UserRole) => {
  try {
    const users = await prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        contactNo: true,
        role: true,
        emailVerified: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
    });
    return users;
  } catch {
    return [];
  }
};

/**
 * Gets active users for dropdown/selection purposes.
 * Returns basic info suitable for UI components.
 */
export const getActiveUsersForSelection = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        emailVerified: { not: null }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
    });

    // Transform data for easier use in UI - properly typed
    return users.map((user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      role: UserRole;
    }) => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      role: user.role,
    }));
  } catch {
    return [];
  }
};