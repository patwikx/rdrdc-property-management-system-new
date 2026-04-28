"use client"

import { useRef, useState, useTransition, type KeyboardEvent } from "react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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
  const formRef = useRef<HTMLFormElement>(null)

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

  function handleFormTab(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    const tabStops = Array.from(
      formRef.current?.querySelectorAll<HTMLElement>("[data-pdc-tab-stop]") ?? []
    ).filter((element) => {
      const isDisabled =
        element.hasAttribute("disabled") ||
        element.getAttribute("aria-disabled") === "true"

      return !isDisabled && element.tabIndex !== -1
    })

    if (tabStops.length === 0) return

    const activeElement = document.activeElement as HTMLElement | null
    const currentIndex = tabStops.findIndex(
      (element) => element === activeElement || element.contains(activeElement)
    )

    if (currentIndex === -1) return

    event.preventDefault()
    setOpenTenantCombobox(false)

    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + tabStops.length) % tabStops.length
      : (currentIndex + 1) % tabStops.length

    requestAnimationFrame(() => tabStops[nextIndex]?.focus())
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
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[700px] rounded-none border-border p-0 gap-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          requestAnimationFrame(() => {
            formRef.current?.querySelector<HTMLElement>("[data-pdc-tab-stop]")?.focus()
          })
        }}
      >
        <DialogHeader className="p-4 border-b border-border bg-muted/5">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <FileText className="h-4 w-4" />
            New Post-Dated Check Record
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={handleFormTab}
              className="space-y-6"
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Transaction Data</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="refNo"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Reference No.</FormLabel>
                      <FormControl>
                        <Input data-pdc-tab-stop placeholder="REF-0000" {...field} className="rounded-none font-mono text-xs uppercase h-9 border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bpCode"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Business Partner</FormLabel>
                      <Popover open={openTenantCombobox} onOpenChange={setOpenTenantCombobox}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openTenantCombobox}
                              data-pdc-tab-stop
                              className="w-full min-w-0 justify-between rounded-none font-mono text-xs uppercase h-9 border-border"
                            >
                              <span className="min-w-0 flex-1 truncate text-left">
                                {field.value
                                  ? tenants.find((tenant) => tenant.bpCode === field.value)?.company ||
                                    tenants.find((tenant) => tenant.bpCode === field.value)?.businessName ||
                                    "SELECT BP..."
                                  : "SELECT BP..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-[min(462px,calc(100vw-4rem))] p-0 rounded-none border-border"
                        >
                          <Command className="rounded-none">
                            <CommandInput
                              placeholder="SEARCH TENANT..."
                              className="h-9 rounded-none font-mono text-xs uppercase"
                            />
                            <CommandList className="max-h-64">
                              <CommandEmpty className="p-2 font-mono text-xs">NO TENANT FOUND.</CommandEmpty>
                              <CommandGroup>
                                {tenants.map((tenant) => (
                                  <CommandItem
                                    key={tenant.bpCode}
                                    value={`${tenant.bpCode} ${tenant.businessName} ${tenant.company || ''}`}
                                    onSelect={() => {
                                      field.onChange(tenant.bpCode);
                                      setOpenTenantCombobox(false);
                                    }}
                                    className="cursor-pointer items-start rounded-none font-mono text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mt-0.5 mr-2 h-3 w-3",
                                        field.value === tenant.bpCode ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="min-w-0 flex-1 whitespace-normal break-words font-bold uppercase leading-5">
                                      {tenant.bpCode} — {tenant.company || tenant.businessName}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="bankName"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Bank Name</FormLabel>
                      <FormControl>
                        <Input data-pdc-tab-stop placeholder="BANK NAME" {...field} className="rounded-none font-mono text-xs uppercase h-9 border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="checkNo"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Check No.</FormLabel>
                      <FormControl>
                        <Input data-pdc-tab-stop placeholder="CHECK NO." {...field} className="rounded-none font-mono text-xs uppercase h-9 border-border" />
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dueDate"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Due Date</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            data-pdc-tab-stop
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
                                } catch {
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
                              tabIndex={-1}
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
                      <FormItem className="min-w-0">
                        <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Amount</FormLabel>
                        <FormControl>
                          <Input
                            data-pdc-tab-stop
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
                        data-pdc-tab-stop
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
                  data-pdc-tab-stop
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold border-border"
                >
                  Cancel
                </Button>
                <Button type="submit" data-pdc-tab-stop disabled={isPending} className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
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
