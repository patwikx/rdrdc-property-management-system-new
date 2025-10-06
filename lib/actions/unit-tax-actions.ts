"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

const UnitTaxSchema = z.object({
  unitId: z.string(),
  taxYear: z.number().min(1900).max(2100),
  taxDecNo: z.string().min(1, "Tax Declaration Number is required"),
  taxAmount: z.number().min(0, "Tax amount must be positive"),
  dueDate: z.date(),
  isPaid: z.boolean().default(false),
  paidDate: z.date().optional(),
  isAnnual: z.boolean().default(true),
  isQuarterly: z.boolean().default(false),
  whatQuarter: z.string().optional(),
  remarks: z.string().optional(),
})

const UnitTaxUpdateSchema = z.object({
  id: z.string(),
  unitId: z.string().optional(),
  taxYear: z.number().min(1900).max(2100).optional(),
  taxDecNo: z.string().min(1, "Tax Declaration Number is required").optional(),
  taxAmount: z.number().min(0, "Tax amount must be positive").optional(),
  dueDate: z.date().optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.date().optional().nullable(),
  isAnnual: z.boolean().optional(),
  isQuarterly: z.boolean().optional(),
  whatQuarter: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

type UnitTaxFormData = z.infer<typeof UnitTaxSchema>
type UnitTaxUpdateData = z.infer<typeof UnitTaxUpdateSchema>

export async function createUnitTax(data: UnitTaxFormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Validate the input data
    const validatedData = UnitTaxSchema.parse(data)

    // Create the unit tax record
    const unitTax = await prisma.unitTax.create({
      data: {
        unitId: validatedData.unitId,
        taxYear: validatedData.taxYear,
        taxDecNo: validatedData.taxDecNo,
        taxAmount: validatedData.taxAmount,
        dueDate: validatedData.dueDate,
        isPaid: validatedData.isPaid,
        paidDate: validatedData.isPaid && validatedData.paidDate ? validatedData.paidDate : null,
        isAnnual: validatedData.isAnnual,
        isQuarterly: validatedData.isQuarterly,
        whatQuarter: validatedData.whatQuarter || null,
        remarks: validatedData.remarks || null,
      },
    })

    return { success: true, unitTax }
  } catch (error) {
    console.error("Error creating unit tax:", error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "A tax record with this declaration number already exists for this unit" }
      }
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const details: Record<string, { _errors: string[] }> = {}

      zodError.issues.forEach((issue) => {
        const field = issue.path.join(".")
        if (!details[field]) {
          details[field] = { _errors: [] }
        }
        details[field]._errors.push(issue.message)
      })

      return { error: "Validation failed", details }
    }

    return { error: "Failed to create unit tax record" }
  }
}

export async function updateUnitTax(data: UnitTaxUpdateData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validatedFields = UnitTaxUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const {
    id,
    unitId,
    taxYear,
    taxDecNo,
    taxAmount,
    dueDate,
    isPaid,
    paidDate,
    remarks,
    isAnnual,
    isQuarterly,
    whatQuarter,
  } = validatedFields.data

  try {
    // Check if unit tax exists
    const existingTax = await prisma.unitTax.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            propertyId: true,
          },
        },
      },
    })

    if (!existingTax) {
      return {
        error: "Unit tax record not found",
      }
    }

    const unitTax = await prisma.unitTax.update({
      where: { id },
      data: {
        ...(unitId && { unitId }),
        ...(taxYear && { taxYear }),
        ...(taxDecNo && { taxDecNo }),
        ...(taxAmount !== undefined && { taxAmount }),
        ...(dueDate && { dueDate }),
        ...(isPaid !== undefined && { isPaid }),
        ...(paidDate !== undefined && { paidDate }),
        ...(remarks !== undefined && { remarks }),
        ...(isAnnual !== undefined && { isAnnual }),
        ...(isQuarterly !== undefined && { isQuarterly }),
        ...(whatQuarter !== undefined && { whatQuarter }),
      },
    })

    revalidatePath(`/properties/${existingTax.unit.propertyId}/units/${existingTax.unit.id}`)
    revalidatePath(`/properties/${existingTax.unit.propertyId}`)

    return {
      success: true,
      data: unitTax,
    }
  } catch (error) {
    console.error("Error updating unit tax:", error)
    return {
      error: "Failed to update unit tax record",
    }
  }
}

export async function markUnitTaxAsPaid(id: string, paidDate?: Date, paidRemarks?: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Check if unit tax exists
    const existingTax = await prisma.unitTax.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            propertyId: true,
          },
        },
      },
    })

    if (!existingTax) {
      return {
        error: "Unit tax record not found",
      }
    }

    const unitTax = await prisma.unitTax.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: paidDate || new Date(),
        markedAsPaidBy: session.user.id,
        paidRemarks,
      },
    })

    revalidatePath(`/properties/${existingTax.unit.propertyId}/units/${existingTax.unit.id}`)
    revalidatePath(`/properties/${existingTax.unit.propertyId}`)

    return {
      success: true,
      data: unitTax,
    }
  } catch (error) {
    console.error("Error marking unit tax as paid:", error)
    return {
      error: "Failed to mark unit tax as paid",
    }
  }
}

export async function deleteUnitTax(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Check if unit tax exists
    const existingTax = await prisma.unitTax.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            propertyId: true,
          },
        },
      },
    })

    if (!existingTax) {
      return {
        error: "Unit tax record not found",
      }
    }

    await prisma.unitTax.delete({
      where: { id },
    })

    revalidatePath(`/properties/${existingTax.unit.propertyId}/units/${existingTax.unit.id}`)
    revalidatePath(`/properties/${existingTax.unit.propertyId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting unit tax:", error)
    return {
      error: "Failed to delete unit tax record",
    }
  }
}
