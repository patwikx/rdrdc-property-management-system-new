import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Plus, Download, ExternalLink, Search } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { UploadDocumentForm } from "@/components/properties/upload-document-form"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"

interface UnitDocumentsProps {
  unit: UnitWithDetails
}

function getDocumentStyle(type: string) {
  switch (type) {
    case 'LEASE': return { border: 'border-l-blue-500', text: 'text-blue-600', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    case 'CONTRACT': return { border: 'border-l-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'INVOICE': return { border: 'border-l-amber-500', text: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    case 'MAINTENANCE': return { border: 'border-l-rose-500', text: 'text-rose-600', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
    default: return { border: 'border-l-slate-500', text: 'text-slate-600', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }
  }
}

export function UnitDocuments({ unit }: UnitDocumentsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const handleDocumentUploaded = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  const filteredDocuments = unit.documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (unit.documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Documents Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Upload lease agreements, contracts, or other files
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-border max-w-[650px]">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Upload Unit Document</DialogTitle>
            </DialogHeader>
            <UploadDocumentForm
              unitId={unit.id}
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
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Space Documents
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Total Files: {unit.documents.length}
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="SEARCH FILES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none h-9 text-xs font-mono border-border bg-background focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
                <Plus className="h-3 w-3 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-border max-w-[650px]">
              <DialogHeader>
                <DialogTitle className="font-mono uppercase tracking-wide">Upload Unit Document</DialogTitle>
              </DialogHeader>
              <UploadDocumentForm
                unitId={unit.id}
                onSuccess={handleDocumentUploaded}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* DOCUMENT GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => {
          const styles = getDocumentStyle(document.documentType)
          
          return (
            <div key={document.id} className={`group border border-border border-l-4 ${styles.border} bg-background hover:bg-muted/5 transition-all flex flex-col`}>
              <div className="p-4 border-b border-dashed border-border/50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-none border border-border bg-background ${styles.text}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">Filename</span>
                    <h4 className="font-bold text-sm truncate max-w-[150px]" title={document.name}>{document.name}</h4>
                  </div>
                </div>
                <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 ${styles.badge} px-1.5 py-0`}>
                  {document.documentType}
                </Badge>
              </div>

              <div className="p-4 flex-1">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span className="font-mono">{format(new Date(document.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  {document.description && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground italic line-clamp-2">&quot;{document.description}&quot;</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2 border-t border-border/50 flex gap-2">
                <Button variant="ghost" size="sm" asChild className="flex-1 h-8 rounded-none text-[10px] font-mono uppercase tracking-wider hover:bg-muted">
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" /> View
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild className="flex-1 h-8 rounded-none text-[10px] font-mono uppercase tracking-wider hover:bg-muted">
                  <a href={document.fileUrl} download>
                    <Download className="h-3 w-3 mr-2" /> Save
                  </a>
                </Button>
              </div>
            </div>
          )
        })}
        
        {filteredDocuments.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-border">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching documents found</p>
          </div>
        )}
      </div>
    </div>
  )
}