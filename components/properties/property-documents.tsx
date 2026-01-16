import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, ExternalLink, Search, Plus, Calendar, User, File, X } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { UploadDocumentForm } from "./upload-document-form"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface PropertyDocumentsProps {
  property: PropertyWithDetails
}

export function PropertyDocuments({ property }: PropertyDocumentsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const handleDocumentUploaded = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  const getDocumentTypeStyle = (type: string) => {
    switch (type) {
      case 'LEASE': return { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500' }
      case 'CONTRACT': return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500' }
      case 'INVOICE': return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-500' }
      case 'MAINTENANCE': return { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-500' }
      default: return { border: 'border-slate-500', text: 'text-slate-600', bg: 'bg-slate-500' }
    }
  }

  // Filter documents
  const filteredDocuments = property.documents.filter(doc => {
    const matchesSearch = searchTerm === "" || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = typeFilter === "all" || doc.documentType === typeFilter

    return matchesSearch && matchesType
  })

  // Group types for filter
  const documentTypes = [...new Set(property.documents.map(d => d.documentType))].sort()

  if (property.documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Documents Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Upload documents to get started
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Upload Document</DialogTitle>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Document_Vault
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Total Files: {property.documents.length}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <Plus className="h-3 w-3 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Upload Document</DialogTitle>
            </DialogHeader>
            <UploadDocumentForm 
              propertyId={property.id}
              onSuccess={handleDocumentUploaded}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Type: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Types</SelectItem>
              {documentTypes.map(type => (
                <SelectItem key={type} value={type} className="font-mono text-xs uppercase">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || typeFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
              }}
              className="rounded-none border-border h-10 px-3 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {(searchTerm || typeFilter !== "all") && (
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
          Found {filteredDocuments.length} matching documents
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredDocuments.map((document) => {
          const styles = getDocumentTypeStyle(document.documentType)
          return (
            <Card key={document.id} className="group rounded-none border border-border hover:border-primary/50 transition-all hover:shadow-none bg-background overflow-hidden h-full flex flex-col relative">
              {/* Status Line */}
              <div className={`h-1 w-full ${styles.bg}`} />
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-muted/10 border border-border/50">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border ${styles.border} ${styles.text} bg-transparent`}>
                    {document.documentType}
                  </Badge>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2" title={document.name}>
                    {document.name}
                  </h4>
                  {document.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {document.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto space-y-3 pt-3 border-t border-dashed border-border/50">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                    <User className="h-3 w-3" />
                    {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" asChild className="rounded-none h-7 text-[10px] font-mono uppercase tracking-wider">
                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      View
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="rounded-none h-7 text-[10px] font-mono uppercase tracking-wider">
                    <a href={document.fileUrl} download>
                      <Download className="h-3 w-3 mr-1.5" />
                      Save
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching documents found</p>
        </div>
      )}
    </div>
  )
}