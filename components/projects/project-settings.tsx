"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Save, Trash2, UserPlus, X, ArrowLeft, ShieldAlert } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { 
  ProjectWithDetails, 
  updateProject, 
  deleteProject, 
  addProjectMember, 
  removeProjectMember 
} from "@/lib/actions/project-actions"
import { ProjectStatus, ProjectRole } from "@prisma/client"
import { ProjectSchema, ProjectFormData } from "@/lib/validations/project-schema"
import { BoardManagement } from "./board-management"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProjectSettingsProps {
  project: ProjectWithDetails
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : undefined,
    },
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE': return 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
      case 'COMPLETED': return 'border-blue-500 text-blue-600 bg-blue-500/10'
      case 'ON_HOLD': return 'border-amber-500 text-amber-600 bg-amber-500/10'
      case 'ARCHIVED': return 'border-muted text-muted-foreground bg-muted/10'
      default: return 'border-muted text-muted-foreground bg-muted/10'
    }
  }

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      case 'ADMIN': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  async function onSubmit(data: ProjectFormData) {
    setIsLoading(true)
    
    try {
      const result = await updateProject(project.id, data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Project updated successfully")
        router.refresh()
      }
    } catch (error) {
      console.error("Project update error:", error)
      toast.error("Failed to update project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProject(project.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Project deleted successfully")
        router.push("/projects")
      }
    } catch (error) {
      console.error("Project deletion error:", error)
      toast.error("Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return

    setIsAddingMember(true)
    try {
      const result = await addProjectMember(project.id, newMemberEmail.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Member added successfully")
        setNewMemberEmail("")
        router.refresh()
      }
    } catch (error) {
      console.error("Add member error:", error)
      toast.error("Failed to add member")
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const result = await removeProjectMember(project.id, memberId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Member removed successfully")
        router.refresh()
      }
    } catch (error) {
      console.error("Remove member error:", error)
      toast.error("Failed to remove member")
    }
  }

  return (
    <div className="w-full space-y-8 max-w-[1920px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold uppercase tracking-tight">System Configuration</h1>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase">
            <span>PROJECT: {project.name}</span>
            <span className="text-border">|</span>
            <span>ID: {project.id}</span>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-none h-9 text-xs uppercase tracking-wider border-border hover:bg-muted/10">
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="h-3 w-3 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Main Content - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Core Configuration */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Project Details Form */}
          <div className="border border-border bg-background">
            <div className="p-4 border-b border-border bg-muted/5">
              <h2 className="text-sm font-bold uppercase tracking-widest">Metadata Control</h2>
            </div>
            
            <div className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Project Identifier</FormLabel>
                          <FormControl>
                            <Input placeholder="PROJECT NAME" {...field} className="rounded-none border-border font-mono text-xs h-9 uppercase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Operational Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-none border-border font-mono text-xs h-9 uppercase">
                                <SelectValue placeholder="SELECT STATUS" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none border-border">
                              <SelectItem value="ACTIVE" className="font-mono text-xs uppercase">Active</SelectItem>
                              <SelectItem value="ON_HOLD" className="font-mono text-xs uppercase">On Hold</SelectItem>
                              <SelectItem value="COMPLETED" className="font-mono text-xs uppercase">Completed</SelectItem>
                              <SelectItem value="ARCHIVED" className="font-mono text-xs uppercase">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Scope Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="ENTER DETAILS..."
                              className="resize-none rounded-none border-border font-mono text-xs uppercase min-h-[80px]"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal rounded-none border-border font-mono text-xs h-9 uppercase",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "MMM dd, yyyy")
                                    ) : (
                                      <span>PICK DATE</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  className="rounded-none"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal rounded-none border-border font-mono text-xs h-9 uppercase",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "MMM dd, yyyy")
                                    ) : (
                                      <span>PICK DATE</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < (form.getValues("startDate") || new Date())
                                  }
                                  className="rounded-none"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="rounded-none h-9 text-xs uppercase font-bold tracking-wider"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-3 w-3" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Middle Column - Team & Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Team Management */}
          <div className="border border-border bg-background flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-border bg-muted/5 flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-widest">Team Roster</h2>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/20 px-1.5 py-0.5 border border-border">
                {project.members.length + 1} MEMBERS
              </span>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Add Member */}
              <div className="flex gap-2">
                <Input
                  placeholder="USER EMAIL"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1 rounded-none border-border font-mono text-xs uppercase h-9"
                />
                <Button 
                  onClick={handleAddMember}
                  disabled={isAddingMember || !newMemberEmail.trim()}
                  className="rounded-none h-9 w-9 p-0"
                >
                  {isAddingMember ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Members List */}
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {/* Project Owner */}
                <div className="flex items-center justify-between p-3 border border-border bg-muted/5 group hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-none border border-border">
                      <AvatarFallback className="rounded-none text-[10px] bg-primary/10 text-primary font-bold">
                        {getInitials(project.owner.firstName, project.owner.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide truncate">
                        {project.owner.firstName} {project.owner.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground">OWNER</span>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-1.5 py-0.5 border text-[9px] font-mono uppercase tracking-wider",
                    getRoleColor('OWNER')
                  )}>
                    Owner
                  </div>
                </div>

                {/* Project Members */}
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-border bg-background group hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 rounded-none border border-border">
                        <AvatarFallback className="rounded-none text-[10px] bg-muted text-muted-foreground font-bold">
                          {getInitials(member.user.firstName, member.user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide truncate">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground">
                          JOINED {format(new Date(member.joinedAt), 'MM/dd/yy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-1.5 py-0.5 border text-[9px] font-mono uppercase tracking-wider",
                        getRoleColor(member.role)
                      )}>
                        {member.role}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold uppercase tracking-widest text-sm">Remove Member</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-xs">
                              Are you sure you want to remove {member.user.firstName} from this project?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-none border-border font-mono text-xs uppercase">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-destructive hover:bg-destructive/90 rounded-none font-mono text-xs uppercase"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Danger Zone & Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Project Info Stats */}
          <div className="border border-border bg-background">
            <div className="p-4 border-b border-border bg-muted/5">
              <h3 className="text-sm font-bold uppercase tracking-widest">System Metrics</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-border/50 last:border-0 last:pb-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Status</span>
                <div className={cn(
                  "px-1.5 py-0.5 border text-[9px] font-mono uppercase tracking-wider font-bold",
                  getStatusColor(project.status)
                )}>
                  {project.status.replace('_', ' ')}
                </div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-border/50 last:border-0 last:pb-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Created</span>
                <span className="text-xs font-mono">{format(new Date(project.createdAt), 'MM/dd/yy')}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-border/50 last:border-0 last:pb-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Last Updated</span>
                <span className="text-xs font-mono">{format(new Date(project.updatedAt), 'MM/dd/yy')}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-border/50 last:border-0 last:pb-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Total Tasks</span>
                <span className="text-xs font-mono font-bold">{project._count.tasks}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-rose-200 dark:border-rose-900 bg-rose-50/10 dark:bg-rose-950/5">
            <div className="p-4 border-b border-rose-200 dark:border-rose-900 bg-rose-100/10 dark:bg-rose-950/10 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">Danger Zone</h3>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-mono text-rose-600/80 dark:text-rose-400/80 mb-4 uppercase leading-relaxed">
                Critical Action: Deleting this project will permanently remove all associated boards, tasks, and historical data. This action is irreversible.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    className="w-full rounded-none h-9 text-xs uppercase font-bold tracking-wider"
                  >
                    {isDeleting ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        DELETING SYSTEM...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-3 w-3" />
                        DELETE PROJECT SYSTEM
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-none border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-bold uppercase tracking-widest text-sm text-destructive">Critical Warning</AlertDialogTitle>
                    <AlertDialogDescription className="font-mono text-xs">
                      You are about to permanently destroy project &apos;{project.name}&apos; and all its data. Type &quot;DELETE&quot; to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none border-border font-mono text-xs uppercase">Abort</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProject}
                      className="bg-destructive hover:bg-destructive/90 rounded-none font-mono text-xs uppercase"
                    >
                      Confirm Deletion
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Board Management - Full Width */}
        <div className="lg:col-span-3">
          <div className="border border-border bg-background">
            <div className="p-4 border-b border-border bg-muted/5">
              <h2 className="text-sm font-bold uppercase tracking-widest">Board Configuration</h2>
            </div>
            <div className="p-4">
              <BoardManagement project={project} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}