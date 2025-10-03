"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Building, 
  Users, 
  DollarSign,
  Calendar,
  Wrench,
  Receipt,
  TrendingUp,
  BarChart3,
  PieChart
} from "lucide-react"
import Link from "next/link"

const reportCategories = [
  {
    title: "Leasing Reports",
    description: "Comprehensive lease management and analysis",
    icon: FileText,
    href: "/reports/leasing",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-600/10",
    reports: [
      "Lease Management Report",
      "Lease Expiration Report", 
      "Multi-Unit Lease Analysis",
      "Lease Renewal Tracking"
    ]
  },
  {
    title: "Financial Reports",
    description: "Revenue, payments, and financial analytics",
    icon: DollarSign,
    href: "/reports/financial",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-600/10",
    reports: [
      "Revenue Analysis",
      "AR Aging Report",
      "Payment Analysis",
      "PDC Management"
    ]
  },
  {
    title: "Property Reports",
    description: "Property portfolio and occupancy analysis",
    icon: Building,
    href: "/reports/property",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-600/10",
    reports: [
      "Property Portfolio",
      "Unit Occupancy",
      "Property Performance",
      "Title Management"
    ]
  },
  {
    title: "Tenant Reports",
    description: "Tenant demographics and relationship management",
    icon: Users,
    href: "/reports/tenant",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-600/10",
    reports: [
      "Tenant Demographics",
      "Tenant Notices",
      "Tenant Retention",
      "Business Analysis"
    ]
  },
  {
    title: "Maintenance Reports",
    description: "Maintenance requests and operational metrics",
    icon: Wrench,
    href: "/reports/maintenance",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-600/10",
    reports: [
      "Maintenance Requests",
      "Response Time Analysis",
      "Cost Analysis",
      "Recurring Issues"
    ]
  },
  {
    title: "Tax & Compliance",
    description: "Tax obligations and compliance tracking",
    icon: Receipt,
    href: "/reports/tax",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-600/10",
    reports: [
      "Property Tax Report",
      "Unit Tax Report",
      "Tax Compliance",
      "Payment History"
    ]
  },
  {
    title: "Analytics Dashboard",
    description: "Advanced analytics and performance metrics",
    icon: TrendingUp,
    href: "/reports/analytics",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-600/10",
    reports: [
      "Performance KPIs",
      "Trend Analysis",
      "Forecasting",
      "Comparative Analysis"
    ]
  },
  {
    title: "Operational Reports",
    description: "System usage and operational efficiency",
    icon: BarChart3,
    href: "/reports/operational",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-600/10",
    reports: [
      "User Activity",
      "System Audit",
      "Document Management",
      "Notification Analysis"
    ]
  }
]

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive reporting suite for property management insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
            <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Report Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reportCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.href} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${category.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Report List */}
                <div className="space-y-2">
                  {category.reports.map((report, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">{report}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Link href={category.href}>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      View Reports
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">
              Across 8 categories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Formats</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CSV & PDF</div>
            <p className="text-xs text-muted-foreground">
              Professional formatting
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Data</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Always up-to-date
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customizable</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Filters</div>
            <p className="text-xs text-muted-foreground">
              Advanced filtering
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}