"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, 
  AlertTriangle, ArrowLeft, Loader2, FileText, Info, Check
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { importTenantsAction } from "@/lib/actions/tenant-import-actions"

interface ParsedTenant {
  rowNumber: number
  data: Record<string, string>
  errors: string[]
  isValid: boolean
}

interface ImportState {
  step: 'upload' | 'preview' | 'importing' | 'complete'
  file: File | null
  parsedData: ParsedTenant[]
  importProgress: number
  importResults: { success: number; failed: number; errors: string[] }
}

// CSV field definitions with required flag
const CSV_FIELDS = [
  { key: 'bpCode', label: 'BP Code', required: true },
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: true },
  { key: 'company', label: 'Company', required: true },
  { key: 'businessName', label: 'Business Name', required: true },
  { key: 'status', label: 'Status', required: true },
  { key: 'homeAddress', label: 'Home Address', required: false },
  { key: 'facebookName', label: 'Facebook Name', required: false },
  { key: 'emergencyContactName', label: 'Emergency Contact Name', required: false },
  { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', required: false },
  { key: 'natureOfBusiness', label: 'Nature of Business', required: false },
  { key: 'yearsInBusiness', label: 'Years in Business', required: false },
  { key: 'positionInCompany', label: 'Position in Company', required: false },
  { key: 'officeAddress', label: 'Office Address', required: false },
  { key: 'facebookPage', label: 'Facebook Page', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'authorizedSignatory', label: 'Authorized Signatory', required: false },
  { key: 'isStore', label: 'Is Store (true/false)', required: false },
  { key: 'isOffice', label: 'Is Office (true/false)', required: false },
  { key: 'isFranchise', label: 'Is Franchise (true/false)', required: false },
]

const EXTENDED_CSV_FIELDS = [
  ...CSV_FIELDS,
  { key: 'bankName1', label: 'Primary Bank', required: false },
  { key: 'bankAddress1', label: 'Primary Bank Branch', required: false },
  { key: 'bankName2', label: 'Secondary Bank', required: false },
  { key: 'bankAddress2', label: 'Secondary Bank Branch', required: false },
  { key: 'otherBusinessName', label: 'Other Business Name', required: false },
  { key: 'otherBusinessAddress', label: 'Other Business Address', required: false },
]

export default function ImportTenantsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    parsedData: [],
    importProgress: 0,
    importResults: { success: 0, failed: 0, errors: [] }
  })
  const [isDragging, setIsDragging] = useState(false)

  const generateTemplate = () => {
    const headers = EXTENDED_CSV_FIELDS.map(f => f.key).join(',')
    const sampleRow = [
      'BP-001', 'John', 'Doe', 'john@example.com', '+63 912 345 6789',
      'Acme Corp', 'Acme Solutions', 'PENDING', '123 Main St', 'johndoe',
      'Jane Doe', '+63 912 345 6780', 'Retail', '5', 'CEO', '456 Business Rd',
      'facebook.com/acme', 'acme.com', 'John Doe', 'true', 'false', 'false',
      'BDO', 'Makati Branch', 'BPI', 'Ortigas Branch', '', ''
    ].join(',')
    
    const csvContent = `${headers}\n${sampleRow}`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tenant_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const parseCSV = (text: string): ParsedTenant[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const results: ParsedTenant[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const data: Record<string, string> = {}
      const errors: string[] = []
      
      headers.forEach((header, idx) => {
        data[header] = values[idx] || ''
      })
      
      // Validate required fields
      EXTENDED_CSV_FIELDS.filter(f => f.required).forEach(field => {
        if (!data[field.key] || data[field.key].trim() === '') {
          errors.push(`${field.label} is required`)
        }
      })
      
      // Validate email format
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format')
      }
      
      // Validate status
      if (data.status && !['ACTIVE', 'INACTIVE', 'PENDING'].includes(data.status.toUpperCase())) {
        errors.push('Status must be ACTIVE, INACTIVE, or PENDING')
      }
      
      results.push({
        rowNumber: i + 1,
        data,
        errors,
        isValid: errors.length === 0
      })
    }
    
    return results
  }

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setState(prev => ({
        ...prev,
        step: 'preview',
        file,
        parsedData: parsed
      }))
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleImport = async () => {
    const validRows = state.parsedData.filter(row => row.isValid)
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setState(prev => ({ ...prev, step: 'importing', importProgress: 0 }))
    
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        const result = await importTenantsAction({
          bpCode: row.data.bpCode,
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          email: row.data.email,
          phone: row.data.phone,
          company: row.data.company,
          businessName: row.data.businessName,
          status: row.data.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'PENDING',
          homeAddress: row.data.homeAddress || undefined,
          facebookName: row.data.facebookName || undefined,
          emergencyContactName: row.data.emergencyContactName || undefined,
          emergencyContactPhone: row.data.emergencyContactPhone || undefined,
          natureOfBusiness: row.data.natureOfBusiness || undefined,
          yearsInBusiness: row.data.yearsInBusiness || undefined,
          positionInCompany: row.data.positionInCompany || undefined,
          officeAddress: row.data.officeAddress || undefined,
          facebookPage: row.data.facebookPage || undefined,
          website: row.data.website || undefined,
          authorizedSignatory: row.data.authorizedSignatory || undefined,
          isStore: row.data.isStore?.toLowerCase() === 'true',
          isOffice: row.data.isOffice?.toLowerCase() === 'true',
          isFranchise: row.data.isFranchise?.toLowerCase() === 'true',
          bankName1: row.data.bankName1 || undefined,
          bankAddress1: row.data.bankAddress1 || undefined,
          bankName2: row.data.bankName2 || undefined,
          bankAddress2: row.data.bankAddress2 || undefined,
          otherBusinessName: row.data.otherBusinessName || undefined,
          otherBusinessAddress: row.data.otherBusinessAddress || undefined,
        })

        if (result.error) {
          failed++
          errors.push(`Row ${row.rowNumber}: ${result.error}`)
        } else {
          success++
        }
      } catch {
        failed++
        errors.push(`Row ${row.rowNumber}: Unexpected error`)
      }

      setState(prev => ({
        ...prev,
        importProgress: Math.round(((i + 1) / validRows.length) * 100)
      }))
      
      // Small delay for animation effect
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setState(prev => ({
      ...prev,
      step: 'complete',
      importResults: { success, failed, errors }
    }))
  }

  const validCount = state.parsedData.filter(r => r.isValid).length
  const invalidCount = state.parsedData.filter(r => !r.isValid).length

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Import Tenants</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Bulk import tenants from CSV file
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tenants">
            <Button variant="outline" className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <ArrowLeft className="h-3 w-3 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {state.step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div
                  className={`border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 bg-muted/5'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
                    Drop CSV File Here
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mb-4">
                    or click to browse
                  </p>
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-wider">
                    .CSV Files Only
                  </Badge>
                </div>

                <div className="border border-border bg-background p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest">CSV Template</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateTemplate}
                      className="rounded-none h-8 text-xs font-mono uppercase tracking-wider"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Download the template to see the expected format and all available fields.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Preview Step */}
            {state.step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* File Info */}
                <div className="border border-border bg-background p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <span className="text-sm font-bold">{state.file?.name}</span>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {state.parsedData.length} rows detected
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, step: 'upload', file: null, parsedData: [] }))}
                    className="rounded-none h-8 text-xs font-mono uppercase"
                  >
                    Change File
                  </Button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Valid</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-emerald-600">{validCount}</span>
                    <span className="text-xs text-muted-foreground ml-2">rows</span>
                  </div>
                  <div className="border border-rose-500/30 bg-rose-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Invalid</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-rose-600">{invalidCount}</span>
                    <span className="text-xs text-muted-foreground ml-2">rows</span>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-border bg-background overflow-hidden">
                  <div className="border-b border-border bg-muted/10 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Data Preview</span>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/5 sticky top-0">
                        <tr>
                          <th className="p-3 text-left font-mono uppercase tracking-wider text-muted-foreground">Row</th>
                          <th className="p-3 text-left font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="p-3 text-left font-mono uppercase tracking-wider text-muted-foreground">BP Code</th>
                          <th className="p-3 text-left font-mono uppercase tracking-wider text-muted-foreground">Name</th>
                          <th className="p-3 text-left font-mono uppercase tracking-wider text-muted-foreground">Company</th>
                          <th className="p-3 text-left font-mono uppercase tracking-wider text-muted-foreground">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {state.parsedData.map((row, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={row.isValid ? 'hover:bg-muted/5' : 'bg-rose-500/5'}
                          >
                            <td className="p-3 font-mono">{row.rowNumber}</td>
                            <td className="p-3">
                              {row.isValid ? (
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <div className="group relative">
                                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                                  <div className="absolute left-0 top-6 z-10 hidden group-hover:block bg-background border border-border p-2 text-[10px] w-48">
                                    {row.errors.map((err, i) => (
                                      <div key={i} className="text-rose-600">{err}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono">{row.data.bpCode}</td>
                            <td className="p-3">{row.data.firstName} {row.data.lastName}</td>
                            <td className="p-3">{row.data.company}</td>
                            <td className="p-3 font-mono text-muted-foreground">{row.data.email}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({ ...prev, step: 'upload', file: null, parsedData: [] }))}
                    className="rounded-none h-10 px-6 text-xs font-mono uppercase tracking-wider"
                  >
                    <ArrowLeft className="h-3 w-3 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0}
                    className="rounded-none h-10 px-8 text-xs font-mono uppercase tracking-wider"
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Import {validCount} Tenants
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Importing Step */}
            {state.step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-border bg-background p-12 text-center"
              >
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-6" />
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
                  Importing Tenants
                </h3>
                <p className="text-xs text-muted-foreground font-mono mb-6">
                  Please wait while we process your data...
                </p>
                
                {/* Progress Bar */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span>Progress</span>
                    <span>{state.importProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted/20 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${state.importProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Complete Step */}
            {state.step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="border border-border bg-background p-8 text-center">
                  {state.importResults.failed === 0 ? (
                    <CheckCircle className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 mx-auto text-amber-600 mb-4" />
                  )}
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
                    Import Complete
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {state.importResults.success} tenants imported successfully
                    {state.importResults.failed > 0 && `, ${state.importResults.failed} failed`}
                  </p>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Success</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-emerald-600">{state.importResults.success}</span>
                  </div>
                  <div className="border border-rose-500/30 bg-rose-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Failed</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-rose-600">{state.importResults.failed}</span>
                  </div>
                </div>

                {/* Error Details */}
                {state.importResults.errors.length > 0 && (
                  <div className="border border-border bg-background">
                    <div className="border-b border-border bg-muted/10 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Error Details</span>
                    </div>
                    <div className="p-4 max-h-48 overflow-auto">
                      {state.importResults.errors.map((err, idx) => (
                        <div key={idx} className="text-xs font-mono text-rose-600 py-1">
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setState({
                      step: 'upload',
                      file: null,
                      parsedData: [],
                      importProgress: 0,
                      importResults: { success: 0, failed: 0, errors: [] }
                    })}
                    className="rounded-none h-10 px-6 text-xs font-mono uppercase tracking-wider"
                  >
                    Import More
                  </Button>
                  <Button
                    onClick={() => router.push('/tenants')}
                    className="rounded-none h-10 px-8 text-xs font-mono uppercase tracking-wider"
                  >
                    View Tenants
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Import Steps</h3>
            </div>
            <div className="space-y-0 relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              {[
                { step: 'upload', title: 'Upload CSV' },
                { step: 'preview', title: 'Preview Data' },
                { step: 'importing', title: 'Processing' },
                { step: 'complete', title: 'Complete' }
              ].map((item, idx) => {
                const steps = ['upload', 'preview', 'importing', 'complete']
                const currentIdx = steps.indexOf(state.step)
                const itemIdx = steps.indexOf(item.step)
                const isComplete = itemIdx < currentIdx
                const isCurrent = item.step === state.step
                
                return (
                  <div key={item.step} className="flex items-center gap-4 relative py-2">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-none border text-xs font-mono z-10 transition-colors ${
                      isComplete || isCurrent
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-muted-foreground border-border'
                    }`}>
                      {isComplete ? <Check className="h-3 w-3" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-mono uppercase tracking-wide transition-colors ${
                      isCurrent ? 'text-foreground font-bold' : 
                      isComplete ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {item.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Field Reference */}
          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">CSV Fields</h3>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {EXTENDED_CSV_FIELDS.map(field => (
                <div key={field.key} className="flex items-center justify-between text-xs py-1">
                  <span className={`font-mono ${field.required ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {field.label}
                  </span>
                  {field.required && (
                    <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-wider border-primary/50 text-primary">
                      Required
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}