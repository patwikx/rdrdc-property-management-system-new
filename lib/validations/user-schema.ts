import { z } from "zod"
import { UserRole } from "@prisma/client"

export const UserUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().optional(),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.TENANT,
    UserRole.TREASURY,
    UserRole.PURCHASER,
    UserRole.ACCTG,
    UserRole.VIEWER,
    UserRole.OWNER,
    UserRole.STOCKROOM,
    UserRole.MAINTENANCE
  ], {
    message: "Please select a valid role",
  }),
})

export const CreateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  contactNo: z.string().optional(),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.TENANT,
    UserRole.TREASURY,
    UserRole.PURCHASER,
    UserRole.ACCTG,
    UserRole.VIEWER,
    UserRole.OWNER,
    UserRole.STOCKROOM,
    UserRole.MAINTENANCE
  ], {
    message: "Please select a valid role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const PasswordResetSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type UserUpdateData = z.infer<typeof UserUpdateSchema>
export type CreateUserData = z.infer<typeof CreateUserSchema>
export type PasswordResetData = z.infer<typeof PasswordResetSchema>