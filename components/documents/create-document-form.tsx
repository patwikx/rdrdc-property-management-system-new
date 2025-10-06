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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DocumentSchema, DocumentFormData } from "@/lib/validations/document-schema"
import { createDocument } from "@/lib/actions/document-actions"
import { Save, X, FileText, Building, Home, User, Upload, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { DocumentType } from "@prisma/client"
import { FileUpload, UploadedFileDisplay } from "@/components/file-upload"
import { cn } from "@/lib/utils"

const documentTypeOptions = [
  { 
    value: 'LEASE' as const, 
    label: "Lease Agreement", 
    description: "Rental lease contracts and agreements",
    color: "bg-blue-600",
    icon: FileText
  },
  { 
    value: 'CONTRACT' as const, 
    label: "Contract", 
    description: "Service contracts and legal documents",
    color: "bg-green-600",
    icon: FileText
  },
  { 
    value: 'INVOICE' as const, 
    label: "Invoice", 
    description: "Billing and payment invoices",
    color: "bg-yellow-600",
    icon: FileText
  },
  { 
    value: 'MAINTENANCE' as const, 
    label: "Maintenance", 
    description: "Maintenance reports and records",
    color: "bg-orange-600",
    icon: FileText
  },
  { 
    value: 'OTHER' as const, 
    label: "Other", 
    description: "Miscellaneous documents",
    color: "bg-gray-600",
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
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Document Type Selection */}
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <FormControl>
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {documentTypeOptions.map((option) => {
                      const Icon = option.icon
                      return (
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
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{option.label}</h3>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
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
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Document Name</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter document name" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Descriptive name for the document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about the document
                  </FormDescription>
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
                <FormLabel className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Document File</span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {!uploadedFileUrl ? (
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
                    ) : (
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
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload the document file (PDF, DOC, DOCX, etc.)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Associations with Combobox */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Property Combobox */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Property (Optional)</span>
                  </FormLabel>
                  <Popover open={openProperty} onOpenChange={setOpenProperty}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProperty}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value && field.value !== "no-property"
                            ? properties.find((property) => property.id === field.value)
                                ? `${properties.find((property) => property.id === field.value)?.propertyCode} - ${properties.find((property) => property.id === field.value)?.propertyName}`
                                : "Select property"
                            : "Select property"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search property..." />
                        <CommandList>
                          <CommandEmpty>No property found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="no-property"
                              onSelect={() => {
                                form.setValue("propertyId", "")
                                setOpenProperty(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
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
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
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
                  <FormDescription>
                    Associate with a property
                  </FormDescription>
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
                  <FormLabel className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Space (Optional)</span>
                  </FormLabel>
                  <Popover open={openUnit} onOpenChange={setOpenUnit}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openUnit}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value && field.value !== "no-spaces"
                            ? units.find((unit) => unit.id === field.value)
                                ? `${units.find((unit) => unit.id === field.value)?.unitNumber} - ${units.find((unit) => unit.id === field.value)?.property.propertyName}`
                                : "Select unit"
                            : "Select unit"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search space..." />
                        <CommandList>
                          <CommandEmpty>No space found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="no-spaces"
                              onSelect={() => {
                                form.setValue("unitId", "")
                                setOpenUnit(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
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
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
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
                  <FormDescription>
                    Associate with a specific space
                  </FormDescription>
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
                  <FormLabel className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Tenant (Optional)</span>
                  </FormLabel>
                  <Popover open={openTenant} onOpenChange={setOpenTenant}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTenant}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value && field.value !== "no-tenant"
                            ? tenants.find((tenant) => tenant.id === field.value)
                                ? `${tenants.find((tenant) => tenant.id === field.value)?.bpCode} - ${tenants.find((tenant) => tenant.id === field.value)?.firstName} ${tenants.find((tenant) => tenant.id === field.value)?.lastName}`
                                : "Select tenant"
                            : "Select tenant"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search tenant..." />
                        <CommandList>
                          <CommandEmpty>No tenant found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="no-tenant"
                              onSelect={() => {
                                form.setValue("tenantId", "")
                                setOpenTenant(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
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
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
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
                  <FormDescription>
                    Associate with a tenant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Document Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Document Preview</h4>
            <div className="flex items-center space-x-2 mb-2">
              {selectedOption && (
                <Badge className={selectedOption.color}>
                  {selectedOption.label}
                </Badge>
              )}
              {selectedProperty && (
                <Badge variant="outline">
                  <Building className="h-3 w-3 mr-1" />
                  {selectedProperty.propertyCode}
                </Badge>
              )}
              {selectedUnit && (
                <Badge variant="outline">
                  <Home className="h-3 w-3 mr-1" />
                  {selectedUnit.unitNumber}
                </Badge>
              )}
              {selectedTenant && (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  {selectedTenant.bpCode}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {form.watch('name') || 'Document name'} • {selectedOption?.label || 'Document type'}
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading || !uploadedFileUrl}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Document
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}