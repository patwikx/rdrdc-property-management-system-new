// components/tenant-form/BusinessInfoSection.tsx
import { Building } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData } from "@/types/tenant-form"

interface BusinessInfoSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
}

export function BusinessInfoSection({ form, isLoading }: BusinessInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Building className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Business Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Company *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Legal company name" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Legal company name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Business Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Business or trade name" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Business or trade name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}