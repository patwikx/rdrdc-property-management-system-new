"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { TitleMovementSchema, TitleMovementFormData } from "@/lib/validations/title-movement-schema"
import { createTitleMovement } from "@/lib/actions/title-movement-actions"
import { Save, MapPin, FileText, Calendar, Activity } from "lucide-react"
import { toast } from "sonner"
import { TitleMovementStatus } from "@prisma/client"

interface CreateMovementFormProps {
  propertyId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateMovementForm({ propertyId, onSuccess, onCancel }: CreateMovementFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TitleMovementFormData>({
    resolver: zodResolver(TitleMovementSchema),
    defaultValues: {
      propertyId,
      status: TitleMovementStatus.REQUESTED,
      location: "",
      purpose: "",
      remarks: "",
      requestDate: new Date(),
    },
  })

  async function onSubmit(data: TitleMovementFormData) {
    setIsLoading(true)
    
    try {
      const result = await createTitleMovement(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof TitleMovementFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Title movement created successfully")
        form.reset()
        onSuccess?.()
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="rounded-none border-border h-10 font-mono text-sm">
                          <SelectValue placeholder="SELECT_STATUS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        <SelectItem value={TitleMovementStatus.REQUESTED} className="font-mono text-xs uppercase">Requested</SelectItem>
                        <SelectItem value={TitleMovementStatus.RELEASED} className="font-mono text-xs uppercase">Released</SelectItem>
                        <SelectItem value={TitleMovementStatus.IN_TRANSIT} className="font-mono text-xs uppercase">In Transit</SelectItem>
                        <SelectItem value={TitleMovementStatus.RETURNED} className="font-mono text-xs uppercase">Returned</SelectItem>
                        <SelectItem value={TitleMovementStatus.LOST} className="font-mono text-xs uppercase">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Request Date
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Location / Destination
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ENTER_LOCATION..." 
                      {...field}
                      disabled={isLoading}
                      className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Purpose
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="STATE_PURPOSE..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                      className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Additional Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ADDITIONAL_NOTES..."
                      {...field}
                      disabled={isLoading}
                      rows={2}
                      className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-none h-10 font-mono text-xs uppercase tracking-wide border-border">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="min-w-[140px] rounded-none h-10 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? "SAVING..." : <><Save className="h-4 w-4 mr-2" /> CREATE_MOVEMENT</>}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  )
}