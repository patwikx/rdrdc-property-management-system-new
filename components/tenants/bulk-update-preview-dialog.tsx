"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Check, X, AlertCircle } from "lucide-react"
import { generateChangePreview } from "@/lib/actions/tenant-bulk-update-actions"

interface FieldChange {
  fieldName: string
  oldValue: string
  newValue: string
}

interface TenantChange {
  tenantId: string
  tenantName: string
  bpCode: string
  fieldChanges: FieldChange[]
}

interface ChangePreview {
  totalTenants: number
  changes: TenantChange[]
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

interface BulkUpdatePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parsedData: TenantUpdateData[]
  onConfirm: () => void
  onCancel: () => void
  isApplying?: boolean
}

export function BulkUpdatePreviewDialog({
  open,
  onOpenChange,
  parsedData,
  onConfirm,
  onCancel,
  isApplying = false,
}: BulkUpdatePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<ChangePreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate preview when dialog opens
  useState(() => {
    if (open && parsedData.length > 0 && !preview) {
      loadPreview()
    }
  })

  const loadPreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await generateChangePreview(parsedData)

      if (!result.success || !result.data) {
        setError(result.error || "Failed to generate preview")
      } else {
        setPreview(result.data)
      }
    } catch (err) {
      console.error("Error generating preview:", err)
      setError("Failed to generate preview")
    } finally {
      setIsLoading(false)
    }
  }

  // Load preview when dialog opens
  if (open && parsedData.length > 0 && !preview && !isLoading && !error) {
    loadPreview()
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    setPreview(null)
    setError(null)
    onCancel()
  }

  const formatFieldName = (fieldName: string): string => {
    // Convert camelCase to Title Case with spaces
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] rounded-none border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">
            Preview Changes
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Review the changes before applying them to the database
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground font-mono">
                Generating preview...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="rounded-none bg-destructive/10 p-4 inline-block">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive mb-2">
                  Failed to Generate Preview
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {preview && !isLoading && !error && (
          <>
            {/* Summary */}
            <div className="border border-border rounded-none p-4 bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
                    Total Tenants to Update
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {preview.totalTenants}
                  </p>
                </div>
                <div className="rounded-none bg-primary/10 p-3">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Changes List */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pr-4">
                {preview.changes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground font-mono">
                      No changes detected. All values match current database records.
                    </p>
                  </div>
                ) : (
                  preview.changes.map((tenantChange) => (
                    <div
                      key={tenantChange.tenantId}
                      className="border border-border rounded-none bg-background"
                    >
                      {/* Tenant Header */}
                      <div className="p-4 border-b border-border bg-muted/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium font-mono">
                              {tenantChange.tenantName}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {tenantChange.bpCode}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-none border-primary/20 bg-primary/10 text-primary font-mono text-xs"
                          >
                            {tenantChange.fieldChanges.length} changes
                          </Badge>
                        </div>
                      </div>

                      {/* Field Changes */}
                      <div className="p-4 space-y-3">
                        {tenantChange.fieldChanges.map((fieldChange, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
                                {formatFieldName(fieldChange.fieldName)}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="bg-destructive/10 border border-destructive/20 rounded-none px-2 py-1">
                                    <p className="text-xs font-mono truncate text-destructive/80">
                                      {fieldChange.oldValue}
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-none px-2 py-1">
                                    <p className="text-xs font-mono truncate text-emerald-600">
                                      {fieldChange.newValue}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isApplying}
                className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={preview.changes.length === 0 || isApplying}
                className="rounded-none font-mono text-xs uppercase tracking-wider"
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Apply
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
