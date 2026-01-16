// components/dashboard/dashboard-header.tsx
import { format } from "date-fns"
import { auth } from "@/auth"

export async function DashboardHeader() {
  const session = await auth()
  const currentDate = new Date()
  const formattedDate = format(currentDate, 'EEEE, MMMM d, yyyy')
  
  const userName = session?.user?.firstName 
    ? `${session.user.firstName}` 
    : session?.user?.email?.split('@')[0] || 'User'

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Welcome back, <span className="font-medium text-foreground">{userName}</span></span>
          <span className="mx-2 hidden sm:inline">•</span>
          <span className="hidden sm:inline">{formattedDate}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 sm:mt-0">
        {/* You could add global actions here like "Generate Report" or "Add Property" if needed */}
      </div>
    </div>
  )
}