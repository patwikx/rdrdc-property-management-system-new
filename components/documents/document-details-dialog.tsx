"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DocumentWithDetails } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Building, 
  Home, 
  User, 
  Calendar,
  Upload,
  Edit
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

const documentTypeLabels: Record<DocumentType, string> = {
  LEASE: "Lease Agreement",
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

interface DocumentDetailsDialogProps {
  document: DocumentWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (document: DocumentWithDetails) => void
}

export function DocumentDetailsDialog({
  document,
  open,
  onOpenChange,
  onEdit
}: DocumentDetailsDialogProps) {
  if (!document) return null

  const handleDownload = () => {
    window.open(document.fileUrl, '_blank')
  }

  const handleView = () => {
    window.open(document.fileUrl, '_blank')
  }

  const getAssociationInfo = () => {
    if (document.tenant) {
      return {
        type: 'Tenant',
        label: `${document.tenant.bpCode} - ${document.tenant.firstName} ${document.tenant.lastName}`,
        sublabel: document.tenant.company,
        icon: User
      }
    }
    if (document.unit) {
      return {
        type: 'Unit',
        label: `${document.unit.unitNumber} - ${document.unit.property.propertyName}`,
        sublabel: document.unit.property.propertyCode,
        icon: Home
      }
    }
    if (document.property) {
      return {
        type: 'Property',
        label: `${document.property.propertyCode} - ${document.property.propertyName}`,
        sublabel: null,
        icon: Building
      }
    }
    return null
  }

  const associationInfo = getAssociationInfo()
  const AssociationIcon = associationInfo?.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{document.name}</span>
          </DialogTitle>
          <DialogDescription>
            Document details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Type and Status */}
          <div className="flex items-center justify-between">
            <Badge className={documentTypeColors[document.documentType]}>
              {documentTypeLabels[document.documentType]}
            </Badge>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleView}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(document)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Document Name</h4>
                <p className="font-medium">{document.name}</p>
              </div>

              {document.description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{document.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Document Type</h4>
                <Badge variant="outline" className="text-sm">
                  {documentTypeLabels[document.documentType]}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Uploaded By</span>
                </h4>
                <p className="font-medium">
                  {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Upload Date</span>
                </h4>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {format(new Date(document.createdAt), 'PPP')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {document.updatedAt !== document.createdAt && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Last Updated</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {format(new Date(document.updatedAt), 'PPP')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Association Information */}
          {associationInfo && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center space-x-2">
                  {AssociationIcon && <AssociationIcon className="h-4 w-4" />}
                  <span>Associated {associationInfo.type}</span>
                </h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {AssociationIcon && (
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <AssociationIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{associationInfo.label}</p>
                      {associationInfo.sublabel && (
                        <p className="text-sm text-muted-foreground">{associationInfo.sublabel}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* File Information */}
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">File Information</h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{document.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Click to view or download the document
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleView}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}