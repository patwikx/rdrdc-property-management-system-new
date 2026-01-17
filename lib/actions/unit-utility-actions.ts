"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UnitUtilitySchema = z.object({
  unitId: z.string(),
  utilityType: z.enum(['ELECTRICITY', 'WATER', 'OTHERS']),
  accountNumber: z.string().min(1, "Account number is required"),
  meterNumber: z.string().optional(),
  providerName: z.string().optional(),
  billingDueDay: z.number().min(1).max(31).optional(),
  billingId: z.string().optional(),
  isActive: z.boolean(),
  remarks: z.string().optional(),
})

type UnitUtilityFormData = z.infer<typeof UnitUtilitySchema>

export async function createUnitUtility(data: UnitUtilityFormData) {
  try {
    // Validate the input data
    const validatedData = UnitUtilitySchema.parse(data)

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: validatedData.unitId }
    })

    if (!unit) {
      return { error: "Unit not found" }
    }

    // Check if account number already exists for this unit and utility type
    const existingAccount = await prisma.unitUtilityAccount.findFirst({
      where: {
        unitId: validatedData.unitId,
        utilityType: validatedData.utilityType,
        accountNumber: validatedData.accountNumber
      }
    })

    if (existingAccount) {
      return { 
        error: `A ${validatedData.utilityType.toLowerCase()} account with this account number already exists for this unit` 
      }
    }

    // Create the utility account
    const utilityAccount = await prisma.unitUtilityAccount.create({
      data: {
        unitId: validatedData.unitId,
        utilityType: validatedData.utilityType,
        accountNumber: validatedData.accountNumber,
        meterNumber: validatedData.meterNumber || null,
        providerName: validatedData.providerName || null,
        billingDueDay: validatedData.billingDueDay || null,
        billingId: validatedData.billingId || null,
        isActive: validatedData.isActive,
        remarks: validatedData.remarks || null,
      }
    })

    return { success: true, data: utilityAccount }
  } catch (error) {
    console.error("Error creating unit utility account:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        error: "Invalid input data", 
        details: error.flatten().fieldErrors 
      }
    }
    
    return { error: "Failed to create utility account" }
  }
}