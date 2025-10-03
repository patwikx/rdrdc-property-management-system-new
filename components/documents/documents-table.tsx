"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ExternalLink
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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
        label: `${document.tenant.bpCode} - ${document.tenant.firstName} ${document.tenant.lastName}`,
        icon: User
      }
    }
    if (document.unit) {
      return {
        type: 'unit',
        label: `${document.unit.unitNumber} - ${document.unit.property.propertyName}`,
        icon: Home
      }
    }
    if (document.property) {
      return {
        type: 'property',
        label: `${document.property.propertyCode} - ${document.property.propertyName}`,
        icon: Building
      }
    }
    return null
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
              Manage and organize all property-related documents
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalCount} total documents
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={handleFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">All Types</SelectItem>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Associated With</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-muted rounded animate-pulse w-16" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-20" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No documents found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((document) => {
                  const entityInfo = getEntityInfo(document)
                  const EntityIcon = entityInfo?.icon
                  
                  return (
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
                        {entityInfo ? (
                          <div className="flex items-center space-x-2">
                            {EntityIcon && <EntityIcon className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm">{entityInfo.label}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not associated</span>
                        )}
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
                            onClick={() => window.open(document.fileUrl, '_blank')}
                            title="View"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView(document)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(document)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(document)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} documents
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}