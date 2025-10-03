"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Save, Trash2, UserPlus, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
      case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
    }
  }

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
      case 'ADMIN': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'PURCHASER': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'ACCTG': return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
      case 'TREASURY': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'STOCKROOM': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
      case 'VIEWER': return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
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
        router.push(`/projects/${project.id}`)
      }
    } catch (error) {
      console.error("Project update error:", error)
      toast.error("Failed to update project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone and will delete all tasks, boards, and data associated with this project.")) {
      return
    }

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
    if (!confirm("Are you sure you want to remove this member from the project?")) {
      return
    }

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-border/50">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Project Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your project details, members, and preferences
          </p>
        </div>
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Project Details */}
        <div className="lg:col-span-1">
          <div className="bg-muted/30 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Project Details</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
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
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="ON_HOLD">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                On Hold
                              </div>
                            </SelectItem>
                            <SelectItem value="COMPLETED">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                Completed
                              </div>
                            </SelectItem>
                            <SelectItem value="ARCHIVED">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-500" />
                                Archived
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter project description"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMM dd, yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
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
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMM dd, yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < (form.getValues("startDate") || new Date())
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Middle Column - Team Management */}
        <div className="lg:col-span-1">
          <div className="bg-muted/30 rounded-lg p-4 h-fit">
            <h2 className="text-lg font-medium mb-4">Team Members</h2>
            
            {/* Add Member */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button 
                size="sm"
                onClick={handleAddMember}
                disabled={isAddingMember || !newMemberEmail.trim()}
              >
                {isAddingMember ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {/* Project Owner */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(project.owner.firstName, project.owner.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {project.owner.firstName} {project.owner.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-medium",
                  getRoleColor('OWNER')
                )}>
                  Owner
                </div>
              </div>

              {/* Project Members */}
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.user.firstName, member.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(member.joinedAt), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium",
                      getRoleColor(member.role)
                    )}>
                      {member.role}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Board Management - Full Width */}
        <div className="lg:col-span-3">
          <div className="bg-muted/30 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Board Management</h2>
            <BoardManagement project={project} />
          </div>
        </div>

        {/* Right Column - Project Info & Danger Zone */}
        <div className="lg:col-span-1 space-y-4">
          {/* Project Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-medium mb-3">Project Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-medium",
                  getStatusColor(project.status)
                )}>
                  {project.status.replace('_', ' ')}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{format(new Date(project.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{format(new Date(project.updatedAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium">{project._count.tasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{project.members.length + 1}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800/50">
            <h3 className="font-medium text-red-900 dark:text-red-300 mb-2">Danger Zone</h3>
            <p className="text-xs text-red-700 dark:text-red-400 mb-3">
              Once deleted, there&apos;s no going back.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}