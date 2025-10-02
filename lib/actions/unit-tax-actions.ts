import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"

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

type UnitTaxFormData = z.infer<typeof UnitTaxSchema>

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
      if (error.code === 'P2002') {
        return { error: "A tax record with this declaration number already exists for this unit" }
      }
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const details: Record<string, { _errors: string[] }> = {}
      
      zodError.issues.forEach((issue) => {
        const field = issue.path.join('.')
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