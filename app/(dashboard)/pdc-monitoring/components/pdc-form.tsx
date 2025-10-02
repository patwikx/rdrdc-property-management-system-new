"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, FileText, Building, CreditCard, DollarSign, ChevronsUpDown, Check } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CreatePDCInput, createPDCSchema } from "@/lib/validations/pdc-valitdations"
import { createPDC } from "@/lib/actions/pdc-actions"




interface PDCFormProps {
  tenants: Array<{
    bpCode: string
    company: string | null
    businessName: string
    email: string
  }>
}

export function PDCForm({ tenants }: PDCFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [amountInput, setAmountInput] = useState("")
  const [openTenantCombobox, setOpenTenantCombobox] = useState(false)

  const form = useForm<CreatePDCInput>({
    resolver: zodResolver(createPDCSchema),
    defaultValues: {
      refNo: "",
      bankName: "",
      dueDate: "",
      checkNo: "",
      amount: 0,
      remarks: "",
      bpCode: "",
    },
  })

  function onSubmit(data: CreatePDCInput) {
    startTransition(async () => {
      const result = await createPDC(data)
     
      if (result.success) {
        toast.success("PDC created successfully")
        form.reset()
        setAmountInput("")
        setOpen(false)
      } else {
        toast.error(result.error || "Failed to create PDC")
      }
    })
  }

  const formatAmountDisplay = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numbersOnly = value.replace(/[^\d.]/g, '')
    
    // Handle multiple decimal points
    const parts = numbersOnly.split('.')
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Limit decimal places to 2
    if (parts.length === 2) {
      return parts[0] + '.' + parts[1].substring(0, 2)
    }
    
    return numbersOnly
  }

  const formatAmountForDisplay = (value: string) => {
    if (!value) return ""
    
    const cleanValue = value.replace(/[^\d.]/g, '')
    const parts = cleanValue.split('.')
    
    // Format the integer part with commas
    if (parts[0]) {
      const formattedInteger = parseInt(parts[0]).toLocaleString('en-US')
      if (parts.length > 1) {
        return formattedInteger + '.' + parts[1]
      }
      return formattedInteger
    }
    
    return cleanValue
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New PDC</Button>
      </DialogTrigger>
      <DialogContent className="w-[700px] max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            Create New PDC
          </DialogTitle>
          <DialogDescription>
            Add a new post-dated check to the credit & collection system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="refNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Reference No.
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reference number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bpCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Business Partner
                    </FormLabel>
                    <Popover open={openTenantCombobox} onOpenChange={setOpenTenantCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openTenantCombobox}
                            className="w-full justify-between"
                          >
                            {field.value
                              ? (() => {
                                const tenant = tenants.find((t) => t.bpCode === field.value);
                                const displayText = tenant ? `${tenant.company || tenant.businessName}` : "Select tenant...";
                                return displayText.length > 35 ? displayText.substring(0, 35) + "..." : displayText;
                              })()
                              : "Select tenant..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search tenant..."
                            className="h-9"
                          />
                          <CommandEmpty>No tenant found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {tenants.map((tenant) => (
                              <CommandItem
                                key={tenant.bpCode}
                                value={`${tenant.bpCode} ${tenant.businessName} ${tenant.company || ''} ${tenant.email}`}
                                onSelect={() => {
                                  field.onChange(tenant.bpCode);
                                  setOpenTenantCombobox(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === tenant.bpCode ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium truncate">{tenant.bpCode} — {tenant.company || tenant.businessName}</span>
                                  <span className="text-sm text-muted-foreground truncate">
                                    {tenant.email}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            {/* Check Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Check Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Bank Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bank name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="checkNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Check No.
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter check number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Financial Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      Due Date
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="MM/DD/YYYY"
                          value={field.value ? (
                            // If it's already an ISO string, format it for display
                            field.value.includes('T') ? format(new Date(field.value), "MM/dd/yyyy") : field.value
                          ) : ""}
                          onChange={(e) => {
                            const value = e.target.value
                            // Remove all non-numeric characters except existing slashes
                            const numbersOnly = value.replace(/[^\d]/g, '')
                            
                            // Format as MM/DD/YYYY
                            let formatted = ''
                            if (numbersOnly.length > 0) {
                              // Add first two digits (month)
                              formatted = numbersOnly.substring(0, 2)
                              
                              if (numbersOnly.length > 2) {
                                // Add slash and next two digits (day)
                                formatted += '/' + numbersOnly.substring(2, 4)
                                
                                if (numbersOnly.length > 4) {
                                  // Add slash and remaining digits (year)
                                  formatted += '/' + numbersOnly.substring(4, 8)
                                }
                              }
                            }
                            
                            field.onChange(formatted)
                          }}
                          onBlur={(e) => {
                            const value = e.target.value
                            if (value && value !== "") {
                              try {
                                const date = new Date(value)
                                if (!isNaN(date.getTime())) {
                                  field.onChange(date.toISOString())
                                } else {
                                  // Keep the typed value for user to correct
                                  field.onChange(value)
                                }
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              } catch (error) {
                                // Keep the typed value for user to correct
                                field.onChange(value)
                              }
                            }
                          }}
                          maxLength={10}
                        />
                      </FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value && field.value.includes('T') ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Amount
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0.00"
                          value={formatAmountForDisplay(amountInput)}
                          onChange={(e) => {
                            const value = e.target.value
                            // Remove commas for processing
                            const withoutCommas = value.replace(/,/g, '')
                            const formatted = formatAmountDisplay(withoutCommas)
                            
                            setAmountInput(formatted)
                            
                            // Update the form field with the numeric value
                            const numericValue = parseFloat(formatted.replace(/,/g, '')) || 0
                            field.onChange(numericValue)
                          }}
                          onBlur={() => {
                            if (amountInput) {
                              const numericValue = parseFloat(amountInput.replace(/,/g, '')) || 0
                              field.onChange(parseFloat(numericValue.toFixed(2)))
                              // Format the display value to always show 2 decimal places
                              const formatted = numericValue.toFixed(2)
                              setAmountInput(formatted)
                            }
                          }}
                          onFocus={() => {
                            // When focused, remove trailing zeros for easier editing
                            if (amountInput) {
                              const cleaned = parseFloat(amountInput.replace(/,/g, '')).toString()
                              setAmountInput(cleaned)
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Additional Information</h4>
              <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Remarks
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any remarks or notes (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create PDC
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}