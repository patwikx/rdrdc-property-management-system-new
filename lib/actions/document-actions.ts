"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DocumentSchema, DocumentUpdateSchema, DocumentFormData, DocumentUpdateData } from "@/lib/validations/document-schema"
import { DocumentType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function createDocument(data: DocumentFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = DocumentSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { name, description, documentType, fileUrl, propertyId, unitId, tenantId } = validatedFields.data

  try {
    const document = await prisma.document.create({
      data: {
        name,
        description,
        documentType,
        fileUrl,
        propertyId: propertyId || null,
        unitId: unitId || null,
        tenantId: tenantId || null,
        uploadedById: session.user.id,
      },
    })

    if (propertyId) {
      revalidatePath(`/properties/${propertyId}`)
    }
    
    return { success: "Document uploaded successfully", document }
  } catch (error) {
    console.error("Error creating document:", error)
    return {
      error: "Failed to upload document",
    }
  }
}

export async function updateDocument(data: DocumentUpdateData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedFields = DocumentUpdateSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      details: validatedFields.error.format(),
    }
  }

  const { id, name, description, documentType } = validatedFields.data

  try {
    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      return {
        error: "Document not found",
      }
    }

    const updateData: {
      name?: string
      description?: string | null
      documentType?: DocumentType
    } = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (documentType !== undefined) updateData.documentType = documentType

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
    })

    if (existingDocument.propertyId) {
      revalidatePath(`/properties/${existingDocument.propertyId}`)
    }
    
    return { success: "Document updated successfully", document }
  } catch (error) {
    console.error("Error updating document:", error)
    return {
      error: "Failed to update document",
    }
  }
}

export async function deleteDocument(id: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      return {
        error: "Document not found",
      }
    }

    await prisma.document.delete({
      where: { id },
    })

    if (existingDocument.propertyId) {
      revalidatePath(`/properties/${existingDocument.propertyId}`)
    }
    
    return { success: "Document deleted successfully" }
  } catch (error) {
    console.error("Error deleting document:", error)
    return {
      error: "Failed to delete document",
    }
  }
}