// components/tenant-form/TenantStatusSelector.tsx
import { User, Activity } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData, statusOptions } from "@/types/tenant-form"

interface TenantStatusSelectorProps {
  form: UseFormReturn<TenantFormData>
}

export function TenantStatusSelector({ form }: TenantStatusSelectorProps) {
  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border bg-muted/10 p-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Activity className="h-3 w-3" />
          Account Status
        </span>
      </div>
      
      <div className="p-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Initial Status *</FormLabel>
              <FormControl>
                <div className="grid gap-4 md:grid-cols-3">
                  {statusOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`relative cursor-pointer border p-4 transition-all group ${
                        field.value === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => field.onChange(option.value)}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`p-2 rounded-none ${option.color}`}>
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className={`font-mono text-xs font-bold tracking-wide ${field.value === option.value ? 'text-primary' : 'text-foreground'}`}>{option.label}</h3>
                          <p className="text-[9px] text-muted-foreground mt-1 font-mono uppercase">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      {field.value === option.value && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}