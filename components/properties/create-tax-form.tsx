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
import { Save, CalendarIcon, Hash, DollarSign, Calendar as CalendarIconLucide, FileText } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TitleOption {
  id: string
  titleNo: string
  lotNo: string
  registeredOwner: string
}

interface CreateTaxFormProps {
  titles: TitleOption[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTaxForm({ titles, onSuccess, onCancel }: CreateTaxFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PropertyTaxFormData>({
    resolver: zodResolver(PropertyTaxSchema),
    defaultValues: {
      propertyTitleId: "",
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
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Title Selection - Top Priority */}
          <div className="grid grid-cols-1">
            <FormField
              control={form.control}
              name="propertyTitleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Property Title
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="rounded-none font-mono text-sm border-border focus:ring-0 focus:border-primary h-10">
                        <SelectValue placeholder="SELECT_TITLE_REFERENCE" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none border-border">
                      {titles.map((title) => (
                        <SelectItem key={title.id} value={title.id} className="font-mono text-xs">
                          {title.titleNo} - LOT {title.lotNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* First Row - Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="taxYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <CalendarIconLucide className="h-3 w-3" />
                    Tax Year
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
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
              name="TaxDecNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Tax Dec No
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.G. TD-2024-001234" 
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
              name="taxAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Amount
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">₱</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10 pl-8"
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
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "rounded-none h-10 font-mono text-sm border-border w-full justify-start text-left font-normal px-3",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 shrink-0" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>PICK_DATE</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        captionLayout="dropdown"
                        className="rounded-none"
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
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 border border-border px-4 h-10 bg-muted/5 mt-auto">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="rounded-none h-4 w-4 border-muted-foreground"
                    />
                  </FormControl>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-foreground font-mono cursor-pointer flex-1">
                    Mark as Paid Record
                  </FormLabel>
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
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
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
                      className="rounded-none"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Annual Assessment</FormLabel>
                    <FormDescription className="text-[10px] font-mono">Full year coverage</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isQuarterly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
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
                      className="rounded-none"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Quarterly Payment</FormLabel>
                    <FormDescription className="text-[10px] font-mono">Installment basis</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Quarter Selection (if quarterly is selected) */}
          {isQuarterly && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <FormField
                control={form.control}
                name="whatQuarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Select Quarter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="rounded-none border-border h-10 font-mono text-sm">
                          <SelectValue placeholder="CHOOSE_QUARTER" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        <SelectItem value="Q1" className="font-mono text-xs">Q1 (JAN-MAR)</SelectItem>
                        <SelectItem value="Q2" className="font-mono text-xs">Q2 (APR-JUN)</SelectItem>
                        <SelectItem value="Q3" className="font-mono text-xs">Q3 (JUL-SEP)</SelectItem>
                        <SelectItem value="Q4" className="font-mono text-xs">Q4 (OCT-DEC)</SelectItem>
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
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Notes / Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="ADDITIONAL_INFORMATION..."
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
              {isLoading ? "SAVING..." : <><Save className="h-4 w-4 mr-2" /> CREATE_RECORD</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}