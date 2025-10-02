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
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Welcome back, {userName} • {formattedDate}
        </p>
      </div>
    </div>
  )
}