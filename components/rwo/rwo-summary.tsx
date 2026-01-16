"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users,
  Flame
} from "lucide-react"
import type { RWOSummary as RWOSummaryType } from "@/lib/types/rwo-types"

/**
 * RWO Summary Component
 * Displays status counts and priority breakdown
 * Requirements: 2.13
 */

interface RWOSummaryProps {
  summary: RWOSummaryType
}

export function RWOSummary({ summary }: RWOSummaryProps) {
  const { statusCounts, priorityCounts, totalOpen } = summary

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Open */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open RWOs</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOpen}</div>
          <p className="text-xs text-muted-foreground">
            Pending, Assigned, or In Progress
          </p>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Status</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending: {statusCounts.PENDING}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Assigned: {statusCounts.ASSIGNED}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              In Progress: {statusCounts.IN_PROGRESS}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{statusCounts.COMPLETED}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
              <XCircle className="h-3 w-3 mr-1" />
              Cancelled: {statusCounts.CANCELLED}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Priority</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {priorityCounts.EMERGENCY > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Emergency: {priorityCounts.EMERGENCY}
              </Badge>
            )}
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              High: {priorityCounts.HIGH}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Medium: {priorityCounts.MEDIUM}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Low: {priorityCounts.LOW}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
