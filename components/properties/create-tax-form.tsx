"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { PropertyTaxSchema, PropertyTaxFormData } from "@/lib/validations/property-tax-schema"
import { createPropertyTax } from "@/lib/actions/property-tax-actions"
import { Save, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CreateTaxFormProps {
  propertyTitleId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTaxForm({ propertyTitleId, onSuccess, onCancel }: CreateTaxFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PropertyTaxFormData>({
    resolver: zodResolver(PropertyTaxSchema),
    defaultValues: {
      propertyTitleId,
      taxYear: new Date().getFullYear(),
      TaxDecNo: "",
      taxAmount: 0,
      dueDate: new Date(),
      isPaid: false,
      isAnnual: true,
      isQuarterly: false,
      whatQuarter: "",
      remarks: "",
    },
  })

  const isQuarterly = form.watch('isQuarterly')

  async function onSubmit(data: PropertyTaxFormData) {
    setIsLoading(true)
    
    try {
      const result = await createPropertyTax(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof PropertyTaxFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Property tax record created successfully")
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
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* First Row - Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="taxYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tax Year *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      disabled={isLoading}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="TaxDecNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tax Declaration Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., TD-2024-001234" 
                      {...field}
                      disabled={isLoading}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tax Amount *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base text-muted-foreground">₱</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="h-12 pl-10 text-base"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Second Row - Due Date & Payment Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Due Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 text-base w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                       captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-center">
                  <FormLabel className="text-sm font-medium">Payment Status</FormLabel>
                  <div className="flex items-center space-x-3 h-12 p-4 border rounded-md">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                    <span className="text-base">Mark as Already Paid</span>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Tax Type Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="isAnnual"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-6 border rounded-lg">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (checked) {
                          form.setValue('isQuarterly', false)
                          form.setValue('whatQuarter', '')
                        }
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-medium text-base">Annual Tax Assessment</FormLabel>
                    <FormDescription className="text-sm">Full year tax assessment (January - December)</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isQuarterly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-6 border rounded-lg">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (checked) {
                          form.setValue('isAnnual', false)
                        } else {
                          form.setValue('whatQuarter', '')
                        }
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-medium text-base">Quarterly Tax Payment</FormLabel>
                    <FormDescription className="text-sm">Quarterly installment payment</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Quarter Selection (if quarterly is selected) */}
          {isQuarterly && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="whatQuarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Select Quarter *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Choose quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 - First Quarter (January - March)</SelectItem>
                        <SelectItem value="Q2">Q2 - Second Quarter (April - June)</SelectItem>
                        <SelectItem value="Q3">Q3 - Third Quarter (July - September)</SelectItem>
                        <SelectItem value="Q4">Q4 - Fourth Quarter (October - December)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Remarks - Single Row */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes or comments..."
                    {...field}
                    disabled={isLoading}
                    rows={2}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="min-w-[140px]">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Tax Record
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}