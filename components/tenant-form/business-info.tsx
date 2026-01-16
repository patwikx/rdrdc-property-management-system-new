// components/tenant-form/BusinessInfoSection.tsx
import { Building, Globe, Landmark, Store, CheckIcon, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData } from "@/types/tenant-form"

interface BusinessInfoSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
}

export function BusinessInfoSection({ form, isLoading }: BusinessInfoSectionProps) {
  return (
    <div className="space-y-8">
      {/* Basic Business Info */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Building className="h-3 w-3" />
            Business Details
          </span>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Company Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Acme Corp Inc." 
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
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Trade Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Acme Solutions" 
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="natureOfBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Nature of Business</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Retail" 
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
              name="yearsInBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Years Operational</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 5" 
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
              name="positionInCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Role / Position</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. CEO" 
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="officeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Office Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 123 Business Rd" 
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
              name="authorizedSignatory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Authorized Signatory</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. John Doe" 
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

      {/* Online Presence */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Globe className="h-3 w-3" />
            Digital Presence
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="facebookPage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Facebook Page</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. facebook.com/acme" 
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
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Website</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. acme.com" 
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

      {/* Space Type & Franchise */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Store className="h-3 w-3" />
            Operations
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="isStore"
            render={({ field }) => (
              <FormItem>
                <div 
                  className={`flex flex-row items-start space-x-3 border p-4 cursor-pointer transition-all ${field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => {
                    if (!isLoading) field.onChange(!field.value)
                  }}
                >
                  <div className={`size-4 shrink-0 border flex items-center justify-center rounded-none ${field.value ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {field.value && <CheckIcon className="size-3" />}
                  </div>
                  <div className="space-y-1 leading-none">
                    <span className="text-xs font-bold uppercase tracking-wide">Store</span>
                    <p className="text-[10px] font-mono text-muted-foreground">Retail Space</p>
                  </div>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isOffice"
            render={({ field }) => (
              <FormItem>
                <div 
                  className={`flex flex-row items-start space-x-3 border p-4 cursor-pointer transition-all ${field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => {
                    if (!isLoading) field.onChange(!field.value)
                  }}
                >
                  <div className={`size-4 shrink-0 border flex items-center justify-center rounded-none ${field.value ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {field.value && <CheckIcon className="size-3" />}
                  </div>
                  <div className="space-y-1 leading-none">
                    <span className="text-xs font-bold uppercase tracking-wide">Office</span>
                    <p className="text-[10px] font-mono text-muted-foreground">Corporate Space</p>
                  </div>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isFranchise"
            render={({ field }) => (
              <FormItem>
                <div 
                  className={`flex flex-row items-start space-x-3 border p-4 cursor-pointer transition-all ${field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => {
                    if (!isLoading) field.onChange(!field.value)
                  }}
                >
                  <div className={`size-4 shrink-0 border flex items-center justify-center rounded-none ${field.value ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {field.value && <CheckIcon className="size-3" />}
                  </div>
                  <div className="space-y-1 leading-none">
                    <span className="text-xs font-bold uppercase tracking-wide">Franchise</span>
                    <p className="text-[10px] font-mono text-muted-foreground">Franchise Model</p>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Landmark className="h-3 w-3" />
            Financial Info
          </span>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bankName1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Primary Bank</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. BDO" 
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
              name="bankAddress1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Primary Branch</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Makati Branch" 
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
              name="bankName2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Secondary Bank</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. BPI (Optional)" 
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
              name="bankAddress2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Secondary Branch</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Ortigas Branch (Optional)" 
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

      {/* Other Business Declaration */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Briefcase className="h-3 w-3" />
            Affiliated Business
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="otherBusinessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Affiliate Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Sister Company" 
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
            name="otherBusinessAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Affiliate Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Address" 
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