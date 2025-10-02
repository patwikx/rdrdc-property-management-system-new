// components/dashboard/tax-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface TaxOverviewProps {
  stats: DashboardStats
}

export function TaxOverview({ stats }: TaxOverviewProps) {
  const propertyTotal = stats.taxes.propertyTaxesDue + stats.taxes.propertyTaxesOverdue
  const unitTotal = stats.taxes.unitTaxesDue + stats.taxes.unitTaxesOverdue

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Tax Overview</CardTitle>
        <CardDescription>Property and unit tax status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Property Taxes</h4>
              <Badge variant="outline">{propertyTotal} Total</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Due</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  {stats.taxes.propertyTaxesDue}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Overdue</span>
                <Badge variant="destructive">
                  {stats.taxes.propertyTaxesOverdue}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Unit Taxes</h4>
              <Badge variant="outline">{unitTotal} Total</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Due</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  {stats.taxes.unitTaxesDue}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Overdue</span>
                <Badge variant="destructive">
                  {stats.taxes.unitTaxesOverdue}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link href="/taxes">
            <Button className="w-full" variant="outline" size="lg">
              View Tax Reports
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
