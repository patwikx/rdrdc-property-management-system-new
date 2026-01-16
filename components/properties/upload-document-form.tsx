"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DocumentSchema, DocumentFormData } from "@/lib/validations/document-schema"
import { createDocument } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { Save, FileText, Upload } from "lucide-react"
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
  { value: DocumentType.LEASE, label: "LEASE_AGREEMENT" },
  { value: DocumentType.CONTRACT, label: "CONTRACT" },
  { value: DocumentType.INVOICE, label: "INVOICE" },
  { value: DocumentType.MAINTENANCE, label: "MAINTENANCE" },
  { value: DocumentType.OTHER, label: "OTHER" },
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-3 p-4 border border-dashed border-border bg-muted/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                <Upload className="h-3 w-3" />
                Upload File
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">MAX_SIZE: 16MB</span>
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
              <div className="border border-border p-3 bg-background">
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

          {/* Document Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Document Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.G. LEASE AGREEMENT 2024" 
                      {...field}
                      disabled={isLoading}
                      className="rounded-none font-mono text-sm border-border focus-visible:ring-0 focus-visible:border-primary h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="rounded-none border-border h-10 font-mono text-sm">
                        <SelectValue placeholder="SELECT_TYPE" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none border-border">
                      {documentTypeOptions.map((option) => (
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
          </div>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Description / Notes</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="ADDITIONAL_CONTEXT..."
                    {...field}
                    disabled={isLoading}
                    rows={3}
                    className="flex w-full rounded-none border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Context Banner */}
          {(propertyId || unitId || tenantId) && (
            <div className="bg-blue-500/5 border border-blue-500/20 p-3">
              <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Context: {propertyId ? "PROPERTY_RECORD" : ""} {unitId ? "UNIT_RECORD" : ""} {tenantId ? "TENANT_RECORD" : ""}
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-none h-10 font-mono text-xs uppercase tracking-wide border-border">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading || !uploadedFile} className="min-w-[140px] rounded-none h-10 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? "UPLOADING..." : <><Save className="h-4 w-4 mr-2" /> SAVE_DOCUMENT</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}