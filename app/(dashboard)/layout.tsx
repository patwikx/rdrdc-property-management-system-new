import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import "../globals.css"
import { Toaster } from "sonner"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type { Session } from "next-auth"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DynamicBreadcrumb } from "@/components/breadcrumb/dynamic-breadcrumb"
import { GlobalSearch } from "@/components/search/global-search"
import { DateTimeDisplay } from "@/components/date-time-display"
import { NotificationsMenu } from "@/components/notifications/notification-menu"
import { Suspense } from "react"

export const metadata = {
  title: "Dashboard | Property Management System",
  description: "Asset Management System Dashboard",
}

// Type guard to ensure we have a complete user session
function isValidUserSession(session: Session | null): session is Session & {
  user: NonNullable<Session["user"]> & {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
} {
  return !!(
    session?.user?.id &&
    session.user.firstName &&
    session.user.lastName &&
    session.user.email &&
    session.user.role
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect to sign-in if there's no session or user
  if (!session?.user) {
    redirect("/")
  }

  // Ensure we have a complete user session
  if (!isValidUserSession(session)) {
    redirect("/?error=IncompleteProfile")
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* App Sidebar */}
        <AppSidebar session={session} />

        {/* Main Content Area */}
        <SidebarInset className="flex-1">
          {/* Header with breadcrumb */}
          <Suspense fallback={<div>Loading...</div>}>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DynamicBreadcrumb />
              <div className="flex-1 flex justify-center">
                <GlobalSearch />
              </div>
              <NotificationsMenu />
              <DateTimeDisplay />
            </header>
          </Suspense>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </SidebarInset>

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </SidebarProvider>
  )
}
