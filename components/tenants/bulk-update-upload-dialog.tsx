"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUp, Upload, AlertCircle, X } from "lucide-react"
import { validateTenantCSV } from "@/lib/actions/tenant-bulk-update-actions"

interface ValidationError {
  type: string
  message: string
  row?: number
  column?: string
  value?: string | number | boolean
}

interface TenantUpdateData {
  id: string
  updates: Partial<{
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
    firstName: string
    lastName: string
    email: string
    phone: string
    homeAddress: string
    facebookName: string
    emergencyContactName: string
    emergencyContactPhone: string
    company: string
    businessName: string
    natureOfBusiness: string
    yearsInBusiness: string
    positionInCompany: string
    officeAddress: string
    facebookPage: string
    website: string
    authorizedSignatory: string
    isStore: boolean
    isOffice: boolean
    isFranchise: boolean
    bankName1: string
    bankAddress1: string
    bankName2: string
    bankAddress2: string
    otherBusinessName: string
    otherBusinessAddress: string
  }>
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  parsedData: TenantUpdateData[]
}

interface BulkUpdateUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkUpdateUploadDialog({
  open,
  onOpenChange,
}: BulkUpdateUploadDialogProps) {
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setValidationErrors([{
          type: 'INVALID_FORMAT',
          message: 'Please select a CSV file'
        }])
        return
      }

      setSelectedFile(file)
      setValidationErrors([])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsValidating(true)
    setValidationErrors([])

    try {
      // Read file content
      const content = await selectedFile.text()

      // Validate CSV
      const result: ValidationResult = await validateTenantCSV(content)

      if (!result.isValid) {
        setValidationErrors(result.errors)
      } else {
        // Validation successful, store data in session storage and navigate to preview page
        sessionStorage.setItem('bulkUpdateData', JSON.stringify(result.parsedData))
        
        // Reset state
        setSelectedFile(null)
        setValidationErrors([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        
        // Close dialog
        onOpenChange(false)
        
        // Navigate to preview page
        router.push('/tenants/bulk-update/preview')
      }
    } catch (error) {
      console.error("Error validating CSV:", error)
      setValidationErrors([{
        type: 'INVALID_FORMAT',
        message: 'Failed to read or validate CSV file'
      }])
    } finally {
      setIsValidating(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onOpenChange(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">
            Import Tenant Updates
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Upload a CSV file with tenant updates to preview and apply changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <Label htmlFor="csv-file" className="font-mono text-xs uppercase tracking-wider">
              CSV File
            </Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-none p-8 text-center hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-none bg-muted/50 p-4">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      CSV files only
                    </p>
                  </div>
                  <Input
                    id="csv-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-none p-4 bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-none bg-primary/10 p-2">
                      <FileUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-mono uppercase tracking-wider">
                  Validation Errors ({validationErrors.length})
                </span>
              </div>
              {validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive" className="rounded-none border-destructive/50">
                  <AlertDescription className="text-xs font-mono">
                    <div className="space-y-1">
                      <p className="font-bold">{error.message}</p>
                      {error.row && (
                        <p className="text-destructive/80">
                          Row: {error.row}
                          {error.column && ` | Column: ${error.column}`}
                          {error.value && ` | Value: "${error.value}"`}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              <p className="text-xs text-muted-foreground font-mono">
                Please correct the errors above and upload the file again.
              </p>
            </div>
          )}

          {/* Instructions */}
          {validationErrors.length === 0 && (
            <div className="bg-muted/30 border border-border rounded-none p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold mb-2">
                Instructions
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                <li>• Upload the CSV file you downloaded and modified</li>
                <li>• Ensure all required fields are filled</li>
                <li>• Do not modify the ID or BP Code columns</li>
                <li>• Maximum 1000 tenants per upload</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isValidating}
              className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isValidating}
              className="rounded-none font-mono text-xs uppercase tracking-wider"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Validate & Preview
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
