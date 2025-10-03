"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DocumentType } from "@prisma/client"
import { FileText, TrendingUp, Calendar, Users } from "lucide-react"

interface DocumentStats {
  totalDocuments: number
  documentsByType: Record<DocumentType, number>
  recentUploads: number
  documentsThisMonth: number
}

const documentTypeLabels: Record<DocumentType, string> = {
  LEASE: "Lease Agreements",
  CONTRACT: "Contracts", 
  INVOICE: "Invoices",
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

interface DocumentsStatsProps {
  stats: DocumentStats
}

export function DocumentsStats({ stats }: DocumentsStatsProps) {
  const mostCommonType = Object.entries(stats.documentsByType)
    .sort(([,a], [,b]) => b - a)[0]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            Across all properties and tenants
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documentsThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            Documents uploaded this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentUploads}</div>
          <p className="text-xs text-muted-foreground">
            Uploaded in the last 7 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mostCommonType?.[1] || 0}</div>
          <p className="text-xs text-muted-foreground">
            {mostCommonType ? documentTypeLabels[mostCommonType[0] as DocumentType] : 'No documents'}
          </p>
        </CardContent>
      </Card>

      {/* Document Types Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Documents by Type</CardTitle>
          <CardDescription>
            Breakdown of documents by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.documentsByType).map(([type, count]) => (
              <Badge 
                key={type} 
                variant="outline" 
                className={`${documentTypeColors[type as DocumentType]} text-white`}
              >
                {documentTypeLabels[type as DocumentType]}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}