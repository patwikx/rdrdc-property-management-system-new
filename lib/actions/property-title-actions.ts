"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { PropertyTitleSchema, PropertyTitleUpdateSchema, PropertyTitleFormData, PropertyTitleUpdateData } from "@/lib/validations/property-title-schema"
import { revalidatePath } from "next/cache"

export async function createPropertyTitle(data: PropertyTitleFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyTitleSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { propertyId, titleNo, lotNo, lotArea, registeredOwner, isEncumbered, encumbranceDetails } = validatedFields.data

  try {
    // Check if title number already exists
    const existingTitle = await prisma.propertyTitles.findUnique({
      where: { titleNo },
    })

    if (existingTitle) {
      return {
        error: "Title number already exists",
      }
    }

    const title = await prisma.propertyTitles.create({
      data: {
        propertyId,
        titleNo,
        lotNo,
        lotArea,
        registeredOwner,
        isEncumbered,
        encumbranceDetails: isEncumbered ? encumbranceDetails : null,
      },
    })

    revalidatePath(`/properties/${propertyId}`)
    return { success: "Property title created successfully", title }
  } catch (error) {
    console.error("Error creating property title:", error)
    return {
      error: "Failed to create property title",
    }
  }
}

export async function updatePropertyTitle(data: PropertyTitleUpdateData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyTitleUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { id, titleNo, lotNo, lotArea, registeredOwner, isEncumbered, encumbranceDetails } = validatedFields.data

  try {
    // Check if title exists
    const existingTitle = await prisma.propertyTitles.findUnique({
      where: { id },
    })

    if (!existingTitle) {
      return {
        error: "Property title not found",
      }
    }

    // Check if title number is being changed and if it already exists
    if (titleNo && titleNo !== existingTitle.titleNo) {
      const numberExists = await prisma.propertyTitles.findUnique({
        where: { titleNo },
      })

      if (numberExists) {
        return {
          error: "Title number already exists",
        }
      }
    }

    const updateData: {
      titleNo?: string
      lotNo?: string
      lotArea?: number
      registeredOwner?: string
      isEncumbered?: boolean
      encumbranceDetails?: string | null
    } = {}
    
    if (titleNo !== undefined) updateData.titleNo = titleNo
    if (lotNo !== undefined) updateData.lotNo = lotNo
    if (lotArea !== undefined) updateData.lotArea = lotArea
    if (registeredOwner !== undefined) updateData.registeredOwner = registeredOwner
    if (isEncumbered !== undefined) {
      updateData.isEncumbered = isEncumbered
      updateData.encumbranceDetails = isEncumbered ? encumbranceDetails : null
    }

    const title = await prisma.propertyTitles.update({
      where: { id },
      data: updateData,
    })

    revalidatePath(`/properties/${existingTitle.propertyId}`)
    return { success: "Property title updated successfully", title }
  } catch (error) {
    console.error("Error updating property title:", error)
    return {
      error: "Failed to update property title",
    }
  }
}

export async function deletePropertyTitle(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if title exists
    const existingTitle = await prisma.propertyTitles.findUnique({
      where: { id },
      include: {
        propertyTaxes: true,
        units: true,
      },
    })

    if (!existingTitle) {
      return {
        error: "Property title not found",
      }
    }

    // Check if title has property taxes
    if (existingTitle.propertyTaxes.length > 0) {
      return {
        error: "Cannot delete title with existing property taxes",
      }
    }

    // Check if title has associated units
    if (existingTitle.units.length > 0) {
      return {
        error: "Cannot delete title with associated units",
      }
    }

    await prisma.propertyTitles.delete({
      where: { id },
    })

    revalidatePath(`/properties/${existingTitle.propertyId}`)
    return { success: "Property title deleted successfully" }
  } catch (error) {
    console.error("Error deleting property title:", error)
    return {
      error: "Failed to delete property title",
    }
  }
}