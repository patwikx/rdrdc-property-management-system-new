"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Plus, Check, Columns, ArrowRight, ArrowLeft, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import { ProjectSchema, ProjectFormData } from "@/lib/validations/project-schema"
import { createProject } from "@/lib/actions/project-actions"
import { BOARD_TEMPLATES, BoardTemplate } from "@/lib/board-templates"


interface CreateProjectDialogProps {
  children: React.ReactNode
}

export function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'board' | 'custom'>('details')
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>(BOARD_TEMPLATES[0])
  const [customColumns, setCustomColumns] = useState<string[]>(['To Do', 'In Progress', 'Done'])
  const [newColumnName, setNewColumnName] = useState("")

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      boardTemplate: BOARD_TEMPLATES[0].id,
    },
  })

  async function onSubmit(data: ProjectFormData) {
    setIsLoading(true)
    
    try {
      // If custom template is selected, create custom template data
      let finalData = data
      if (selectedTemplate.id === 'custom') {
        finalData = {
          ...data,
          customColumns: customColumns.filter(col => col.trim() !== ''),
        }
      }
      
      const result = await createProject(finalData)
      
      if (result.error) {
        toast.error(result.error)
        console.error("Project creation error:", result.error)
      } else {
        toast.success(result.success)
        setOpen(false)
        form.reset()
        setStep('details')
        setSelectedTemplate(BOARD_TEMPLATES[0])
        setCustomColumns(['To Do', 'In Progress', 'Done'])
        setNewColumnName("")
        
        // Redirect to the created project
        if (result.project) {
          router.push(`/projects/${result.project.id}`)
        }
      }
    } catch (error) {
      console.error("Project creation error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    form.trigger(['name', 'startDate']).then((isValid) => {
      if (isValid) {
        setStep('board')
      }
    })
  }

  const handleBack = () => {
    if (step === 'custom') {
      setStep('board')
    } else {
      setStep('details')
    }
  }

  const handleTemplateSelect = (template: BoardTemplate) => {
    setSelectedTemplate(template)
    form.setValue('boardTemplate', template.id)
    
    if (template.id === 'custom') {
      setStep('custom')
    }
  }

  const addCustomColumn = () => {
    if (newColumnName.trim() && !customColumns.includes(newColumnName.trim())) {
      setCustomColumns([...customColumns, newColumnName.trim()])
      setNewColumnName("")
    }
  }

  const removeCustomColumn = (index: number) => {
    if (customColumns.length > 1) {
      setCustomColumns(customColumns.filter((_, i) => i !== index))
    }
  }

  const updateCustomColumn = (index: number, newName: string) => {
    const updated = [...customColumns]
    updated[index] = newName
    setCustomColumns(updated)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setStep('details')
        setSelectedTemplate(BOARD_TEMPLATES[0])
        form.reset()
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' && 'Create New Project'}
            {step === 'board' && 'Choose Board Template'}
            {step === 'custom' && 'Customize Your Board'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' && 'Set up your project details and timeline'}
            {step === 'board' && 'Select a board template that matches your workflow'}
            {step === 'custom' && 'Define your custom columns for the perfect workflow'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            {step === 'details' ? (
              <>
                {/* Project Details Step */}
                <div className="space-y-4 flex-1">
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
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
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                  >
                    Next: Choose Board
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : step === 'board' ? (
              <>
                {/* Board Template Step */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-3">
                      {BOARD_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className={cn(
                            "relative p-3 rounded-lg border cursor-pointer transition-all",
                            selectedTemplate.id === template.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-border/80 hover:bg-muted/50"
                          )}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                {selectedTemplate.id === template.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Columns className="h-3 w-3 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {template.columns.map((column, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                                    >
                                      {column.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2 pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Project
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : step === 'custom' ? (
              <>
                {/* Custom Template Step */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 space-y-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">Board Name</h4>
                      <Input
                        placeholder="Enter board name"
                        defaultValue="Main Board"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Columns</h4>
                        <span className="text-xs text-muted-foreground">
                          {customColumns.length} columns
                        </span>
                      </div>

                      {/* Add New Column */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter column name"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          className="flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomColumn()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCustomColumn}
                          disabled={!newColumnName.trim() || customColumns.includes(newColumnName.trim())}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Column List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {customColumns.map((column, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-background rounded border border-border/50"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <Input
                                value={column}
                                onChange={(e) => updateCustomColumn(index, e.target.value)}
                                className="border-none bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {index + 1}
                              </span>
                              {customColumns.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeCustomColumn(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {customColumns.length < 8 && (
                        <p className="text-xs text-muted-foreground">
                          You can add up to 8 columns. Drag and drop to reorder after creation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2 pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || customColumns.length === 0 || customColumns.some(col => !col.trim())}
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Project
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}