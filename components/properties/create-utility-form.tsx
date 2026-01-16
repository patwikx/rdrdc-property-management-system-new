"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { PropertyUtilitySchema, PropertyUtilityFormData } from "@/lib/validations/utility-schema"
import { createPropertyUtility } from "@/lib/actions/utility-actions"
import { UtilityType } from "@prisma/client"
import { Zap, Save, Building, Hash, Activity, X } from "lucide-react"
import { toast } from "sonner"

interface CreateUtilityFormProps {
  propertyId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const utilityTypeOptions = [
  { 
    value: UtilityType.ELECTRICITY, 
    label: "ELECTRICITY", 
    description: "POWER_GRID_CONNECTION",
    color: "bg-yellow-500",
    icon: Zap
  },
  { 
    value: UtilityType.WATER, 
    label: "WATER", 
    description: "MUNICIPAL_WATER_SUPPLY",
    color: "bg-blue-500",
    icon: Activity
  },
  { 
    value: UtilityType.OTHERS, 
    label: "OTHERS", 
    description: "DATA_GAS_MISC",
    color: "bg-slate-500",
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
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
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

            {/* Provider and Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      Service Provider
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.G. MERALCO" 
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
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      Account Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ACCOUNT_ID" 
                        {...field}
                        disabled={isLoading}
                        className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                      />
                    </FormControl>
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
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Meter Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="METER_ID" 
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 border border-border px-4 h-10 bg-muted/5 mt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        className="rounded-none h-4 w-4 border-muted-foreground"
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

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-none h-10 font-mono text-xs uppercase tracking-wide border-border">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="min-w-[140px] rounded-none h-10 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? "SAVING..." : <><Save className="h-4 w-4 mr-2" /> SAVE_UTILITY</>}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  )
}