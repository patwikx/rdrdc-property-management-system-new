"use client"

import { DocumentType } from "@prisma/client"
import { FileText, TrendingUp, Calendar, Users } from "lucide-react"

interface DocumentStats {
  totalDocuments: number
  documentsByType: Record<DocumentType, number>
  recentUploads: number
  documentsThisMonth: number
}

interface DocumentsStatsProps {
  stats: DocumentStats
}

export function DocumentsStats({ stats }: DocumentsStatsProps) {
  const mostCommonType = Object.entries(stats.documentsByType)
    .sort(([,a], [,b]) => b - a)[0]
  
  const mostCommonTypeLabel = mostCommonType ? mostCommonType[0] : 'NONE'
  const mostCommonTypeCount = mostCommonType ? mostCommonType[1] : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-border bg-background">
      {/* Total Documents */}
      <div className="p-4 border-r border-border border-b md:border-b-0 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Files</span>
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <span className="text-2xl font-mono font-medium tracking-tighter text-foreground">{stats.totalDocuments}</span>
      </div>

      {/* This Month */}
      <div className="p-4 border-r md:border-r border-b md:border-b-0 border-border hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">New (Month)</span>
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">{stats.documentsThisMonth}</span>
      </div>

      {/* Recent Uploads */}
      <div className="p-4 border-r border-border border-b md:border-b-0 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Last 7 Days</span>
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{stats.recentUploads}</span>
      </div>

      {/* Most Common Type */}
      <div className="p-4 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Top Category</span>
          <Users className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-medium tracking-tighter text-orange-600">{mostCommonTypeCount}</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">{mostCommonTypeLabel}</span>
        </div>
      </div>
    </div>
  )
}