"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DocumentsTable } from "@/components/documents/documents-table"
import { DocumentDetailsDialog } from "@/components/documents/document-details-dialog"
import { DocumentListItem, DocumentWithDetails, getDocumentById, deleteDocument } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { Plus, FileText } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"

interface DocumentsClientProps {
  initialDocuments: DocumentListItem[]
  totalCount: number
  currentPage: number
  totalPages: number
  initialSearch: string
  initialType: DocumentType | ""
  initialPropertyId: string
  initialUnitId: string
  initialTenantId: string
}

export function DocumentsClient({
  initialDocuments,
  totalCount,
  currentPage,
  totalPages,
}: DocumentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [documents, setDocuments] = useState<DocumentListItem[]>(initialDocuments)
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithDetails | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentListItem | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false)

  // Update documents when props change
  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const updateSearchParams = (params: Record<string, string | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value)
      } else {
        newSearchParams.delete(key)
      }
    })

    // Reset to page 1 when filtering
    if (params.search !== undefined || params.type !== undefined) {
      newSearchParams.delete('page')
    }

    router.push(`/documents?${newSearchParams.toString()}`)
  }

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() })
  }

  const handleSearch = (search: string) => {
    updateSearchParams({ search: search || undefined })
  }

  const handleFilterType = (type: DocumentType | "") => {
    updateSearchParams({ type: type || undefined })
  }

  const handleView = async (document: DocumentListItem) => {
    try {
      const fullDocument = await getDocumentById(document.id)
      if (fullDocument) {
        setSelectedDocument(fullDocument)
        setIsDetailsDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching document details:", error)
      toast.error("Failed to load document details")
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (document: DocumentListItem) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon")
  }

  const handleDelete = (document: DocumentListItem) => {
    setDocumentToDelete(document)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      const result = await deleteDocument(documentToDelete.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Document deleted successfully")
        // Remove from local state
        setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id))
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error("Failed to delete document")
    } finally {
      setDocumentToDelete(null)
    }
  }



  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <FileText className="h-8 w-8" />
            <span>Documents</span>
          </h1>
          <p className="text-muted-foreground">
            Manage and organize all property-related documents
          </p>
        </div>
        <Button asChild>
          <Link href="/documents/create">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
      </div>

      {/* Documents Table */}
      <DocumentsTable
        documents={documents}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilterType={handleFilterType}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Document Details Dialog */}
      <DocumentDetailsDialog
        document={selectedDocument}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onEdit={(document) => {
          setIsDetailsDialogOpen(false)
          handleEdit(document as DocumentListItem)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &apos;{documentToDelete?.name}&apos;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}