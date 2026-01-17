"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createRWO } from "@/lib/actions/rwo-actions"
import { MaintenanceCategory, Priority } from "@prisma/client"

interface SpaceOption {
  id: string
  unitNumber: string
  propertyId: string
  propertyName: string
  tenantId: string
  tenantName: string
}

interface CreateRWODialogProps {
  spaces: SpaceOption[]
  trigger?: React.ReactNode
}

const formSchema = z.object({
  unitId: z.string().min(1, "Space selection is required"),
  category: z.nativeEnum(MaintenanceCategory, { message: "Category is required" }),
  priority: z.nativeEnum(Priority, { message: "Priority is required" }),
  description: z.string().min(1, "Description is required"),
})

type FormValues = z.infer<typeof formSchema>

const categoryOptions = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "OTHER", label: "Other" },
]

const priorityOptions = [
  { value: "EMERGENCY", label: "Emergency", description: "Immediate attention required" },
  { value: "HIGH", label: "High", description: "Urgent, within 24 hours" },
  { value: "MEDIUM", label: "Medium", description: "Within a few days" },
  { value: "LOW", label: "Low", description: "When convenient" },
]

export function CreateRWODialog({ spaces, trigger }: CreateRWODialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitId: "",
      category: undefined,
      priority: undefined,
      description: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await createRWO(values)
      
      if (result.status === "error") {
        toast.error(result.error.message)
        return
      }

      toast.success("RWO created successfully")
      form.reset()
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating RWO:", error)
      toast.error("Failed to create RWO")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group spaces by property for better UX
  const spacesByProperty = spaces.reduce((acc, space) => {
    if (!acc[space.propertyName]) {
      acc[space.propertyName] = []
    }
    acc[space.propertyName].push(space)
    return acc
  }, {} as Record<string, SpaceOption[]>)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-none h-9 text-xs uppercase tracking-wider font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Add RWO
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-none border-border">
        <DialogHeader className="border-b border-border pb-4 mb-4">
          <DialogTitle className="font-bold uppercase tracking-tight text-lg">Create Repair Work Order</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Space Selection */}
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Space / Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full rounded-none border-border font-mono text-sm">
                        <SelectValue placeholder="SELECT SPACE" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none border-border">
                      {Object.entries(spacesByProperty).map(([propertyName, propertySpaces]) => (
                        <div key={propertyName}>
                          <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground bg-muted/50">
                            {propertyName}
                          </div>
                          {propertySpaces.map((space) => (
                            <SelectItem key={space.id} value={space.id} className="rounded-none font-mono">
                              <div className="flex flex-col">
                                <span>{space.unitNumber}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {space.tenantName}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full rounded-none border-border font-mono text-sm">
                          <SelectValue placeholder="SELECT" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="rounded-none font-mono">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full rounded-none border-border font-mono text-sm">
                          <SelectValue placeholder="SELECT" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="rounded-none font-mono">
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="min-h-[100px] rounded-none border-border font-mono text-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="rounded-none uppercase tracking-wider text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-none uppercase tracking-wider text-xs font-semibold">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create RWO
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
