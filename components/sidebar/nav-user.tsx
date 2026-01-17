// nav-user.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
  Moon,
  Sun,
  Laptop
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
    role: string
  }
}

function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/sign-in',
        redirect: true 
      })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Sign out failed')
    }
  }, [])

  const userInitials = React.useMemo(() => getUserInitials(user.name), [user.name])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-none border border-transparent hover:border-border transition-colors"
            >
              <Avatar className="h-8 w-8 rounded-none border border-border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-none bg-primary/10 text-primary font-mono font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold uppercase tracking-tight text-xs">{user.name}</span>
                <span className="truncate text-[10px] font-mono text-muted-foreground uppercase">
                  {user.role}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none border-border"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm border-b border-border bg-muted/5">
                <Avatar className="h-8 w-8 rounded-none border border-border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-none bg-primary/10 text-primary font-mono font-bold text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold uppercase tracking-tight text-xs">{user.name}</span>
                  <span className="truncate text-[10px] font-mono text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
              Account
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="rounded-none cursor-pointer">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span className="text-xs uppercase font-medium">Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-none cursor-pointer">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="text-xs uppercase font-medium">Configuration</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-none cursor-pointer">
                <Link href="/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  <span className="text-xs uppercase font-medium">Notifications</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                Interface
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-none cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                <span className="text-xs uppercase font-medium">Light Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-none cursor-pointer">
                <Moon className="mr-2 h-4 w-4" />
                <span className="text-xs uppercase font-medium">Dark Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-none cursor-pointer">
                <Laptop className="mr-2 h-4 w-4" />
                <span className="text-xs uppercase font-medium">System Default</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut} className="rounded-none cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="text-xs uppercase font-bold">Terminate Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}