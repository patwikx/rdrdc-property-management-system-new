"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentListItem, DocumentWithDetails, getDocumentById } from "@/lib/actions/document-actions"
import { DocumentDetailsDialog } from "./document-details-dialog"
import { DocumentType } from "@prisma/client"
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  ExternalLink,
  Calendar
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"

const documentTypeLabels: Record<DocumentType, string> = {
  LEASE: "Lease",
  CONTRACT: "Contract", 
  INVOICE: "Invoice",
  MAINTENANCE: "Maintenance",
  OTHER: "Other"
}

const documentTypeColors: Record<DocumentType, string> = {
  LEASE: "bg-blue-600",
  CONTRACT: "bg-green-600",
  INVOICE: "bg-yellow-600", 
  MAINTENANCE: "bg-orange-600",
  OTHER: "bg-gray-600"
}

interface DocumentsSectionProps {
  documents: DocumentListItem[]
  entityType: 'property' | 'unit' | 'tenant'
  entityId: string
  entityName: string
  onRefresh?: () => void
}

export function DocumentsSection({
  documents,
  entityType,
  entityId,
  entityName}: DocumentsSectionProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithDetails | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

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

  const handleDownload = (document: DocumentListItem) => {
    window.open(document.fileUrl, '_blank')
  }

  const getCreateUrl = () => {
    const params = new URLSearchParams()
    switch (entityType) {
      case 'property':
        params.set('property', entityId)
        break
      case 'unit':
        params.set('unit', entityId)
        break
      case 'tenant':
        params.set('tenant', entityId)
        break
    }
    return `/documents/create?${params.toString()}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </CardTitle>
            <CardDescription>
              Documents associated with {entityName}
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href={getCreateUrl()}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first document to get started
            </p>
            <Button asChild>
              <Link href={getCreateUrl()}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{document.name}</div>
                        {document.description && (
                          <div className="text-sm text-muted-foreground">
                            {document.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={documentTypeColors[document.documentType]}>
                        {documentTypeLabels[document.documentType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(document)}
                          title="View"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(document)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Document Details Dialog */}
      <DocumentDetailsDialog
        document={selectedDocument}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </Card>
  )
}