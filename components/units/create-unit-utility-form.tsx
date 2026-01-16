"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Save, Zap, Plug, Droplets } from "lucide-react"
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
    description: "POWER_GRID_CONNECTION",
    color: "bg-yellow-500",
    icon: Plug
  },
  { 
    value: 'WATER' as const, 
    label: "Water", 
    description: "MUNICIPAL_WATER_SUPPLY",
    color: "bg-blue-500",
    icon: Droplets
  },
  { 
    value: 'OTHERS' as const, 
    label: "Others", 
    description: "DATA_GAS_MISC",
    color: "bg-slate-500",
    icon: Zap
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
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Unit Utility Distinction */}
      <div className="border border-border p-4 bg-muted/5 flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <span className="text-sm font-bold uppercase tracking-widest text-foreground block">Space Utility Connection</span>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Register a specific meter or account for this unit.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Utility Type Selection */}
          <FormField
            control={form.control}
            name="utilityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Utility Type</FormLabel>
                <FormControl>
                  <div className="grid gap-3 md:grid-cols-3">
                    {utilityTypeOptions.map((option) => {
                      const Icon = option.icon
                      const isSelected = field.value === option.value
                      return (
                        <div
                          key={option.value}
                          className={`relative cursor-pointer border p-4 transition-all group ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => field.onChange(option.value)}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`p-2 rounded-none ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className={`font-mono text-xs font-bold tracking-wide ${isSelected ? 'text-primary' : 'text-foreground'}`}>{option.label}</h3>
                              <p className="text-[9px] text-muted-foreground mt-1 font-mono uppercase">
                                {option.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
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
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Account Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ENTER_ACCOUNT_NO" 
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
              name="meterNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Meter Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ENTER_METER_NO" 
                      {...field}
                      disabled={isLoading}
                      className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </FormControl>
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
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Billing Reference ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="OPTIONAL_REF_ID" 
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
              name="isActive"
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
                      Active Connection
                    </FormLabel>
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
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="ENTER_NOTES..."
                    {...field}
                    disabled={isLoading}
                    rows={3}
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
              {isLoading ? "SAVING..." : <><Save className="h-4 w-4 mr-2" /> CREATE_UTILITY</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}