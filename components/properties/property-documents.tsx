import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, ExternalLink } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { UploadDocumentForm } from "./upload-document-form"
import { format } from "date-fns"

interface PropertyDocumentsProps {
  property: PropertyWithDetails
}

export function PropertyDocuments({ property }: PropertyDocumentsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleDocumentUploaded = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the property data
    window.location.reload()
  }
  if (property.documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any documents yet.
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" variant="outline">
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <UploadDocumentForm 
              propertyId={property.id}
              onSuccess={handleDocumentUploaded}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'LEASE': return 'bg-blue-600'
      case 'CONTRACT': return 'bg-green-600'
      case 'INVOICE': return 'bg-yellow-600'
      case 'MAINTENANCE': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents ({property.documents.length})</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <UploadDocumentForm 
              propertyId={property.id}
              onSuccess={handleDocumentUploaded}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4">
        {property.documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{document.name}</span>
                      <Badge className={getDocumentTypeColor(document.documentType)}>
                        {document.documentType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Uploaded by {document.uploadedBy.firstName} {document.uploadedBy.lastName} • {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={document.fileUrl} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}