// components/tenant-form/TenantStatusSelector.tsx
import { User } from "lucide-react"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData, statusOptions } from "@/types/tenant-form"

interface TenantStatusSelectorProps {
  form: UseFormReturn<TenantFormData>
}

export function TenantStatusSelector({ form }: TenantStatusSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <User className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Tenant Status</h3>
      </div>
      
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Initial Status *</FormLabel>
            <FormControl>
              <div className="grid gap-4 md:grid-cols-3">
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                      field.value === option.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => field.onChange(option.value)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`rounded-lg p-2 ${option.color}`}>
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{option.label}</h3>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              Choose the initial status for this tenant
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}