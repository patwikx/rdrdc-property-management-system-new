import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { MaintenanceCategory, Priority, MaintenanceStatus } from "@prisma/client"

const MaintenanceRequestSchema = z.object({
  unitId: z.string(),
  tenantId: z.string().optional(),
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(Priority),
  description: z.string().min(1, "Description is required"),
})

type MaintenanceRequestFormData = z.infer<typeof MaintenanceRequestSchema>

export async function createMaintenanceRequest(data: MaintenanceRequestFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // Validate the input data
    const validatedData = MaintenanceRequestSchema.parse(data)

    // If no tenantId provided, try to find the current tenant for the unit
    let tenantId = validatedData.tenantId
    if (!tenantId) {
      const activeLeaseUnit = await prisma.leaseUnit.findFirst({
        where: {
          unitId: validatedData.unitId,
          lease: {
            status: 'ACTIVE'
          }
        },
        include: {
          lease: {
            select: {
              tenantId: true
            }
          }
        }
      })
      tenantId = activeLeaseUnit?.lease.tenantId
    }

    if (!tenantId) {
      return { error: "No tenant found for this unit. Please specify a tenant or ensure the unit has an active lease." }
    }

    // Create the maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        unitId: validatedData.unitId,
        tenantId: tenantId,
        category: validatedData.category,
        priority: validatedData.priority,
        description: validatedData.description,
        status: MaintenanceStatus.PENDING,
      },
    })

    return { success: true, maintenanceRequest }
  } catch (error) {
    console.error("Error creating maintenance request:", error)
    
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
    
    return { error: "Failed to create maintenance request" }
  }
}