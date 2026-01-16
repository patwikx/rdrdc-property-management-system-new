"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <div className="space-y-6 p-4">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Number and Lot Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="titleNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                      <Hash className="h-3 w-3" />
                      <span>Title Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.G. TCT-12345" 
                        {...field}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                      <MapPin className="h-3 w-3" />
                      <span>Lot Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.G. LOT 1, BLOCK 2" 
                        {...field}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                      />
                    </FormControl>
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
                    <FormLabel className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                      <Ruler className="h-3 w-3" />
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
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registeredOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                      <User className="h-3 w-3" />
                      <span>Registered Owner</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="FULL NAME OF OWNER" 
                        {...field}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Encumbrance Status */}
            <div className="space-y-4 border border-dashed border-border p-4 bg-muted/5">
              <FormField
                control={form.control}
                name="isEncumbered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        className="rounded-none h-5 w-5 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center space-x-2 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>Property is Encumbered</span>
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Check if this property has active liens or mortgages
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isEncumbered && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <FormField
                    control={form.control}
                    name="encumbranceDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Encumbrance Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="DESCRIBE THE ENCUMBRANCE..."
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
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-none h-10 font-mono text-xs uppercase tracking-wide border-border">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="rounded-none h-10 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? "SAVING..." : <><Save className="h-4 w-4 mr-2" /> CREATE_RECORD</>}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  )
}