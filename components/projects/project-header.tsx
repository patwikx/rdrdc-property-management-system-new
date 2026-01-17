"use client"

import { Calendar, Users, Settings, Clock, Target, ArrowLeft, Activity, CheckCircle2, Flame } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ProjectWithDetails } from "@/lib/actions/project-actions"

interface ProjectHeaderProps {
  project: ProjectWithDetails
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
      case 'COMPLETED': return 'border-blue-500 text-blue-600 bg-blue-500/10'
      case 'ON_HOLD': return 'border-amber-500 text-amber-600 bg-amber-500/10'
      case 'ARCHIVED': return 'border-muted text-muted-foreground bg-muted/10'
      default: return 'border-muted text-muted-foreground bg-muted/10'
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
    <div className="space-y-6">
      {/* Top Row: Nav & Actions */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold uppercase tracking-tight truncate">
              {project.name}
            </h1>
            <Badge variant="outline" className={cn(
              "rounded-none text-[10px] uppercase tracking-widest font-mono h-5",
              getStatusStyle(project.status)
            )}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs font-mono text-muted-foreground max-w-2xl pl-6">
              {project.description}
            </p>
          )}
        </div>
        
        <Button variant="outline" size="sm" asChild className="rounded-none h-8 text-xs font-mono uppercase border-border hover:bg-muted/10">
          <Link href={`/projects/${project.id}/settings`}>
            <Settings className="h-3 w-3 mr-2" />
            Config
          </Link>
        </Button>
      </div>

      {/* Stats Grid - RWO Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        {/* Progress */}
        <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Completion</span>
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-3xl font-mono font-medium tracking-tighter text-foreground">{progressPercentage}%</span>
            <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Overall</span>
          </div>
        </div>

        {/* Workload */}
        <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Workload</span>
            <Activity className="h-4 w-4 text-blue-600/50" />
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-3xl font-mono font-medium tracking-tighter text-blue-600">{project._count.tasks - completedTasks}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wide">Active</span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <span className="text-xl font-mono font-medium tracking-tighter text-muted-foreground">{project._count.tasks}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wide">Total</span>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Team Size</span>
            <Users className="h-4 w-4 text-purple-600/50" />
          </div>
          <div>
            <span className="text-3xl font-mono font-medium tracking-tighter text-purple-600">{project.members.length + 1}</span>
            <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Members</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Timeline</span>
            <Clock className="h-4 w-4 text-orange-600/50" />
          </div>
          <div>
            {project.endDate ? (
              <>
                <span className="text-3xl font-mono font-medium tracking-tighter text-orange-600">
                  {Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </span>
                <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Days Left</span>
              </>
            ) : (
              <span className="text-xl font-mono font-medium tracking-tighter text-muted-foreground">OPEN ENDED</span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center gap-6 pt-2 text-[10px] font-mono uppercase text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          <span>
            START: {format(new Date(project.startDate), 'MM/dd/yy')}
            {project.endDate && ` • DUE: ${format(new Date(project.endDate), 'MM/dd/yy')}`}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-bold">OWNER:</span>
          <div className="flex items-center gap-1.5">
            <Avatar className="h-4 w-4 rounded-none border border-border">
              <AvatarFallback className="text-[8px] rounded-none bg-primary/10 text-primary">
                {getInitials(project.owner.firstName, project.owner.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground">
              {project.owner.firstName} {project.owner.lastName}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}