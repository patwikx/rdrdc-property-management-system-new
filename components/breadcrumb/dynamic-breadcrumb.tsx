"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Wrench, 
  DollarSign, 
  Settings,
  FolderKanban,
  FileBarChart,
  Receipt,
  Home,
  Plus,
  Eye,
  Edit,
  CreditCard,
  FileCheck,
  Calendar,
  UserCheck,
  FileX,
  TrendingUp,
  PieChart,
  Shield,
  Bell,
  UserCog,
  type LucideIcon
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbSegment {
  title: string
  href?: string
  icon?: LucideIcon
}

// Route configuration with icons and titles
const routeConfig: Record<string, { title: string; icon?: LucideIcon }> = {
  // Main sections
  dashboard: { title: "Dashboard", icon: LayoutDashboard },
  properties: { title: "Properties", icon: Building2 },
  tenants: { title: "Tenants", icon: Users },
  financial: { title: "Financial", icon: DollarSign },
  taxes: { title: "Taxes", icon: Receipt },
  maintenance: { title: "Maintenance", icon: Wrench },
  projects: { title: "Projects", icon: FolderKanban },
  documents: { title: "Documents", icon: FileText },
  reports: { title: "Reports", icon: FileBarChart },
  system: { title: "System", icon: Settings },

  // Properties subsections
  titles: { title: "Property Titles", icon: FileCheck },
  "title-movement": { title: "Title Movement", icon: TrendingUp },
  spaces: { title: "Spaces", icon: Building2 },

  // Tenants subsections
  leases: { title: "Leases", icon: FileCheck },
  notices: { title: "Notices", icon: FileX },

  // Financial subsections
  payments: { title: "Payments", icon: CreditCard },
  pdc: { title: "PDC Management", icon: FileCheck },
  "utility-bills": { title: "Utility Bills", icon: Receipt },

  // Taxes subsections
  property: { title: "Property Taxes", icon: Building2 },
  unit: { title: "Unit Taxes", icon: Home },

  // Maintenance subsections
  requests: { title: "Requests", icon: Wrench },
  schedule: { title: "Schedule", icon: Calendar },

  // Projects subsections
  tasks: { title: "Tasks", icon: UserCheck },
  boards: { title: "Boards", icon: FolderKanban },

  // Reports subsections
  occupancy: { title: "Occupancy Reports", icon: PieChart },
  
  // System subsections
  users: { title: "Users", icon: UserCog },
  "audit-logs": { title: "Audit Logs", icon: Shield },
  notifications: { title: "Notifications", icon: Bell },
  settings: { title: "Settings", icon: Settings },

  // Common actions
  create: { title: "Create", icon: Plus },
  edit: { title: "Edit", icon: Edit },
  view: { title: "View", icon: Eye },
}

// Special handling for dynamic routes
const getDynamicTitle = (segment: string, pathname: string): string => {
  // Handle ID segments (UUIDs or similar)
  if (segment.match(/^[a-zA-Z0-9-_]{8,}$/)) {
    const pathParts = pathname.split('/')
    const segmentIndex = pathParts.indexOf(segment)
    
    if (segmentIndex > 0) {
      const parentSegment = pathParts[segmentIndex - 1]
      
      switch (parentSegment) {
        case 'properties':
          return 'Property Details'
        case 'tenants':
          return 'Tenant Details'
        case 'projects':
          return 'Project Details'
        case 'tasks':
          return 'Task Details'
        case 'users':
          return 'User Details'
        default:
          return 'Details'
      }
    }
  }
  
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbSegments: BreadcrumbSegment[] = []
    
    // Always start with Dashboard as home
    breadcrumbSegments.push({
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard
    })
    
    // If we're already on dashboard, return just that
    if (segments.length === 1 && segments[0] === 'dashboard') {
      return breadcrumbSegments
    }
    
    // Build breadcrumbs for each segment
    let currentPath = ''
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip the dashboard segment since we already added it
      if (segment === 'dashboard') return
      
      const config = routeConfig[segment]
      const isLast = index === segments.length - 1
      
      let title: string
      let icon: LucideIcon | undefined
      
      if (config) {
        title = config.title
        icon = config.icon
      } else {
        title = getDynamicTitle(segment, pathname)
        // Try to infer icon based on context
        if (segment.match(/^[a-zA-Z0-9-_]{8,}$/)) {
          icon = Eye // Default icon for detail pages
        }
      }
      
      breadcrumbSegments.push({
        title,
        href: isLast ? undefined : currentPath,
        icon
      })
    })
    
    return breadcrumbSegments
  }, [pathname])
  
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          const Icon = breadcrumb.icon
          
          return (
            <React.Fragment key={`${breadcrumb.href || breadcrumb.title}-${index}`}>
              <BreadcrumbItem>
                {breadcrumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href} className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      {breadcrumb.title}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {breadcrumb.title}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}