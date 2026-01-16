import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { MapPin, FileText, Info, Hash, Calendar, Building, Zap, Receipt, User, Clock } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertyType } from "@prisma/client"
import { UseFormReturn } from "react-hook-form"
import { PropertyFormData } from "@/lib/validations/property-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PropertyOverviewProps {
  property: PropertyWithDetails
  isEditing: boolean
  isSaving: boolean
  form: UseFormReturn<PropertyFormData>
  setActiveTab: (tab: string) => void
}

const propertyTypeOptions = [
  { value: PropertyType.COMMERCIAL, label: "Commercial" },
  { value: PropertyType.RESIDENTIAL, label: "Residential" },
  { value: PropertyType.MIXED, label: "Mixed Use" },
]

export function PropertyOverview({ 
  property, 
  isEditing, 
  isSaving, 
  form,
  setActiveTab 
}: PropertyOverviewProps) {
  return (
    <div className="space-y-8">
      {/* MAIN SPEC SHEET + EDIT FORM */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Info className="h-3 w-3" />
            Property Details
          </span>
        </div>
        
        <div className="p-0">
          {isEditing ? (
            <div className="p-6">
              <Form {...form}>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="propertyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Property Code</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Property Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Asset Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                          <FormControl>
                            <SelectTrigger className="rounded-none font-mono text-sm border-border focus:ring-0 focus:border-primary">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none border-border">
                            {propertyTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="font-mono text-xs uppercase">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Address</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leasableArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Leasable Area (sqm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSaving}
                            className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground tracking-widest">Target Units</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={isSaving}
                            className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* LEFT COLUMN: IDENTITY */}
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Official Name</label>
                  <div className="font-mono text-sm font-medium text-foreground">{property.propertyName}</div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Property Code</label>
                  <div className="font-mono text-sm text-foreground bg-muted/20 px-2 py-1 inline-block border border-border">
                    {property.propertyCode}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Primary Address</label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm leading-relaxed">{property.address}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: DETAILS */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Asset Type</label>
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{property.propertyType}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Registration Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-mono">{format(new Date(property.createdAt), 'yyyy-MM-dd')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed border-border">
                  <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Associated Records</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="flex flex-col bg-muted/10 p-2 border border-border">
                      <span className="text-xs font-bold font-mono">{property._count?.titles || 0}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">Titles</span>
                    </div>
                    <div className="flex flex-col bg-muted/10 p-2 border border-border">
                      <span className="text-xs font-bold font-mono">{property._count?.documents || 0}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">Docs</span>
                    </div>
                    <div className="flex flex-col bg-muted/10 p-2 border border-border">
                      <span className="text-xs font-bold font-mono">{property._count?.utilities || 0}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">Utils</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">System ID</label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Hash className="h-3 w-3" />
                    {property.id}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed border-border">
                  <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Last Updated</label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {format(new Date(property.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* METADATA & QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* METADATA */}
        <div className="border border-border bg-background">
          <div className="border-b border-border bg-muted/10 p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Metadata
            </span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-muted-foreground tracking-widest">Created By</span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <User className="h-3 w-3 text-muted-foreground" />
                {property.createdBy.firstName} {property.createdBy.lastName}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-border/50 pt-2">
              <span className="text-[10px] uppercase text-muted-foreground tracking-widest">Record Status</span>
              <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-widest border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="border border-border bg-background">
          <div className="border-b border-border bg-muted/10 p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Quick Actions
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="rounded-none h-8 text-[10px] font-mono uppercase tracking-wider justify-start border-border hover:bg-muted"
              onClick={() => setActiveTab('units')}
            >
              <Building className="h-3 w-3 mr-2 text-muted-foreground" />
              Manage Units
            </Button>
            <Button 
              variant="outline" 
              className="rounded-none h-8 text-[10px] font-mono uppercase tracking-wider justify-start border-border hover:bg-muted"
              onClick={() => setActiveTab('titles')}
            >
              <Receipt className="h-3 w-3 mr-2 text-muted-foreground" />
              View Titles
            </Button>
            <Button 
              variant="outline" 
              className="rounded-none h-8 text-[10px] font-mono uppercase tracking-wider justify-start border-border hover:bg-muted"
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="h-3 w-3 mr-2 text-muted-foreground" />
              Documents
            </Button>
            <Button 
              variant="outline" 
              className="rounded-none h-8 text-[10px] font-mono uppercase tracking-wider justify-start border-border hover:bg-muted"
              onClick={() => setActiveTab('utilities')}
            >
              <Zap className="h-3 w-3 mr-2 text-muted-foreground" />
              Utilities
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}