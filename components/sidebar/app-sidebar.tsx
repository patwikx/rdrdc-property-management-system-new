"use client"

import * as React from "react"
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
  Zap,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Session } from "next-auth"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import Image from "next/image"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session & {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      image?: string | null;
    };
  };
}

// Define navigation items based on Prisma schema
const getNavigationItems = (userRole: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Property Management",
      url: "/properties",
      icon: Building2,
      items: [
        {
          title: "• All Properties",
          url: "/properties",
        },
                {
          title: "• All Spaces",
          url: "/properties/units",
        },
      ],
    },
    {
      title: "Leasing Operations",
      url: "/tenants",
      icon: Users,
      items: [
        {
          title: "Tenants",
          url: "/tenants",
        },
        {
          title: "Leases Agreements",
          url: "/tenants/leases",
        },
        {
          title: "Rate Approvals",
          url: "/tenants/leases/approvals",
        },
      ],
    },
    {
      title: "Credit & Collection",
      url: "/financial",
      icon: DollarSign,
      items: [
        {
          title: "Notices",
          url: "/notices",
        },
        {
          title: "PDC Monitoring",
          url: "/pdc-monitoring",
        },
                {
          title: "AR Aging",
          url: "/ar-aging",
        },
      ],
    },
   
    {
      title: "Billing Monitoring",
      url: "/billing-monitoring",
      icon: Zap,
    },
    {
      title: "Repair Work Order",
      url: "/rwo",
      icon: Wrench,
    },
    {
      title: "Project Kanban",
      url: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileText,
    },
  ]

  // Add admin-only items
  const adminRoles = ['ADMIN', 'OWNER']
  if (adminRoles.includes(userRole)) {
    baseItems.push(
      {
        title: "Reports",
        url: "/reports",
        icon: FileBarChart,
        items: [
          {
            title: "Occupancy Analysis",
            url: "/reports/occupancy",
          },
          {
            title: "Lease Aging",
            url: "/reports/lease-aging",
          },
          {
            title: "Rate History",
            url: "/reports/rate-history",
          },
          {
            title: "Renewals Due",
            url: "/reports/renewals",
          },
          {
            title: "Multi-Space Tenants",
            url: "/reports/multi-space",
          },
          {
            title: "Opportunity Loss",
            url: "/reports/opportunity-loss",
          },
        ],
      },
      {
        title: "System",
        url: "/system",
        icon: Settings,
        items: [
          {
            title: "Users",
            url: "/users",
          },
          {
            title: "Audit Logs",
            url: "/system/audit-logs",
          },
          {
            title: "Notifications",
            url: "/system/notifications",
          },
          {
            title: "Settings",
            url: "/system/settings",
          },
        ],
      }
    )
  }

  return baseItems
}

export function AppSidebar({ 
  session,
  ...props 
}: AppSidebarProps) {
  const navItems = React.useMemo(() => 
    getNavigationItems(session.user.role),
    [session.user.role]
  )

  const userData = React.useMemo(() => ({
    name: `${session.user.firstName} ${session.user.lastName}`,
    email: session.user.email ?? '',
    avatar: session.user.image ?? '',
    role: session.user.role,
  }), [session.user])

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 transition-all">
        <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <div className="h-8 w-8 shrink-0 bg-primary/10 flex items-center justify-center rounded-none group-data-[collapsible=icon]:rounded-md transition-all">
            <Image 
              src='/rdrdc-logo.png' 
              height={24} 
              width={24} 
              alt="rdrdc-logo"
              className="object-contain"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0 transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden">
            <span className="font-mono font-bold tracking-tight text-sm leading-none text-foreground truncate">RDRDC</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-1 truncate">Property Management System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2 group-data-[collapsible=icon]:px-1 transition-all">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="p-2">
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}