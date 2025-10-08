"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DocumentSchema, DocumentFormData } from "@/lib/validations/document-schema"
import { createDocument } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { Save, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { FileUpload, UploadedFileDisplay } from "@/components/file-upload"

interface UploadDocumentFormProps {
  propertyId?: string
  unitId?: string
  tenantId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const documentTypeOptions = [
  { 
    value: DocumentType.LEASE, 
    label: "Lease Agreement", 
    description: "Rental contracts and lease documents",
    color: "bg-blue-600 text-white border-blue-600"
  },
  { 
    value: DocumentType.CONTRACT, 
    label: "Contract", 
    description: "Service contracts and agreements",
    color: "bg-emerald-600 text-white border-emerald-600"
  },
  { 
    value: DocumentType.INVOICE, 
    label: "Invoice", 
    description: "Bills, receipts, and invoices",
    color: "bg-amber-600 text-white border-amber-600"
  },
  { 
    value: DocumentType.MAINTENANCE, 
    label: "Maintenance", 
    description: "Maintenance records and reports",
    color: "bg-orange-600 text-white border-orange-600"
  },
  { 
    value: DocumentType.OTHER, 
    label: "Other", 
    description: "Miscellaneous documents",
    color: "bg-slate-600 text-white border-slate-600"
  },
]

export function UploadDocumentForm({ 
  propertyId, 
  unitId, 
  tenantId, 
  onSuccess, 
  onCancel 
}: UploadDocumentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string
    name: string
    fileUrl: string
  } | null>(null)

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(DocumentSchema),
    defaultValues: {
      name: "",
      description: "",
      documentType: DocumentType.OTHER,
      fileUrl: "",
      // Use undefined instead of empty string for optional foreign keys
      propertyId: propertyId || undefined,
      unitId: unitId || undefined,
      tenantId: tenantId || undefined,
    },
  })

  const handleFileUpload = (result: { fileName: string; name: string; fileUrl: string }) => {
    setUploadedFile(result)
    form.setValue('fileUrl', result.fileUrl)
    form.setValue('name', result.name)
  }

  const handleFileError = (error: string) => {
    toast.error(error)
  }

  const removeFile = () => {
    setUploadedFile(null)
    form.setValue('fileUrl', '')
  }

  async function onSubmit(data: DocumentFormData) {
    if (!uploadedFile) {
      toast.error("Please upload a file first")
      return
    }

    setIsLoading(true)
    
    try {
      // Clean up data - convert empty strings to undefined
      const cleanData: DocumentFormData = {
        ...data,
        description: data.description || undefined,
        propertyId: data.propertyId || undefined,
        unitId: data.unitId || undefined,
        tenantId: data.tenantId || undefined,
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
        toast.success("Document uploaded successfully")
        form.reset()
        setUploadedFile(null)
        onSuccess?.()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* File Upload */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Document File</label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload PDF, Word, Excel, or image files (max 16MB)
              </p>
            </div>
            
            {!uploadedFile ? (
              <FileUpload
                onUploadComplete={handleFileUpload}
                onUploadError={handleFileError}
                disabled={isLoading}
                maxSize={16}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                multiple={false}
              />
            ) : (
              <div className="border rounded-lg p-3 bg-muted/30">
                <UploadedFileDisplay
                  fileName={uploadedFile.fileName}
                  name={uploadedFile.name}
                  fileUrl={uploadedFile.fileUrl}
                  onRemove={removeFile}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Lease Agreement - Unit 101" 
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
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mt-[-12px]">Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="mt-[-12px]">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Additional details about this document..."
                    {...field}
                    disabled={isLoading}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormControl>
                <FormDescription>
                  Optional description or notes about the document
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show association info if provided */}
          {(propertyId || unitId || tenantId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Document Association</p>
              <p className="text-sm text-blue-700">
                This document will be linked to:
                {propertyId && " Property"}
                {unitId && " Unit"}
                {tenantId && " Tenant"}
              </p>
            </div>
          )}

          {/* Document Type Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-foreground">Document Type Preview</h4>
            <div className="flex items-center space-x-2 mb-3">
              {documentTypeOptions.map((option) => (
                <Badge 
                  key={option.value}
                  className={`${option.color} font-medium shadow-sm ${
                    form.watch('documentType') === option.value 
                      ? 'ring-2 ring-primary ring-offset-2 opacity-100 scale-105 transition-all duration-200' 
                      : 'opacity-60 hover:opacity-80 transition-opacity duration-200'
                  }`}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-foreground/80 font-medium">
              {documentTypeOptions.find(opt => opt.value === form.watch('documentType'))?.description}
            </p>
          </div>

          {/* Upload Status */}
          {uploadedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">File uploaded successfully</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Ready to save document information
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading || !uploadedFile}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Document
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