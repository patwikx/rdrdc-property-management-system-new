"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { TitleMovementSchema, TitleMovementFormData } from "@/lib/validations/title-movement-schema"
import { createTitleMovement } from "@/lib/actions/title-movement-actions"
import { Save, X, MapPin, FileText, Calendar } from "lucide-react"
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TitleMovementStatus.REQUESTED}>Requested</SelectItem>
                        <SelectItem value={TitleMovementStatus.RELEASED}>Released</SelectItem>
                        <SelectItem value={TitleMovementStatus.IN_TRANSIT}>In Transit</SelectItem>
                        <SelectItem value={TitleMovementStatus.RETURNED}>Returned</SelectItem>
                        <SelectItem value={TitleMovementStatus.LOST}>Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current status of the title movement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location and Request Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Current or destination location" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Where the title is located or being sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Request Date</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Date when the movement was requested
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Purpose</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this title movement"
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Reason for requesting the title movement
                  </FormDescription>
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
                  <FormLabel>Additional Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or comments (optional)"
                      {...field}
                      disabled={isLoading}
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional additional information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Movement
                  </>
                )}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
    </div>
  )
}