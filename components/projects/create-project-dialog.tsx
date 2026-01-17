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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col rounded-none border-border p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border bg-muted/5">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest">
            {step === 'details' && 'PROJECT INITIALIZATION'}
            {step === 'board' && 'TEMPLATE SELECTION'}
            {step === 'custom' && 'BOARD CONFIGURATION'}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono uppercase tracking-wide text-muted-foreground mt-1">
            {step === 'details' && 'DEFINE METADATA'}
            {step === 'board' && 'CHOOSE WORKFLOW'}
            {step === 'custom' && 'CUSTOMIZE COLUMNS'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 p-6">
            {step === 'details' ? (
              <>
                {/* Project Details Step */}
                <div className="space-y-6 flex-1">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Project Identifier</FormLabel>
                        <FormControl>
                          <Input placeholder="PROJECT NAME" {...field} className="rounded-none font-mono text-xs uppercase h-10 border-border" />
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
                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Scope Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="BRIEF DESCRIPTION OF THE PROJECT..."
                            className="resize-none rounded-none font-mono text-xs uppercase border-border min-h-[100px]"
                            rows={4}
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
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal rounded-none h-10 border-border font-mono text-xs uppercase",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "MMM dd, yyyy")
                                  ) : (
                                    <span>PICK DATE</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
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
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest">End Date (OPT)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal rounded-none h-10 border-border font-mono text-xs uppercase",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "MMM dd, yyyy")
                                  ) : (
                                    <span>PICK DATE</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                
                <div className="flex justify-end space-x-2 pt-6 border-t border-border mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="rounded-none uppercase text-xs font-bold tracking-wider h-9 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-none uppercase text-xs font-bold tracking-wider h-9"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-3 w-3" />
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
                            "relative p-4 border cursor-pointer transition-all rounded-none group",
                            selectedTemplate.id === template.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/5"
                          )}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-xs uppercase tracking-wide">{template.name}</h4>
                                {selectedTemplate.id === template.id && (
                                  <Check className="h-3 w-3 text-primary" />
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-muted-foreground mb-3 uppercase">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2 pt-2 border-t border-dashed border-border/50">
                                <Columns className="h-3 w-3 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {template.columns.map((column, index) => (
                                    <span
                                      key={index}
                                      className="text-[9px] px-1.5 py-0.5 bg-muted rounded-none text-muted-foreground uppercase font-mono tracking-tight border border-border"
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
                
                <div className="flex justify-between space-x-2 pt-6 border-t border-border mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="rounded-none uppercase text-xs font-bold tracking-wider h-9 border-border"
                  >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    Back
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isLoading}
                      className="rounded-none uppercase text-xs font-bold tracking-wider h-9 border-border"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="rounded-none uppercase text-xs font-bold tracking-wider h-9">
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-3 w-3" />
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
                  <div className="flex-1 space-y-6">
                    <div className="p-4 bg-muted/5 border border-border">
                      <h4 className="font-bold text-xs uppercase tracking-widest mb-2">Board Identifier</h4>
                      <Input
                        placeholder="ENTER BOARD NAME"
                        defaultValue="Main Board"
                        className="text-xs font-mono uppercase rounded-none border-border h-9"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <h4 className="font-bold text-xs uppercase tracking-widest">Columns Configuration</h4>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {customColumns.length} COLUMNS DEFINED
                        </span>
                      </div>

                      {/* Add New Column */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="NEW COLUMN NAME"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          className="flex-1 text-xs font-mono uppercase rounded-none border-border h-9"
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
                          className="rounded-none h-9 w-9 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Column List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {customColumns.map((column, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-background border border-border group hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-none" />
                              <Input
                                value={column}
                                onChange={(e) => updateCustomColumn(index, e.target.value)}
                                className="border-none bg-transparent p-0 h-auto text-xs font-mono uppercase focus-visible:ring-0"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-muted-foreground">
                                IDX:{index + 1}
                              </span>
                              {customColumns.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive rounded-none"
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
                        <p className="text-[10px] text-muted-foreground font-mono uppercase border-t border-dashed border-border pt-2 mt-2">
                          Max 8 Columns supported. Drag & Drop enabled post-creation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2 pt-6 border-t border-border mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="rounded-none uppercase text-xs font-bold tracking-wider h-9 border-border"
                  >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    Back
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isLoading}
                      className="rounded-none uppercase text-xs font-bold tracking-wider h-9 border-border"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || customColumns.length === 0 || customColumns.some(col => !col.trim())}
                      className="rounded-none uppercase text-xs font-bold tracking-wider h-9"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-3 w-3" />
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