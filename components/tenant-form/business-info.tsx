// components/tenant-form/BusinessInfoSection.tsx
import { Building, Globe, Landmark, Store, CheckIcon } from "lucide-react"
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
    <div className="space-y-6">
      {/* Basic Business Info */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="natureOfBusiness"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Nature of Business</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Retail, Wholesale, Services" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Type of business operations
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="yearsInBusiness"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Years in Business</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 5 years, Just started" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Number of years in operation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="positionInCompany"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Position in Company</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Owner, Manager" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Role in the business
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="officeAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Office/Business Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Business address" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Main office or business address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="authorizedSignatory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Authorized Signatory</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Name of authorized signatory" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Person authorized to sign documents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Online Presence */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Online Presence</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="facebookPage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Facebook Page</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Business Facebook page" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Business Facebook page name or URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Website</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://www.example.com" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Business website URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Space Type & Franchise */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Space & Franchise Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="isStore"
            render={({ field }) => (
              <div 
                className="flex flex-row items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (!isLoading) {
                    field.onChange(!field.value)
                  }
                }}
              >
                <div className="size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground data-[checked=true]:border-primary" data-checked={!!field.value}>
                  {field.value && <CheckIcon className="size-3.5 text-white" />}
                </div>
                <div className="space-y-1 leading-none">
                  <span className="text-sm font-medium">
                    Store
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Space is used as a store
                  </p>
                </div>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="isOffice"
            render={({ field }) => (
              <div 
                className="flex flex-row items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (!isLoading) {
                    field.onChange(!field.value)
                  }
                }}
              >
                <div className="size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground data-[checked=true]:border-primary" data-checked={!!field.value}>
                  {field.value && <CheckIcon className="size-3.5 text-white" />}
                </div>
                <div className="space-y-1 leading-none">
                  <span className="text-sm font-medium">
                    Office
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Space is used as an office
                  </p>
                </div>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="isFranchise"
            render={({ field }) => (
              <div 
                className="flex flex-row items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (!isLoading) {
                    field.onChange(!field.value)
                  }
                }}
              >
                <div className="size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground data-[checked=true]:border-primary" data-checked={!!field.value}>
                  {field.value && <CheckIcon className="size-3.5 text-white" />}
                </div>
                <div className="space-y-1 leading-none">
                  <span className="text-sm font-medium">
                    Franchise Business
                  </span>
                  <p className="text-xs text-muted-foreground">
                    This is a franchise business
                  </p>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Landmark className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Bank Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bankName1"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Primary Bank Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Bank name" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Primary bank name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankAddress1"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Primary Bank Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Bank branch address" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Primary bank branch address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bankName2"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Secondary Bank Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Bank name (optional)" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Secondary bank name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankAddress2"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Secondary Bank Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Bank branch address (optional)" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Secondary bank branch address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Other Business Declaration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Other Business Declaration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="otherBusinessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Other Business Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Name of other business (if any)" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Declare any other business owned
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="otherBusinessAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Other Business Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Address of other business" 
                    {...field}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Address of other business
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}