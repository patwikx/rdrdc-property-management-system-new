"use client"

import { Check, ChevronsUpDown, Users, Calendar as CalendarIcon, DollarSign } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Tenant {
  id: string
  bpCode: string
  firstName: string | null
  lastName: string | null
  company: string
  businessName: string
  email: string
  status: string
}

interface LeaseFormData {
  tenantId: string
  startDate: Date
  endDate: Date
  securityDeposit: number
  standardIncreasePercentage: number
  increaseIntervalYears: number
  autoIncreaseEnabled: boolean
}

interface LeaseDetailsStepProps {
  form: UseFormReturn<LeaseFormData>
  tenants: Tenant[]
  openTenantSelect: boolean
  setOpenTenantSelect: (open: boolean) => void
}

export function LeaseDetailsStep({ form, tenants, openTenantSelect, setOpenTenantSelect }: LeaseDetailsStepProps) {
  const getTenantName = (tenant: Tenant) => {
    return tenant.businessName || tenant.company
  }

  const getTenantDisplayText = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    return tenant ? getTenantName(tenant) : "Select tenant"
  }

  return (
    <div className="space-y-8">
      {/* Tenant Selection */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Users className="h-3 w-3" />
            Tenant Party
          </span>
        </div>
        <div className="p-6">
          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Select Tenant *</FormLabel>
                <Popover open={openTenantSelect} onOpenChange={setOpenTenantSelect}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTenantSelect}
                        className={cn(
                          "w-full justify-between h-10 rounded-none border-border font-mono text-sm",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? getTenantDisplayText(field.value) : "Select tenant"}
                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 rounded-none border-border" align="start">
                    <Command>
                      <CommandInput placeholder="Search tenant..." className="font-mono text-xs uppercase" />
                      <CommandList>
                        <CommandEmpty>No tenant found</CommandEmpty>
                        <CommandGroup>
                          {tenants.map((tenant) => (
                            <CommandItem
                              key={tenant.id}
                              value={`${getTenantName(tenant)} ${tenant.bpCode} ${tenant.email}`}
                              onSelect={() => {
                                form.setValue("tenantId", tenant.id)
                                setOpenTenantSelect(false)
                              }}
                              className="font-mono text-xs uppercase"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  field.value === tenant.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold">{getTenantName(tenant)}</span>
                                <span className="text-[10px] text-muted-foreground">{tenant.bpCode}</span>
                              </div>
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

      {/* Contract Duration */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            Contract Duration
          </span>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Start Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-10 rounded-none border-border font-mono text-sm",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">End Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-10 rounded-none border-border font-mono text-sm",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
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
        </div>
      </div>

      {/* Financial Terms */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <DollarSign className="h-3 w-3" />
            Financial Terms
          </span>
        </div>
        <div className="p-6">
          <FormField
            control={form.control}
            name="securityDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Security Deposit</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">₱</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="pl-8 h-9 rounded-none border-border font-mono text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
