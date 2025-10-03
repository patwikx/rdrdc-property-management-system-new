"use client"

import { Calendar, Users, Settings, Clock, Target } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ProjectWithDetails } from "@/lib/actions/project-actions"

interface ProjectHeaderProps {
  project: ProjectWithDetails
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const completedTasks = project.boards.reduce((total, board) => 
    total + board.columns.reduce((boardTotal, column) => 
      boardTotal + (column.name.toLowerCase().includes('done') || column.name.toLowerCase().includes('complete') 
        ? column.tasks.length 
        : 0), 0), 0)

  const progressPercentage = project._count.tasks > 0 
    ? Math.round((completedTasks / project._count.tasks) * 100) 
    : 0

  return (
    <div className="border-b border-border/50 pb-6 mb-6">
      {/* Main Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {project.name}
            </h1>
            <div className={cn(
              "px-2 py-1 rounded-md text-xs font-medium",
              getStatusColor(project.status)
            )}>
              {project.status.replace('_', ' ')}
            </div>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        
        <Button variant="outline" size="sm" asChild className="ml-4 flex-shrink-0">
          <Link href={`/projects/${project.id}/settings`}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Progress</p>
            <p className="text-sm font-medium">{progressPercentage}% Complete</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="p-2 rounded-md bg-green-100 dark:bg-green-950">
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Tasks</p>
            <p className="text-sm font-medium">{completedTasks}/{project._count.tasks}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-950">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Team</p>
            <p className="text-sm font-medium">{project.members.length + 1} members</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-950">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Timeline</p>
            <p className="text-sm font-medium">
              {project.endDate 
                ? `${Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                : 'No deadline'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Started {format(new Date(project.startDate), 'MMM dd, yyyy')}
            {project.endDate && (
              <> • Due {format(new Date(project.endDate), 'MMM dd, yyyy')}</>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Owner:</span>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(project.owner.firstName, project.owner.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground font-medium">
              {project.owner.firstName} {project.owner.lastName}
            </span>
          </div>
        </div>
        
        {project.members.length > 0 && (
          <div className="flex items-center gap-2">
            <span>Team:</span>
            <div className="flex -space-x-1">
              {project.members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.user.firstName, member.user.lastName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{project.members.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}