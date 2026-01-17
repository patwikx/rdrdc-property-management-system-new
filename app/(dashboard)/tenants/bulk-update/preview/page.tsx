"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight, Check, X, AlertCircle, ArrowLeft } from "lucide-react"
import { generateChangePreview, applyBulkUpdates } from "@/lib/actions/tenant-bulk-update-actions"
import { useSession } from "next-auth/react"
import { toast } from "sonner"


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

export default function BulkUpdatePreviewPage() {
  const router = useRouter()
  // const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [isLoading, setIsLoading] = useState(true)
  const [preview, setPreview] = useState<ChangePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [parsedData, setParsedData] = useState<TenantUpdateData[]>([])

  useEffect(() => {
    // Load parsed data from session storage
    const storedData = sessionStorage.getItem('bulkUpdateData')
    if (!storedData) {
      toast.error("No data found. Please upload a CSV file first.")
      router.push('/tenants')
      return
    }

    try {
      const data = JSON.parse(storedData) as TenantUpdateData[]
      setParsedData(data)
      loadPreview(data)
    } catch (err) {
      console.error("Error loading data:", err)
      toast.error("Failed to load preview data")
      router.push('/tenants')
    }
  }, [router])

  const loadPreview = async (data: TenantUpdateData[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await generateChangePreview(data)

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

  const handleConfirm = async () => {
    if (!session?.user?.id) {
      toast.error("User session not found. Please log in again.")
      return
    }

    setIsApplying(true)

    try {
      const clientInfo = {
        ipAddress: undefined as string | undefined,
        userAgent: navigator.userAgent
      }

      const result = await applyBulkUpdates(
        parsedData,
        session.user.id,
        clientInfo.ipAddress,
        clientInfo.userAgent
      )

      if (result.success) {
        toast.success(`Successfully updated ${result.updatedCount} tenant${result.updatedCount !== 1 ? 's' : ''}`)
        
        // Clear session storage
        sessionStorage.removeItem('bulkUpdateData')
        
        // Navigate back to tenants page
        router.push('/tenants')
      } else {
        toast.error(result.errors.join("; ") || "Failed to update tenants")
      }
    } catch (error) {
      console.error("Error applying bulk updates:", error)
      toast.error("Failed to update tenants. Please try again.")
    } finally {
      setIsApplying(false)
    }
  }

  const handleCancel = () => {
    // Keep data in session storage for potential retry
    router.push('/tenants')
  }

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground font-mono">
              Generating preview...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
        <div className="flex items-center justify-center py-20">
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
              onClick={handleCancel}
              className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">
            Preview Bulk Update
          </h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Review changes before applying them to the database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isApplying}
            className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!preview || preview.changes.length === 0 || isApplying}
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
                Confirm & Apply ({preview?.totalTenants || 0})
              </>
            )}
          </Button>
        </div>
      </div>

      {preview && (
        <>
          {/* Summary */}
          <div className="border border-border rounded-none p-6 bg-white text-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-2">
                  Total Tenants to Update
                </p>
                <p className="text-4xl font-bold font-mono text-black">
                  {preview.totalTenants}
                </p>
                <p className="text-xs text-gray-600 font-mono mt-1">
                  {preview.changes.reduce((acc, t) => acc + t.fieldChanges.length, 0)} total field changes
                </p>
              </div>
              <div className="rounded-none bg-primary/10 p-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Changes Table */}
          {preview.changes.length === 0 ? (
            <div className="border border-border rounded-none p-12 text-center bg-white">
              <p className="text-sm text-gray-600 font-mono">
                No changes detected. All values match current database records.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-none bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-gray-50">
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-black">Tenant</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-black">BP Code</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-black">Field</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-black">Current Value</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-black">New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.changes.map((tenantChange) => (
                    tenantChange.fieldChanges.map((fieldChange, fieldIndex) => (
                      <TableRow key={`${tenantChange.tenantId}-${fieldIndex}`} className="border-border hover:bg-gray-50">
                        {fieldIndex === 0 ? (
                          <>
                            <TableCell rowSpan={tenantChange.fieldChanges.length} className="font-medium font-mono align-top border-r border-border text-black">
                              <div className="py-2">
                                <p className="font-bold">{tenantChange.tenantName}</p>
                                <Badge variant="outline" className="mt-2 rounded-none text-xs font-mono">
                                  {tenantChange.fieldChanges.length} changes
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell rowSpan={tenantChange.fieldChanges.length} className="font-mono text-xs text-gray-600 align-top border-r border-border">
                              <div className="py-2">
                                {tenantChange.bpCode}
                              </div>
                            </TableCell>
                          </>
                        ) : null}
                        <TableCell className="font-mono text-xs text-black">
                          {formatFieldName(fieldChange.fieldName)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="bg-destructive/10 border border-destructive/20 rounded-none px-2 py-1 inline-block max-w-xs">
                            <span className="text-destructive/80">{fieldChange.oldValue}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <ArrowRight className="h-4 w-4 text-gray-400 inline-block" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-none px-2 py-1 inline-block max-w-xs">
                            <span className="text-emerald-600">{fieldChange.newValue}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Sticky Footer Actions */}
          <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-end gap-2 shadow-lg">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isApplying}
              className="rounded-none border-border font-mono text-xs uppercase tracking-wider"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
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
                  Confirm & Apply ({preview.totalTenants} tenant{preview.totalTenants !== 1 ? 's' : ''})
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
