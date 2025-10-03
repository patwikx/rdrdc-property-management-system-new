"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DocumentListItem } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { FileText, ArrowRight, Download, ExternalLink, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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

interface RecentDocumentsWidgetProps {
  documents: DocumentListItem[]
}

export function RecentDocumentsWidget({ documents }: RecentDocumentsWidgetProps) {
  const handleDownload = (document: DocumentListItem) => {
    window.open(document.fileUrl, '_blank')
  }

  const handleView = (document: DocumentListItem) => {
    window.open(document.fileUrl, '_blank')
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Documents</span>
            </CardTitle>
            <CardDescription>
              Recently uploaded documents
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/documents">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first document to get started
            </p>
            <Button asChild>
              <Link href="/documents">
                Go to Documents
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{document.name}</h4>
                      <Badge className={documentTypeColors[document.documentType]}>
                        {documentTypeLabels[document.documentType]}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        By {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {document.description && (
                      <p className="text-sm text-muted-foreground">
                        {document.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
                    onClick={() => handleDownload(document)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}