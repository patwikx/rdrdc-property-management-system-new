"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PropertyUtilitySchema, PropertyUtilityFormData } from "@/lib/validations/utility-schema"
import { createPropertyUtility } from "@/lib/actions/utility-actions"
import { UtilityType } from "@prisma/client"
import { Zap, Save, X, Building, Hash, Activity } from "lucide-react"
import { toast } from "sonner"

interface CreateUtilityFormProps {
  propertyId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const utilityTypeOptions = [
  { 
    value: UtilityType.ELECTRICITY, 
    label: "Electricity", 
    description: "Electric power connection",
    color: "bg-yellow-600",
    icon: Zap
  },
  { 
    value: UtilityType.WATER, 
    label: "Water", 
    description: "Water supply connection",
    color: "bg-blue-600",
    icon: Activity
  },
  { 
    value: UtilityType.OTHERS, 
    label: "Others", 
    description: "Gas, internet, cable, etc.",
    color: "bg-gray-600",
    icon: Building
  },
]

export function CreateUtilityForm({ propertyId, onSuccess, onCancel }: CreateUtilityFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PropertyUtilityFormData>({
    resolver: zodResolver(PropertyUtilitySchema),
    defaultValues: {
      propertyId,
      utilityType: UtilityType.ELECTRICITY,
      provider: "",
      accountNumber: "",
      meterNumber: "",
      isActive: true,
    },
  })

  async function onSubmit(data: PropertyUtilityFormData) {
    setIsLoading(true)
    
    try {
      const result = await createPropertyUtility(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof PropertyUtilityFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Utility created successfully")
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

  const selectedUtilityType = form.watch('utilityType')
  const selectedOption = utilityTypeOptions.find(opt => opt.value === selectedUtilityType)

  return (
    <div className="space-y-6">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Utility Type Selection */}
            <FormField
              control={form.control}
              name="utilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utility Type</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 md:grid-cols-3">
                      {utilityTypeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <div
                            key={option.value}
                            className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                              field.value === option.value
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => field.onChange(option.value)}
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className={`rounded-lg p-2 ${option.color}`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">{option.label}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider and Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Service Provider</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Meralco, Manila Water, PLDT" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Name of the utility service provider
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Hash className="h-4 w-4" />
                      <span>Account Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Account or service number" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Utility account or service number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Meter Number and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="meterNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Physical meter number" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Physical meter identification number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Connection</FormLabel>
                      <FormDescription>
                        Check if this utility connection is currently active
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Utility Preview */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Utility Connection Preview</h4>
              <div className="flex items-center space-x-2 mb-2">
                {selectedOption && (
                  <Badge className={selectedOption.color}>
                    {selectedOption.label}
                  </Badge>
                )}
                <Badge variant={form.watch('isActive') ? "default" : "secondary"}>
                  {form.watch('isActive') ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedOption?.description}
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
                    Create Utility
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