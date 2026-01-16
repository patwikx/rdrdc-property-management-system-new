"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

interface NavMainProps {
  items: NavMainItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  const isItemActive = React.useCallback((item: NavMainItem): boolean => {
    if (pathname === item.url) return true
    return item.items?.some(subItem => pathname === subItem.url) ?? false
  }, [pathname])

  const isSubItemActive = React.useCallback((url: string): boolean => {
    return pathname === url
  }, [pathname])

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest px-2 mb-2">
        Main Menu
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const itemIsActive = isItemActive(item)
          const hasSubItems = item.items && item.items.length > 0

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={itemIsActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {hasSubItems ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        tooltip={item.title}
                        className={cn(
                          "rounded-none h-9 font-mono text-xs tracking-wide transition-all hover:bg-muted",
                          itemIsActive && "bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-70" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l border-border/50 ml-4 pl-2 my-1 space-y-0.5">
                        {item.items?.map((subItem) => {
                          const subItemIsActive = isSubItemActive(subItem.url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                className={cn(
                                  "rounded-none h-8 font-mono text-[11px] hover:bg-muted",
                                  subItemIsActive && "bg-muted font-bold text-primary"
                                )}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className={cn(
                      "rounded-none h-9 font-mono text-xs tracking-wide transition-all hover:bg-muted",
                      itemIsActive && "bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    )}
                    asChild
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}