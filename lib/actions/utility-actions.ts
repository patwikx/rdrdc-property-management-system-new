"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PropertyUtilitySchema, PropertyUtilityUpdateSchema, PropertyUtilityFormData, PropertyUtilityUpdateData } from "@/lib/validations/utility-schema"
import { UtilityType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function createPropertyUtility(data: PropertyUtilityFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyUtilitySchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { propertyId, utilityType, provider, accountNumber, meterNumber, isActive } = validatedFields.data

  try {
    const utility = await prisma.propertyUtility.create({
      data: {
        propertyId,
        utilityType,
        provider,
        accountNumber,
        meterNumber,
        isActive,
      },
    })

    revalidatePath(`/properties/${propertyId}`)
    return { success: "Utility created successfully", utility }
  } catch (error) {
    console.error("Error creating utility:", error)
    return {
      error: "Failed to create utility",
    }
  }
}

export async function updatePropertyUtility(data: PropertyUtilityUpdateData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyUtilityUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { id, utilityType, provider, accountNumber, meterNumber, isActive } = validatedFields.data

  try {
    // Check if utility exists
    const existingUtility = await prisma.propertyUtility.findUnique({
      where: { id },
    })

    if (!existingUtility) {
      return {
        error: "Utility not found",
      }
    }

    const updateData: {
      utilityType?: UtilityType
      provider?: string
      accountNumber?: string
      meterNumber?: string | null
      isActive?: boolean
    } = {}
    
    if (utilityType !== undefined) updateData.utilityType = utilityType
    if (provider !== undefined) updateData.provider = provider
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (meterNumber !== undefined) updateData.meterNumber = meterNumber
    if (isActive !== undefined) updateData.isActive = isActive

    const utility = await prisma.propertyUtility.update({
      where: { id },
      data: updateData,
    })

    revalidatePath(`/properties/${existingUtility.propertyId}`)
    return { success: "Utility updated successfully", utility }
  } catch (error) {
    console.error("Error updating utility:", error)
    return {
      error: "Failed to update utility",
    }
  }
}

export async function deletePropertyUtility(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if utility exists
    const existingUtility = await prisma.propertyUtility.findUnique({
      where: { id },
      include: {
        bills: true,
      },
    })

    if (!existingUtility) {
      return {
        error: "Utility not found",
      }
    }

    // Check if utility has bills
    if (existingUtility.bills.length > 0) {
      return {
        error: "Cannot delete utility with existing bills",
      }
    }

    await prisma.propertyUtility.delete({
      where: { id },
    })

    revalidatePath(`/properties/${existingUtility.propertyId}`)
    return { success: "Utility deleted successfully" }
  } catch (error) {
    console.error("Error deleting utility:", error)
    return {
      error: "Failed to delete utility",
    }
  }
}