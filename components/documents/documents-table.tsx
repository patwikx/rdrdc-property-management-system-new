"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentListItem } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  Home,
  User,
  Calendar,
  ExternalLink,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const documentTypeLabels: Record<DocumentType, string> = {
  LEASE: "Lease",
  CONTRACT: "Contract", 
  INVOICE: "Invoice",
  MAINTENANCE: "Maint.",
  OTHER: "Other"
}

const documentTypeStyles: Record<DocumentType, string> = {
  LEASE: "border-blue-500 text-blue-600 bg-blue-500/10",
  CONTRACT: "border-emerald-500 text-emerald-600 bg-emerald-500/10",
  INVOICE: "border-amber-500 text-amber-600 bg-amber-500/10", 
  MAINTENANCE: "border-orange-500 text-orange-600 bg-orange-500/10",
  OTHER: "border-muted text-muted-foreground bg-muted/10"
}

interface DocumentsTableProps {
  documents: DocumentListItem[]
  totalCount: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onFilterType: (type: DocumentType | "") => void
  onView?: (document: DocumentListItem) => void
  onEdit?: (document: DocumentListItem) => void
  onDelete?: (document: DocumentListItem) => void
  isLoading?: boolean
}

export function DocumentsTable({
  documents,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  onFilterType,
  onView,
  onEdit,
  onDelete,
  isLoading = false
}: DocumentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<DocumentType | "">("")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  const handleFilterType = (type: DocumentType | "") => {
    setSelectedType(type)
    onFilterType(type)
  }

  const handleDownload = (document: DocumentListItem) => {
    window.open(document.fileUrl, '_blank')
  }

  const getEntityInfo = (document: DocumentListItem) => {
    if (document.tenant) {
      return {
        type: 'tenant',
        label: `${document.tenant.firstName} ${document.tenant.lastName}`,
        code: document.tenant.bpCode,
        icon: User,
        color: "text-purple-600"
      }
    }
    if (document.unit) {
      return {
        type: 'unit',
        label: `${document.unit.property.propertyName}`,
        code: document.unit.unitNumber,
        icon: Home,
        color: "text-blue-600"
      }
    }
    if (document.property) {
      return {
        type: 'property',
        label: document.property.propertyName,
        code: document.property.propertyCode,
        icon: Building,
        color: "text-emerald-600"
      }
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-1 bg-muted/10 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
          <Input
            placeholder="SEARCH DOCUMENTS..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-8 rounded-none border-border font-mono text-xs uppercase bg-background focus-visible:ring-0 focus-visible:border-primary"
          />
        </div>
        <div className="w-px h-6 bg-border mx-1" />
        <Select value={selectedType} onValueChange={handleFilterType}>
          <SelectTrigger className="w-40 h-8 rounded-none border-border font-mono text-xs uppercase bg-background focus:ring-0">
            <Filter className="h-3 w-3 mr-2 text-muted-foreground" />
            <SelectValue placeholder="TYPE: ALL" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all-types" className="text-xs font-mono uppercase">All Types</SelectItem>
            {Object.entries(documentTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs font-mono uppercase">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-border">
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[40%]">Document Details</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[15%]">Category</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[20%]">Reference</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-[15%]">Meta</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right w-[10%]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-b border-border">
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-none w-24 animate-pulse" />
                      <div className="h-2 bg-muted rounded-none w-48 animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell><div className="h-5 w-16 bg-muted rounded-none animate-pulse" /></TableCell>
                  <TableCell><div className="h-3 w-32 bg-muted rounded-none animate-pulse" /></TableCell>
                  <TableCell><div className="h-3 w-24 bg-muted rounded-none animate-pulse" /></TableCell>
                  <TableCell className="text-right"><div className="h-6 w-6 ml-auto bg-muted rounded-none animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-muted/10 border border-border">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-mono uppercase text-muted-foreground">No documents found matching criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => {
                const entityInfo = getEntityInfo(document)
                const EntityIcon = entityInfo?.icon
                
                return (
                  <TableRow key={document.id} className="group border-b border-border hover:bg-muted/5 transition-colors">
                    <TableCell className="align-top py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground line-clamp-1">{document.name}</span>
                        </div>
                        {document.description && (
                          <div className="text-[10px] text-muted-foreground font-mono uppercase pl-5.5 line-clamp-1">
                            {document.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3">
                      <Badge variant="outline" className={cn(
                        "rounded-none text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 border",
                        documentTypeStyles[document.documentType]
                      )}>
                        {documentTypeLabels[document.documentType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top py-3">
                      {entityInfo ? (
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1 bg-muted/10 border border-border", entityInfo.color)}>
                            {EntityIcon && <EntityIcon className="h-3 w-3" />}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold uppercase tracking-tight">{entityInfo.code}</span>
                             <span className="text-[9px] font-mono text-muted-foreground uppercase line-clamp-1 max-w-[120px]">{entityInfo.label}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">-</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono uppercase">
                          <User className="h-3 w-3" />
                          <span>{document.uploadedBy.firstName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono uppercase">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(document.createdAt), 'MM/dd/yy')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-border">
                          <DropdownMenuItem onClick={() => handleDownload(document)} className="rounded-none font-mono text-xs uppercase">
                            <Download className="h-3 w-3 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(document.fileUrl, '_blank')} className="rounded-none font-mono text-xs uppercase">
                            <ExternalLink className="h-3 w-3 mr-2" /> View File
                          </DropdownMenuItem>
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(document)} className="rounded-none font-mono text-xs uppercase">
                              <Eye className="h-3 w-3 mr-2" /> Details
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(document)} className="rounded-none font-mono text-xs uppercase">
                              <Edit className="h-3 w-3 mr-2" /> Edit Info
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem onClick={() => onDelete(document)} className="text-destructive rounded-none font-mono text-xs uppercase">
                              <Trash2 className="h-3 w-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-[10px] font-mono text-muted-foreground uppercase">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} entries
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-7 w-7 p-0 rounded-none border-border"
            >
              &lt;
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "h-7 w-7 p-0 rounded-none font-mono text-xs",
                    currentPage === page ? "bg-primary text-primary-foreground" : "border-border"
                  )}
                >
                  {page}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 p-0 rounded-none border-border"
            >
              &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}