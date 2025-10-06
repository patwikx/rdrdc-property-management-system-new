// components/tenant-form/BasicInfoSection.tsx
import { Building } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData } from "@/types/tenant-form"

interface BasicInfoSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
}

export function BasicInfoSection({ form, isLoading }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Building className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Basic Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="bpCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">BP Code *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., BP001234, TNT-2024-001" 
                  {...field}
                  disabled={isLoading}
                  className="h-10 font-mono"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Unique Business Partner identification code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">First Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="First name" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Tenant&apos;s first name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Last Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Last name" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Tenant&apos;s last name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}