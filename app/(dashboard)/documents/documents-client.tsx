"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DocumentsTable } from "@/components/documents/documents-table"
import { DocumentDetailsDialog } from "@/components/documents/document-details-dialog"
import { DocumentListItem, DocumentWithDetails, getDocumentById, deleteDocument } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { Plus, FolderOpen } from "lucide-react"
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
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
            <span>Document Repository</span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">
            System-wide File Management & Archival
          </p>
        </div>
        <Button asChild className="rounded-none h-9 text-xs uppercase tracking-wider font-bold">
          <Link href="/documents/create">
            <Plus className="h-3 w-3 mr-2" />
            Upload File
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
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold uppercase tracking-widest text-sm">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              Are you sure you want to permanently delete &apos;{documentToDelete?.name}&apos;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-border font-mono text-xs uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none font-mono text-xs uppercase"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}