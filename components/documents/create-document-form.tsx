"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DocumentSchema, DocumentFormData } from "@/lib/validations/document-schema"
import { createDocument } from "@/lib/actions/document-actions"
import { Save, FileText, Building, Home, User, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { DocumentType } from "@prisma/client"
import { FileUpload, UploadedFileDisplay } from "@/components/file-upload"
import { cn } from "@/lib/utils"

const documentTypeOptions = [
  { 
    value: 'LEASE' as const, 
    label: "Lease Agreement", 
    description: "RENTAL CONTRACTS",
    color: "bg-blue-600/10 text-blue-600 border-blue-600/20",
    icon: FileText
  },
  { 
    value: 'CONTRACT' as const, 
    label: "Contract", 
    description: "SERVICE AGREEMENTS",
    color: "bg-green-600/10 text-green-600 border-green-600/20",
    icon: FileText
  },
  { 
    value: 'INVOICE' as const, 
    label: "Invoice", 
    description: "BILLING RECORDS",
    color: "bg-yellow-600/10 text-yellow-600 border-yellow-600/20",
    icon: FileText
  },
  { 
    value: 'MAINTENANCE' as const, 
    label: "Maintenance", 
    description: "WORK ORDERS",
    color: "bg-orange-600/10 text-orange-600 border-orange-600/20",
    icon: FileText
  },
  { 
    value: 'OTHER' as const, 
    label: "Other", 
    description: "MISCELLANEOUS",
    color: "bg-muted text-muted-foreground border-border",
    icon: FileText
  },
]

interface Property {
  id: string
  propertyName: string
  propertyCode: string
}

interface Unit {
  id: string
  unitNumber: string
  property: {
    propertyName: string
  }
}

interface Tenant {
  id: string
  firstName: string | null
  lastName: string | null
  bpCode: string
  company: string
}

interface CreateDocumentFormProps {
  properties?: Property[]
  units?: Unit[]
  tenants?: Tenant[]
  defaultPropertyId?: string
  defaultUnitId?: string
  defaultTenantId?: string
  defaultType?: DocumentType
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateDocumentForm({ 
  properties = [],
  units = [],
  tenants = [],
  defaultPropertyId,
  defaultUnitId,
  defaultTenantId,
  defaultType,
  onSuccess, 
  onCancel 
}: CreateDocumentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("")
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [openProperty, setOpenProperty] = useState(false)
  const [openUnit, setOpenUnit] = useState(false)
  const [openTenant, setOpenTenant] = useState(false)

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(DocumentSchema),
    defaultValues: {
      name: "",
      description: "",
      documentType: defaultType || 'OTHER',
      fileUrl: "",
      propertyId: defaultPropertyId || "",
      unitId: defaultUnitId || "",
      tenantId: defaultTenantId || "",
    },
  })

  // Update fileUrl when file is uploaded
  useEffect(() => {
    if (uploadedFileUrl) {
      form.setValue('fileUrl', uploadedFileUrl)
    }
  }, [uploadedFileUrl, form])

  async function onSubmit(data: DocumentFormData) {
    setIsLoading(true)
    
    try {
      // Clean up empty string values
      const cleanData = {
        ...data,
        propertyId: data.propertyId || undefined,
        unitId: data.unitId || undefined,
        tenantId: data.tenantId || undefined,
        description: data.description || undefined,
      }

      const result = await createDocument(cleanData)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && Array.isArray(error)) {
              form.setError(field as keyof DocumentFormData, {
                message: error[0],
              })
            }
          })
        }
      } else {
        toast.success("Document created successfully")
        form.reset()
        setUploadedFileUrl("")
        setUploadedFileName("")
        onSuccess?.()
      }
    } catch (error) {
      console.error("Error creating document:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDocumentType = form.watch('documentType')
  const selectedOption = documentTypeOptions.find(opt => opt.value === selectedDocumentType)
  const selectedProperty = properties.find(p => p.id === form.watch('propertyId'))
  const selectedUnit = units.find(u => u.id === form.watch('unitId'))
  const selectedTenant = tenants.find(t => t.id === form.watch('tenantId'))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Document Type Selection */}
        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Document Category</FormLabel>
              <FormControl>
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {documentTypeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = field.value === option.value
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "relative cursor-pointer border p-3 transition-all hover:bg-muted/5 group",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                        onClick={() => field.onChange(option.value)}
                      >
                        <div className="flex flex-col items-start space-y-2">
                          <div className={cn("p-1.5 rounded-none border", option.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <h3 className={cn("font-bold text-xs uppercase tracking-wide", isSelected ? "text-primary" : "text-foreground")}>{option.label}</h3>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Document Name and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Document Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ENTER DOCUMENT NAME" 
                    {...field}
                    disabled={isLoading}
                    className="rounded-none border-border font-mono text-xs uppercase h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Description / Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="OPTIONAL DETAILS..."
                    {...field}
                    disabled={isLoading}
                    rows={1}
                    className="rounded-none border-border font-mono text-xs uppercase min-h-[36px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* File Upload */}
        <FormField
          control={form.control}
          name="fileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">File Attachment</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {!uploadedFileUrl ? (
                    <div className="border border-dashed border-border p-6 hover:bg-muted/5 transition-colors text-center">
                      <FileUpload
                        onUploadComplete={(result) => {
                          setUploadedFileUrl(result.fileUrl)
                          setUploadedFileName(result.name)
                          field.onChange(result.fileUrl)
                          // Auto-fill document name if empty
                          if (!form.getValues('name')) {
                            form.setValue('name', result.name)
                          }
                        }}
                        onUploadError={(error: string) => {
                          toast.error(`Upload failed: ${error}`)
                        }}
                        disabled={isLoading}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                        maxSize={16}
                      />
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mt-2">
                        Max 16MB • PDF, Images, Office Docs
                      </p>
                    </div>
                  ) : (
                    <div className="border border-border p-4 bg-muted/5 flex items-center justify-between">
                      <UploadedFileDisplay
                        fileName={uploadedFileName}
                        name={uploadedFileName}
                        fileUrl={uploadedFileUrl}
                        onRemove={() => {
                          setUploadedFileUrl("")
                          setUploadedFileName("")
                          field.onChange("")
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Associations with Combobox */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Associations (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Property Combobox */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Building className="h-3 w-3" /> Property
                  </FormLabel>
                  <Popover open={openProperty} onOpenChange={setOpenProperty}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProperty}
                          className={cn(
                            "justify-between rounded-none border-border font-mono text-xs uppercase h-9",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value && field.value !== "no-property"
                            ? properties.find((property) => property.id === field.value)
                                ? `${properties.find((property) => property.id === field.value)?.propertyCode}`
                                : "Select property"
                            : "SELECT PROPERTY"}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-none border-border">
                      <Command>
                        <CommandInput placeholder="SEARCH PROPERTY..." className="font-mono text-xs uppercase" />
                        <CommandList>
                          <CommandEmpty className="font-mono text-xs uppercase p-2">No property found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="no-property"
                              onSelect={() => {
                                form.setValue("propertyId", "")
                                setOpenProperty(false)
                              }}
                              className="font-mono text-xs uppercase"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  !field.value || field.value === "no-property" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              No property
                            </CommandItem>
                            {properties.map((property) => (
                              <CommandItem
                                key={property.id}
                                value={`${property.propertyCode}-${property.propertyName}`}
                                onSelect={() => {
                                  form.setValue("propertyId", property.id)
                                  setOpenProperty(false)
                                }}
                                className="font-mono text-xs uppercase"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    field.value === property.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {property.propertyCode} - {property.propertyName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Combobox */}
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Home className="h-3 w-3" /> Space / Unit
                  </FormLabel>
                  <Popover open={openUnit} onOpenChange={setOpenUnit}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openUnit}
                          className={cn(
                            "justify-between rounded-none border-border font-mono text-xs uppercase h-9",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value && field.value !== "no-spaces"
                            ? units.find((unit) => unit.id === field.value)
                                ? `${units.find((unit) => unit.id === field.value)?.unitNumber}`
                                : "Select unit"
                            : "SELECT UNIT"}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-none border-border">
                      <Command>
                        <CommandInput placeholder="SEARCH SPACE..." className="font-mono text-xs uppercase" />
                        <CommandList>
                          <CommandEmpty className="font-mono text-xs uppercase p-2">No space found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="no-spaces"
                              onSelect={() => {
                                form.setValue("unitId", "")
                                setOpenUnit(false)
                              }}
                              className="font-mono text-xs uppercase"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  !field.value || field.value === "no-spaces" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              No space
                            </CommandItem>
                            {units.map((unit) => (
                              <CommandItem
                                key={unit.id}
                                value={`${unit.unitNumber}-${unit.property.propertyName}`}
                                onSelect={() => {
                                  form.setValue("unitId", unit.id)
                                  setOpenUnit(false)
                                }}
                                className="font-mono text-xs uppercase"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    field.value === unit.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {unit.unitNumber} - {unit.property.propertyName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tenant Combobox */}
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" /> Tenant
                  </FormLabel>
                  <Popover open={openTenant} onOpenChange={setOpenTenant}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTenant}
                          className={cn(
                            "justify-between rounded-none border-border font-mono text-xs uppercase h-9",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value && field.value !== "no-tenant"
                            ? tenants.find((tenant) => tenant.id === field.value)
                                ? `${tenants.find((tenant) => tenant.id === field.value)?.bpCode}`
                                : "Select tenant"
                            : "SELECT TENANT"}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-none border-border">
                      <Command>
                        <CommandInput placeholder="SEARCH TENANT..." className="font-mono text-xs uppercase" />
                        <CommandList>
                          <CommandEmpty className="font-mono text-xs uppercase p-2">No tenant found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="no-tenant"
                              onSelect={() => {
                                form.setValue("tenantId", "")
                                setOpenTenant(false)
                              }}
                              className="font-mono text-xs uppercase"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  !field.value || field.value === "no-tenant" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              No tenant
                            </CommandItem>
                            {tenants.map((tenant) => (
                              <CommandItem
                                key={tenant.id}
                                value={`${tenant.bpCode}-${tenant.firstName}-${tenant.lastName}`}
                                onSelect={() => {
                                  form.setValue("tenantId", tenant.id)
                                  setOpenTenant(false)
                                }}
                                className="font-mono text-xs uppercase"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    field.value === tenant.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {tenant.bpCode} - {tenant.firstName} {tenant.lastName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Document Preview */}
        <div className="border border-dashed border-border p-4 bg-muted/5">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">Live Preview</h4>
          <div className="flex items-center gap-3">
            <div className="p-2 border border-border bg-background">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <span className="font-bold text-sm uppercase truncate">{form.watch('name') || 'DOCUMENT TITLE'}</span>
                 {selectedOption && (
                   <Badge variant="outline" className={cn("rounded-none text-[9px] uppercase tracking-wider font-mono border", selectedOption.color)}>
                     {selectedOption.label}
                   </Badge>
                 )}
               </div>
               <div className="flex items-center gap-2">
                 {selectedProperty && (
                   <span className="text-[10px] font-mono text-muted-foreground uppercase border border-border px-1">
                     PROP: {selectedProperty.propertyCode}
                   </span>
                 )}
                 {selectedUnit && (
                   <span className="text-[10px] font-mono text-muted-foreground uppercase border border-border px-1">
                     UNIT: {selectedUnit.unitNumber}
                   </span>
                 )}
                 {selectedTenant && (
                   <span className="text-[10px] font-mono text-muted-foreground uppercase border border-border px-1">
                     TENANT: {selectedTenant.bpCode}
                   </span>
                 )}
                 {(!selectedProperty && !selectedUnit && !selectedTenant) && (
                   <span className="text-[10px] font-mono text-muted-foreground uppercase">
                     NO ASSOCIATIONS SELECTED
                   </span>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          {onCancel && (
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel} 
              disabled={isLoading}
              className="rounded-none h-9 text-xs uppercase font-bold tracking-wider border-border"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading || !uploadedFileUrl}
            className="rounded-none h-9 text-xs uppercase font-bold tracking-wider"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Upload Record
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}