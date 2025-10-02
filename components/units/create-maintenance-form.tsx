"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { createMaintenanceRequestAction } from "@/lib/actions/unit-server-actions"

const MaintenanceRequestSchema = z.object({
  unitId: z.string(),
  tenantId: z.string().optional(),
  category: z.enum(["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "STRUCTURAL", "OTHER"]),
  priority: z.enum(["EMERGENCY", "HIGH", "MEDIUM", "LOW"]),
  description: z.string().min(1, "Description is required"),
})

type MaintenanceRequestFormData = z.infer<typeof MaintenanceRequestSchema>

interface CreateMaintenanceFormProps {
  unitId: string
  tenantId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const categoryOptions = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "OTHER", label: "Other" },
]

const priorityOptions = [
  { value: "EMERGENCY", label: "Emergency", color: "text-red-600" },
  { value: "HIGH", label: "High", color: "text-orange-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "LOW", label: "Low", color: "text-green-600" },
]

export function CreateMaintenanceForm({ unitId, tenantId, onSuccess, onCancel }: CreateMaintenanceFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<MaintenanceRequestFormData>({
    resolver: zodResolver(MaintenanceRequestSchema),
    defaultValues: {
      unitId,
      tenantId: tenantId || "",
      category: "OTHER",
      priority: "MEDIUM",
      description: "",
    },
  })

  async function onSubmit(data: MaintenanceRequestFormData) {
    setIsLoading(true)
    
    try {
      const result = await createMaintenanceRequestAction(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof MaintenanceRequestFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Maintenance request created successfully")
        form.reset()
        onSuccess?.()
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the maintenance issue in detail..."
                  {...field}
                  disabled={isLoading}
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Provide as much detail as possible to help maintenance staff understand the issue
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end space-x-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Request
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}