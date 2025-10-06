// components/tenant-form/ContactInfoSection.tsx
import { Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData } from "@/types/tenant-form"

interface ContactInfoSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
}

export function ContactInfoSection({ form, isLoading }: ContactInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Phone className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Contact Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Email Address *</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="email@example.com" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Primary contact email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Phone Number *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+63 XXX XXX XXXX" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Primary contact phone number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Emergency Contact Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Emergency contact name (optional)" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Name of emergency contact person
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyContactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Emergency Contact Phone</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Emergency contact phone (optional)" 
                  {...field}
                  disabled={isLoading}
                  className="h-10"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Phone number of emergency contact
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}