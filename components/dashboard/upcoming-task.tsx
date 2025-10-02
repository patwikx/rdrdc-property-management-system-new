// components/dashboard/upcoming-tasks.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { UpcomingTask } from "@/lib/actions/dashboard-actions"

interface UpcomingTasksProps {
  tasks: UpcomingTask[]
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'URGENT': return 'destructive' as const
    case 'HIGH': return 'default' as const
    case 'MEDIUM': return 'secondary' as const
    case 'LOW': return 'outline' as const
    default: return 'outline' as const
  }
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </div>
          <Link href="/projects/tasks">
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming tasks
            </p>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium leading-none">{task.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {task.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
