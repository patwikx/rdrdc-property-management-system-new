"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

import { TitleMovementSchema, TitleMovementUpdateSchema, TitleMovementFormData, TitleMovementUpdateData } from "@/lib/validations/title-movement-schema"
import { revalidatePath } from "next/cache"

export async function createTitleMovement(data: TitleMovementFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = TitleMovementSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { propertyId, status, location, purpose, remarks, requestDate, returnDate } = validatedFields.data

  try {
    const titleMovement = await prisma.propertyTitleMovement.create({
      data: {
        propertyId,
        requestedBy: session.user.id, // Use the current user's ID as the requester
        status,
        location,
        purpose,
        remarks,
        requestDate,
        returnDate,
      },
    })

    revalidatePath(`/properties/${propertyId}`)
    revalidatePath("/properties")

    return {
      success: true,
      data: titleMovement,
    }
  } catch (error) {
    console.error("Error creating title movement:", error)
    return {
      error: "Failed to create title movement",
    }
  }
}

export async function updateTitleMovement(data: TitleMovementUpdateData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = TitleMovementUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { id, propertyId, requestedBy, status, location, purpose, remarks, requestDate, returnDate } = validatedFields.data

  try {
    // Check if title movement exists
    const existingMovement = await prisma.propertyTitleMovement.findUnique({
      where: { id },
    })

    if (!existingMovement) {
      return {
        error: "Title movement not found",
      }
    }

    const titleMovement = await prisma.propertyTitleMovement.update({
      where: { id },
      data: {
        ...(propertyId && { propertyId }),
        ...(requestedBy && { requestedBy }),
        ...(status && { status }),
        ...(location && { location }),
        ...(purpose && { purpose }),
        ...(remarks !== undefined && { remarks }),
        ...(requestDate && { requestDate }),
        ...(returnDate !== undefined && { returnDate }),
      },
    })

    revalidatePath(`/properties/${titleMovement.propertyId}`)
    revalidatePath("/properties")

    return {
      success: true,
      data: titleMovement,
    }
  } catch (error) {
    console.error("Error updating title movement:", error)
    return {
      error: "Failed to update title movement",
    }
  }
}

export async function deleteTitleMovement(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if title movement exists
    const existingMovement = await prisma.propertyTitleMovement.findUnique({
      where: { id },
    })

    if (!existingMovement) {
      return {
        error: "Title movement not found",
      }
    }

    await prisma.propertyTitleMovement.delete({
      where: { id },
    })

    revalidatePath(`/properties/${existingMovement.propertyId}`)
    revalidatePath("/properties")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting title movement:", error)
    return {
      error: "Failed to delete title movement",
    }
  }
}