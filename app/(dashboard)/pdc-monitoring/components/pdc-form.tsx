"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, FileText, ChevronsUpDown, Check, Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
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
    const numbersOnly = value.replace(/[^\d.]/g, '')
    const parts = numbersOnly.split('.')
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('')
    }
    if (parts.length === 2) {
      return parts[0] + '.' + parts[1].substring(0, 2)
    }
    return numbersOnly
  }

  const formatAmountForDisplay = (value: string) => {
    if (!value) return ""
    const cleanValue = value.replace(/[^\d.]/g, '')
    const parts = cleanValue.split('.')
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
        <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
          <Plus className="mr-2 h-3 w-3" />
          Register PDC
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[700px] max-w-[700px] rounded-none border-border p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border bg-muted/5">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <FileText className="h-4 w-4" />
            New Post-Dated Check Record
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Transaction Data</h4>
                <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="refNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Reference No.</FormLabel>
                      <FormControl>
                        <Input placeholder="REF-0000" {...field} className="rounded-none font-mono text-xs uppercase h-9 border-border" />
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
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Business Partner</FormLabel>
                      <Popover open={openTenantCombobox} onOpenChange={setOpenTenantCombobox}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openTenantCombobox}
                              className="w-full justify-between rounded-none font-mono text-xs uppercase h-9 border-border"
                            >
                              {field.value
                                ? (() => {
                                  const tenant = tenants.find((t) => t.bpCode === field.value);
                                  const displayText = tenant ? `${tenant.company || tenant.businessName}` : "SELECT BP...";
                                  return displayText.length > 35 ? displayText.substring(0, 35) + "..." : displayText;
                                })()
                                : "SELECT BP..."}
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 rounded-none border-border">
                          <Command className="rounded-none">
                            <CommandInput
                              placeholder="SEARCH TENANT..."
                              className="h-9 rounded-none font-mono text-xs uppercase"
                            />
                            <CommandEmpty className="p-2 font-mono text-xs">NO TENANT FOUND.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {tenants.map((tenant) => (
                                <CommandItem
                                  key={tenant.bpCode}
                                  value={`${tenant.bpCode} ${tenant.businessName} ${tenant.company || ''} ${tenant.email}`}
                                  onSelect={() => {
                                    field.onChange(tenant.bpCode);
                                    setOpenTenantCombobox(false);
                                  }}
                                  className="cursor-pointer rounded-none font-mono text-xs"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-3 w-3",
                                      field.value === tenant.bpCode ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-bold truncate uppercase">{tenant.bpCode} — {tenant.company || tenant.businessName}</span>
                                    <span className="text-[10px] text-muted-foreground truncate font-mono">
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
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Instrument Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="BANK NAME" {...field} className="rounded-none font-mono text-xs uppercase h-9 border-border" />
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
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Check No.</FormLabel>
                      <FormControl>
                        <Input placeholder="CHECK NO." {...field} className="rounded-none font-mono text-xs uppercase h-9 border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Financials</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Due Date</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="MM/DD/YYYY"
                            className="rounded-none font-mono text-xs uppercase h-9 border-border"
                            value={field.value ? (
                              field.value.includes('T') ? format(new Date(field.value), "MM/dd/yyyy") : field.value
                            ) : ""}
                            onChange={(e) => {
                              const value = e.target.value
                              const numbersOnly = value.replace(/[^\d]/g, '')
                              let formatted = ''
                              if (numbersOnly.length > 0) {
                                formatted = numbersOnly.substring(0, 2)
                                if (numbersOnly.length > 2) {
                                  formatted += '/' + numbersOnly.substring(2, 4)
                                  if (numbersOnly.length > 4) {
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
                                    field.onChange(value)
                                  }
                                } catch (error) {
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
                              className="shrink-0 rounded-none h-9 w-9 border-border"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value && field.value.includes('T') ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date?.toISOString())}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              className="rounded-none"
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
                        <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="0.00"
                            className="rounded-none font-mono text-xs uppercase h-9 border-border text-right"
                            value={formatAmountForDisplay(amountInput)}
                            onChange={(e) => {
                              const value = e.target.value
                              const withoutCommas = value.replace(/,/g, '')
                              const formatted = formatAmountDisplay(withoutCommas)
                              setAmountInput(formatted)
                              const numericValue = parseFloat(formatted.replace(/,/g, '')) || 0
                              field.onChange(numericValue)
                            }}
                            onBlur={() => {
                              if (amountInput) {
                                const numericValue = parseFloat(amountInput.replace(/,/g, '')) || 0
                                field.onChange(parseFloat(numericValue.toFixed(2)))
                                const formatted = numericValue.toFixed(2)
                                setAmountInput(formatted)
                              }
                            }}
                            onFocus={() => {
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
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Notes</h4>
                <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ENTER REMARKS..."
                        className="resize-none rounded-none font-mono text-xs uppercase border-border min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold border-border"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
                  {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Confirm Record
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}