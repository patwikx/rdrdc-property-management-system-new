import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UpcomingTask } from "@/lib/types/dashboard-types"

interface UpcomingTasksProps {
  tasks: UpcomingTask[]
}

function getPriorityConfig(priority: string) {
  switch (priority) {
    case 'URGENT': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
    case 'HIGH': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    case 'MEDIUM': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' }
  }
}

function FormatDate({ date }: { date: Date }) {
  const d = new Date(date)
  if (isToday(d)) return <span className="text-rose-600 font-bold">Today</span>
  if (isTomorrow(d)) return <span className="text-orange-600 font-semibold">Tomorrow</span>
  return <span className="text-muted-foreground">{format(d, 'MMM d')}</span>
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md flex flex-col h-[350px]">
      <CardHeader className="pb-3 px-5 pt-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">My Tasks</CardTitle>
            <CardDescription className="text-xs">Priority items for attention</CardDescription>
          </div>
          <Link href="/projects/tasks">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-5 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-dashed border-emerald-100 dark:border-emerald-800">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                All caught up! No pending tasks.
              </p>
            </div>
          ) : (
            tasks.map((task) => {
              const priority = getPriorityConfig(task.priority)
              return (
                <div 
                  key={task.id} 
                  className="group flex items-start gap-3 p-3 rounded-xl border border-muted/40 bg-card hover:bg-muted/30 transition-all hover:shadow-sm"
                >
                  <div className={cn(
                    "mt-0.5 h-2 w-2 rounded-full shrink-0 ring-4 ring-opacity-20",
                    priority.bg.replace('bg-', 'ring-'),
                    priority.color.replace('text-', 'bg-')
                  )} />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-semibold leading-snug text-foreground truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium bg-muted/50 px-1.5 py-0.5 rounded-md">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                        <FormatDate date={task.dueDate} />
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm uppercase tracking-wider font-bold text-muted-foreground border-muted">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}