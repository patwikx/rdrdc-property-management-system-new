// components/tenant-form/BasicInfoSection.tsx
import { Building, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData } from "@/types/tenant-form"

interface BasicInfoSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
}

export function BasicInfoSection({ form, isLoading }: BasicInfoSectionProps) {
  return (
    <div className="space-y-8">
      {/* Basic Identification */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Building className="h-3 w-3" />
            Identity
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="bpCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">BP Code *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. BP-001" 
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">First Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. John" 
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Last Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Doe" 
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

      {/* Personal Information */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <User className="h-3 w-3" />
            Personal Details
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="homeAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Home Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. 123 Main St, City" 
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
            name="facebookName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Facebook Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. johndoe" 
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