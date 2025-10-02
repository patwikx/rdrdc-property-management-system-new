"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PropertyTitleSchema, PropertyTitleFormData } from "@/lib/validations/property-title-schema"
import { createPropertyTitle } from "@/lib/actions/property-title-actions"
import { Save, X, User, AlertTriangle, Hash, MapPin, Ruler } from "lucide-react"
import { toast } from "sonner"

interface CreateTitleFormProps {
  propertyId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTitleForm({ propertyId, onSuccess, onCancel }: CreateTitleFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PropertyTitleFormData>({
    resolver: zodResolver(PropertyTitleSchema),
    defaultValues: {
      propertyId,
      titleNo: "",
      lotNo: "",
      lotArea: 0,
      registeredOwner: "",
      isEncumbered: false,
      encumbranceDetails: "",
    },
  })

  const isEncumbered = form.watch('isEncumbered')

  async function onSubmit(data: PropertyTitleFormData) {
    setIsLoading(true)
    
    try {
      const result = await createPropertyTitle(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof PropertyTitleFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Property title created successfully")
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
            {/* Title Number and Lot Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="titleNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Hash className="h-4 w-4" />
                      <span>Title Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., TCT-12345, OCT-67890" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Official title certificate number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Lot Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Lot 1, Block 2" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Lot identification number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lot Area and Registered Owner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="lotArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4" />
                      <span>Lot Area (sqm)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Total area covered by this title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registeredOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Registered Owner</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Full name of the registered owner" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Legal owner as registered in the title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Encumbrance Status */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isEncumbered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Property is Encumbered</span>
                      </FormLabel>
                      <FormDescription>
                        Check if this property has liens, mortgages, or other encumbrances
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isEncumbered && (
                <FormField
                  control={form.control}
                  name="encumbranceDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Encumbrance Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the encumbrance (mortgage, lien, etc.)"
                          {...field}
                          disabled={isLoading}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the encumbrance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Status Preview */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Title Status Preview</h4>
              <div className="flex items-center space-x-2">
                {isEncumbered ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Encumbered
                  </Badge>
                ) : (
                  <Badge className="bg-green-600">
                    Clear Title
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isEncumbered 
                  ? "This title has encumbrances that may affect ownership or transfer"
                  : "This title is free and clear of encumbrances"
                }
              </p>
            </div>

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
                    Create Title
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