"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Save, CalendarIcon, Receipt } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createUnitTaxAction } from "@/lib/actions/unit-server-actions"

const UnitTaxSchema = z.object({
  unitId: z.string(),
  taxYear: z.number().min(1900).max(2100),
  taxDecNo: z.string().min(1, "Tax Declaration Number is required"),
  taxAmount: z.number().min(0, "Tax amount must be positive"),
  dueDate: z.date(),
  isPaid: z.boolean(),
  isAnnual: z.boolean(),
  isQuarterly: z.boolean(),
  whatQuarter: z.string().optional(),
  remarks: z.string().optional(),
})

type UnitTaxFormData = z.infer<typeof UnitTaxSchema>

interface CreateUnitTaxFormProps {
  unitId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateUnitTaxForm({ unitId, onSuccess, onCancel }: CreateUnitTaxFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UnitTaxFormData>({
    resolver: zodResolver(UnitTaxSchema),
    defaultValues: {
      unitId,
      taxYear: new Date().getFullYear(),
      taxDecNo: "",
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

  async function onSubmit(data: UnitTaxFormData) {
    setIsLoading(true)
    
    try {
      const result = await createUnitTaxAction(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof UnitTaxFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Unit tax record created successfully")
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
    <div className="space-y-6">
      {/* Unit Tax Distinction */}
      <div className="border border-border p-4 bg-muted/5 flex items-start gap-3">
        <Receipt className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <span className="text-sm font-bold uppercase tracking-widest text-foreground block">Space-Specific Tax</span>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            This record is linked specifically to this unit, separate from the main property tax.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* First Row - Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="taxYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Tax Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      disabled={isLoading}
                      className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxDecNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Tax Declaration No.</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="TD-2024-XXXX" 
                      {...field}
                      disabled={isLoading}
                      className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
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
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Amount (PHP)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-mono text-muted-foreground">₱</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm h-10 pl-8 border-border focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Second Row - Due Date & Payment Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-none h-10 border-border font-mono text-sm hover:bg-muted",
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
                    <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
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
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 h-10 border border-border px-4 mt-6 bg-muted/5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="rounded-none border-muted-foreground"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-[10px] uppercase tracking-widest text-foreground font-mono cursor-pointer">
                      Mark as Paid
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Tax Type Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-dashed border-border/50">
            <FormField
              control={form.control}
              name="isAnnual"
              render={({ field }) => (
                <FormItem className={`flex flex-row items-start space-x-3 space-y-0 p-4 border transition-all cursor-pointer ${field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
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
                      className="rounded-none mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-bold text-xs uppercase tracking-wide cursor-pointer">Annual Assessment</FormLabel>
                    <FormDescription className="text-[10px] font-mono">Full year coverage (Jan - Dec)</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isQuarterly"
              render={({ field }) => (
                <FormItem className={`flex flex-row items-start space-x-3 space-y-0 p-4 border transition-all cursor-pointer ${field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
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
                      className="rounded-none mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-bold text-xs uppercase tracking-wide cursor-pointer">Quarterly Payment</FormLabel>
                    <FormDescription className="text-[10px] font-mono">Partial installment payment</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Quarter Selection */}
          {isQuarterly && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="whatQuarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Select Quarter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="rounded-none h-10 border-border font-mono text-xs uppercase">
                          <SelectValue placeholder="CHOOSE_QUARTER" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        <SelectItem value="Q1" className="font-mono text-xs uppercase">Q1 - First Quarter</SelectItem>
                        <SelectItem value="Q2" className="font-mono text-xs uppercase">Q2 - Second Quarter</SelectItem>
                        <SelectItem value="Q3" className="font-mono text-xs uppercase">Q3 - Third Quarter</SelectItem>
                        <SelectItem value="Q4" className="font-mono text-xs uppercase">Q4 - Fourth Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Remarks */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="ENTER_NOTES..."
                    {...field}
                    disabled={isLoading}
                    rows={2}
                    className="resize-none rounded-none border-border font-mono text-sm focus-visible:ring-0 focus-visible:border-primary"
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
              {isLoading ? "SAVING..." : <><Save className="h-4 w-4 mr-2" /> CREATE_RECORD</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}