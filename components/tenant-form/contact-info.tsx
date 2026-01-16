// components/tenant-form/ContactInfoSection.tsx
import { Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData } from "@/types/tenant-form"

interface ContactInfoSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
}

export function ContactInfoSection({ form, isLoading }: ContactInfoSectionProps) {
  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border bg-muted/10 p-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Phone className="h-3 w-3" />
          Contact Information
        </span>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="e.g. email@example.com" 
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Phone Number *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. +63 912 345 6789" 
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed border-border">
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Emergency Contact Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Jane Doe" 
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
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Emergency Contact Phone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. +63 912 345 6789" 
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
      </div>
    </div>
  )
}