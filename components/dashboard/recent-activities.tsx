import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, CheckCircle2, AlertCircle, Info, FileText, User } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { RecentActivity } from "@/lib/types/dashboard-types"

interface RecentActivitiesProps {
  activities: RecentActivity[]
}

const getActivityIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'CREATE': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
    case 'UPDATE': return <FileText className="h-3.5 w-3.5 text-blue-600" />
    case 'DELETE': return <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
    default: return <Info className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md flex flex-col h-[450px]">
      <CardHeader className="pb-3 px-5 pt-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">Audit Log</CardTitle>
            <CardDescription className="text-xs">Latest system changes</CardDescription>
          </div>
          <Link href="/system/audit-logs">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-5 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-0 relative">
          {/* Vertical Timeline Line */}
          {activities.length > 0 && (
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />
          )}

          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-muted/20 rounded-xl border border-dashed border-muted">
              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                <Info className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                No recent activity recorded
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className="group relative flex items-start gap-4 pb-6 last:pb-0 pl-1"
              >
                {/* Timeline Node */}
                <div className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-all group-hover:scale-110 group-hover:border-primary/50",
                  "border-muted"
                )}>
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground/90 leading-none">
                      {activity.description}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-muted/40 w-fit">
                      <User className="h-3 w-3 text-muted-foreground/70" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {activity.user}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm uppercase tracking-wider font-bold text-muted-foreground border-muted">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}