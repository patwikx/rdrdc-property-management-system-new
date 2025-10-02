
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

import { PropertyTaxSchema, PropertyTaxUpdateSchema, PropertyTaxFormData, PropertyTaxUpdateData } from "@/lib/validations/property-tax-schema"
import { revalidatePath } from "next/cache"

export async function createPropertyTax(data: PropertyTaxFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyTaxSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { 
    propertyTitleId, 
    taxYear, 
    TaxDecNo, 
    taxAmount, 
    dueDate, 
    isPaid, 
    paidDate, 
    remarks, 
    isAnnual, 
    isQuarterly, 
    whatQuarter, 
    processedBy, 
    markedAsPaidBy, 
    paidRemarks, 
    fileUrl 
  } = validatedFields.data

  try {
    const propertyTax = await prisma.propertyTax.create({
      data: {
        propertyTitleId,
        taxYear,
        TaxDecNo,
        taxAmount,
        dueDate,
        isPaid: isPaid || false,
        paidDate,
        remarks,
        isAnnual: isAnnual || false,
        isQuarterly: isQuarterly || false,
        whatQuarter,
        processedBy,
        markedAsPaidBy,
        paidRemarks,
        fileUrl,
      },
    })

    // Get the property ID for revalidation
    const propertyTitle = await prisma.propertyTitles.findUnique({
      where: { id: propertyTitleId },
      select: { propertyId: true },
    })

    if (propertyTitle) {
      revalidatePath(`/properties/${propertyTitle.propertyId}`)
    }
    revalidatePath("/properties")

    return {
      success: true,
      data: propertyTax,
    }
  } catch (error) {
    console.error("Error creating property tax:", error)
    return {
      error: "Failed to create property tax record",
    }
  }
}

export async function updatePropertyTax(data: PropertyTaxUpdateData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = PropertyTaxUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { 
    id, 
    propertyTitleId, 
    taxYear, 
    TaxDecNo, 
    taxAmount, 
    dueDate, 
    isPaid, 
    paidDate, 
    remarks, 
    isAnnual, 
    isQuarterly, 
    whatQuarter, 
    processedBy, 
    markedAsPaidBy, 
    paidRemarks, 
    fileUrl 
  } = validatedFields.data

  try {
    // Check if property tax exists
    const existingTax = await prisma.propertyTax.findUnique({
      where: { id },
      include: {
        propertyTitle: {
          select: { propertyId: true },
        },
      },
    })

    if (!existingTax) {
      return {
        error: "Property tax record not found",
      }
    }

    const propertyTax = await prisma.propertyTax.update({
      where: { id },
      data: {
        ...(propertyTitleId && { propertyTitleId }),
        ...(taxYear && { taxYear }),
        ...(TaxDecNo && { TaxDecNo }),
        ...(taxAmount !== undefined && { taxAmount }),
        ...(dueDate && { dueDate }),
        ...(isPaid !== undefined && { isPaid }),
        ...(paidDate !== undefined && { paidDate }),
        ...(remarks !== undefined && { remarks }),
        ...(isAnnual !== undefined && { isAnnual }),
        ...(isQuarterly !== undefined && { isQuarterly }),
        ...(whatQuarter !== undefined && { whatQuarter }),
        ...(processedBy !== undefined && { processedBy }),
        ...(markedAsPaidBy !== undefined && { markedAsPaidBy }),
        ...(paidRemarks !== undefined && { paidRemarks }),
        ...(fileUrl !== undefined && { fileUrl }),
      },
    })

    revalidatePath(`/properties/${existingTax.propertyTitle.propertyId}`)
    revalidatePath("/properties")

    return {
      success: true,
      data: propertyTax,
    }
  } catch (error) {
    console.error("Error updating property tax:", error)
    return {
      error: "Failed to update property tax record",
    }
  }
}

export async function deletePropertyTax(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if property tax exists
    const existingTax = await prisma.propertyTax.findUnique({
      where: { id },
      include: {
        propertyTitle: {
          select: { propertyId: true },
        },
      },
    })

    if (!existingTax) {
      return {
        error: "Property tax record not found",
      }
    }

    await prisma.propertyTax.delete({
      where: { id },
    })

    revalidatePath(`/properties/${existingTax.propertyTitle.propertyId}`)
    revalidatePath("/properties")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting property tax:", error)
    return {
      error: "Failed to delete property tax record",
    }
  }
}

export async function markPropertyTaxAsPaid(id: string, paidDate?: Date, paidRemarks?: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if property tax exists
    const existingTax = await prisma.propertyTax.findUnique({
      where: { id },
      include: {
        propertyTitle: {
          select: { propertyId: true },
        },
      },
    })

    if (!existingTax) {
      return {
        error: "Property tax record not found",
      }
    }

    const propertyTax = await prisma.propertyTax.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: paidDate || new Date(),
        markedAsPaidBy: session.user.id,
        paidRemarks,
      },
    })

    revalidatePath(`/properties/${existingTax.propertyTitle.propertyId}`)
    revalidatePath("/properties")

    return {
      success: true,
      data: propertyTax,
    }
  } catch (error) {
    console.error("Error marking property tax as paid:", error)
    return {
      error: "Failed to mark property tax as paid",
    }
  }
}