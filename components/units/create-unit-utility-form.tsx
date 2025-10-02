"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Save, Zap, X, Hash, Activity, Building } from "lucide-react"
import { toast } from "sonner"
import { createUnitUtilityAction } from "@/lib/actions/unit-server-actions"

const UnitUtilitySchema = z.object({
  unitId: z.string(),
  utilityType: z.enum(['ELECTRICITY', 'WATER', 'OTHERS']),
  accountNumber: z.string().min(1, "Account number is required"),
  meterNumber: z.string().optional(),
  billingId: z.string().optional(),
  isActive: z.boolean(),
  remarks: z.string().optional(),
})

type UnitUtilityFormData = z.infer<typeof UnitUtilitySchema>

const utilityTypeOptions = [
  { 
    value: 'ELECTRICITY' as const, 
    label: "Electricity", 
    description: "Electric power connection for this unit",
    color: "bg-yellow-600",
    icon: Zap
  },
  { 
    value: 'WATER' as const, 
    label: "Water", 
    description: "Water supply connection for this unit",
    color: "bg-blue-600",
    icon: Activity
  },
  { 
    value: 'OTHERS' as const, 
    label: "Others", 
    description: "Gas, internet, cable, etc.",
    color: "bg-gray-600",
    icon: Building
  },
]

interface CreateUnitUtilityFormProps {
  unitId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateUnitUtilityForm({ unitId, onSuccess, onCancel }: CreateUnitUtilityFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UnitUtilityFormData>({
    resolver: zodResolver(UnitUtilitySchema),
    defaultValues: {
      unitId,
      utilityType: 'ELECTRICITY',
      accountNumber: "",
      meterNumber: "",
      billingId: "",
      isActive: true,
      remarks: "",
    },
  })

  async function onSubmit(data: UnitUtilityFormData) {
    setIsLoading(true)
    
    try {
      const result = await createUnitUtilityAction(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof UnitUtilityFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Unit utility account created successfully")
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

          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      placeholder="e.g., 1234567890" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The official account number from the utility provider
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meterNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meter Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., MTR-001234" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical meter identification number if applicable
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Billing ID and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="billingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing ID (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., BILL-001234" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Alternative billing reference number if different from account number
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
                      Check if this utility account is currently active and in use
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Remarks */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes about this utility account..."
                    {...field}
                    disabled={isLoading}
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  Include any special instructions, contact information, or other relevant details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Utility Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Unit Utility Account Preview</h4>
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
                  Create Utility Account
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