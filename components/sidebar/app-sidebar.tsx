// app-sidebar.tsx
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
  Receipt,
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
      title: "Properties",
      url: "/properties",
      icon: Building2,
      items: [
        {
          title: "All Properties",
          url: "/properties",
        },
                {
          title: "Spaces",
          url: "/properties/units",
        },
        {
          title: "Title Movement",
          url: "/properties/title-movement",
        },
      ],
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: Users,
      items: [
        {
          title: "All Tenants",
          url: "/tenants",
        },
        {
          title: "Leases",
          url: "/tenants/leases",
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
      ],
    },
    {
      title: "Taxes",
      url: "/taxes",
      icon: Receipt,
      items: [
        {
          title: "Property Taxes",
          url: "/taxes/property",
        },
        {
          title: "Unit Taxes",
          url: "/taxes/unit",
        },
      ],
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
      items: [
        {
          title: "Requests",
          url: "/maintenance/requests",
        },
        {
          title: "Schedule",
          url: "/maintenance/schedule",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderKanban,
      items: [
        {
          title: "All Projects",
          url: "/projects",
        },
        {
          title: "Tasks",
          url: "/projects/tasks",
        },
        {
          title: "Boards",
          url: "/projects/boards",
        },
      ],
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
            title: "Financial Reports",
            url: "/reports/financial",
          },
          {
            title: "Occupancy Reports",
            url: "/reports/occupancy",
          },
          {
            title: "Tax Reports",
            url: "/reports/taxes",
          },
          {
            title: "Maintenance Reports",
            url: "/reports/maintenance",
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Image 
            src='/rdrdc-logo.png' 
            height={40} 
            width={40} 
            alt="rdrdc-logo"
            className="shrink-0 object-contain group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold">RDRDC</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Property Management System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}