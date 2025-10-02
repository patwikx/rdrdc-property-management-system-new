import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Plus, Download, ExternalLink } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { UploadDocumentForm } from "@/components/properties/upload-document-form"
import { format } from "date-fns"

interface UnitDocumentsProps {
  unit: UnitWithDetails
}

function getDocumentTypeColor(type: string) {
  switch (type) {
    case 'LEASE': return 'bg-blue-600'
    case 'CONTRACT': return 'bg-green-600'
    case 'INVOICE': return 'bg-yellow-600'
    case 'MAINTENANCE': return 'bg-orange-600'
    case 'OTHER': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

export function UnitDocuments({ unit }: UnitDocumentsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleDocumentUploaded = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the unit data
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Unit Documents</span>
            </CardTitle>
            <CardDescription>Documents and files related to this unit</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="!w-[650px] !max-w-[650px] !min-w-[650px]" style={{ width: '650px', maxWidth: '650px', minWidth: '650px' }}>
              <DialogHeader>
                <DialogTitle>Upload Unit Document</DialogTitle>
              </DialogHeader>
              <UploadDocumentForm
                unitId={unit.id}
                onSuccess={handleDocumentUploaded}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {unit.documents.length > 0 ? (
          <div className="space-y-4">
            {unit.documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">{document.name}</h4>
                      <Badge className={getDocumentTypeColor(document.documentType)} variant="secondary">
                        {document.documentType}
                      </Badge>
                    </div>
                    {document.description && (
                      <p className="text-sm text-muted-foreground truncate mb-1">{document.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Uploaded {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
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
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold">No documents</h4>
            <p className="text-sm text-muted-foreground">
              This unit has no documents uploaded yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}