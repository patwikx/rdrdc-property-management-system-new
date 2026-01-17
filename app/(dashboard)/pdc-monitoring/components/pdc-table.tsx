"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash2, Filter, Printer, Download, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { deletePDC, updatePDCStatus, updatePDC } from "@/lib/actions/pdc-actions"

type PDC = {
  id: string
  docDate: Date
  refNo: string
  bankName: string
  dueDate: Date
  checkNo: string
  amount: number
  remarks: string | null
  bpCode: string
  bpName: string
  status: "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled"
  updatedAt: Date
  tenant: {
    company: string | null
    businessName: string
    email: string
  }
  updatedBy: {
    firstName: string
    lastName: string
  }
}

type Tenant = {
  bpCode: string
  company: string | null
  businessName: string
  email: string
}

interface PDCTableProps {
  pdcs: PDC[]
  tenants?: Tenant[]
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface EditingPDC {
  id: string
  docDate: Date
  refNo: string
  bankName: string
  dueDate: Date
  checkNo: string
  amount: number
  remarks: string
  bpCode: string
}

function getStatusBadge(status: PDC["status"]) {
  switch (status) {
    case "Open": return <Badge variant="outline" className="rounded-none border-amber-500 text-amber-600 bg-amber-50/10 uppercase font-mono text-[10px]">Open</Badge>
    case "Deposited": return <Badge variant="outline" className="rounded-none border-emerald-500 text-emerald-600 bg-emerald-50/10 uppercase font-mono text-[10px]">Deposited</Badge>
    case "RETURNED": return <Badge variant="outline" className="rounded-none border-blue-500 text-blue-600 bg-blue-50/10 uppercase font-mono text-[10px]">Returned</Badge>
    case "Bounced": return <Badge variant="outline" className="rounded-none border-rose-500 text-rose-600 bg-rose-50/10 uppercase font-mono text-[10px]">Bounced</Badge>
    case "Cancelled": return <Badge variant="outline" className="rounded-none border-muted text-muted-foreground bg-muted/10 uppercase font-mono text-[10px]">Cancelled</Badge>
    default: return <Badge variant="outline" className="rounded-none font-mono uppercase text-[10px]">{status}</Badge>
  }
}

const statusOptions = [
  { value: "Open", label: "OPEN" },
  { value: "Deposited", label: "DEPOSITED" },
  { value: "RETURNED", label: "RETURNED" },
  { value: "Bounced", label: "BOUNCED" },
  { value: "Cancelled", label: "CANCELLED" },
]

const ROWS_PER_PAGE = 10

export function PDCTable({ pdcs, tenants = [] }: PDCTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<EditingPDC | null>(null)
  // Filter states
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [bpNameFilter, setBpNameFilter] = useState("")
  const [bankNameFilter, setBankNameFilter] = useState("")
  const [docDateRange, setDocDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [dueDateRange, setDueDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [currentPage, setCurrentPage] = useState(1)

  // Filter PDCs based on all selected filters
  const filteredPDCs = useMemo(() => {
    return pdcs.filter((pdc) => {
      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(pdc.status)) {
        return false
      }
      // BP Name filter
      if (bpNameFilter && !pdc.bpName.toLowerCase().includes(bpNameFilter.toLowerCase())) {
        return false
      }
      // Bank Name filter
      if (bankNameFilter && !pdc.bankName.toLowerCase().includes(bankNameFilter.toLowerCase())) {
        return false
      }
      // Doc Date range filter
      if (docDateRange.from || docDateRange.to) {
        const docDate = new Date(pdc.docDate)
        if (docDateRange.from && docDate < docDateRange.from) return false
        if (docDateRange.to && docDate > docDateRange.to) return false
      }
      // Due Date range filter
      if (dueDateRange.from || dueDateRange.to) {
        const dueDate = new Date(pdc.dueDate)
        if (dueDateRange.from && dueDate < dueDateRange.from) return false
        if (dueDateRange.to && dueDate > dueDateRange.to) return false
      }
      return true
    })
  }, [pdcs, statusFilters, bpNameFilter, bankNameFilter, docDateRange, dueDateRange])

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilters, bpNameFilter, bankNameFilter, docDateRange, dueDateRange])

  // Pagination logic
  const totalPages = Math.ceil(filteredPDCs.length / ROWS_PER_PAGE)
  const paginatedPDCs = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE
    return filteredPDCs.slice(startIndex, startIndex + ROWS_PER_PAGE)
  }, [filteredPDCs, currentPage])



  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatusFilters((prev) => [...prev, status])
    } else {
      setStatusFilters((prev) => prev.filter((s) => s !== status))
    }
  }

  const clearAllFilters = () => {
    setStatusFilters([])
    setBpNameFilter("")
    setBankNameFilter("")
    setDocDateRange({ from: undefined, to: undefined })
    setDueDateRange({ from: undefined, to: undefined })
  }

  const hasActiveFilters = () => {
    return (
      statusFilters.length > 0 ||
      bpNameFilter !== "" ||
      bankNameFilter !== "" ||
      docDateRange.from ||
      docDateRange.to ||
      dueDateRange.from ||
      dueDateRange.to
    )
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (statusFilters.length > 0) count++
    if (bpNameFilter) count++
    if (bankNameFilter) count++
    if (docDateRange.from || docDateRange.to) count++
    if (dueDateRange.from || dueDateRange.to) count++
    return count
  }

  const handleStatusChange = (id: string, status: PDC["status"]) => {
    startTransition(async () => {
      const result = await updatePDCStatus({ id, status })
      if (result.success) {
        toast.success("PDC status updated successfully")
      } else {
        toast.error(result.error || "Failed to update PDC status")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePDC(id)
      if (result.success) {
        toast.success("PDC deleted successfully")
        setDeleteId(null)
      } else {
        toast.error(result.error || "Failed to delete PDC")
      }
    })
  }

  // Edit functions
  const handleEdit = (pdc: PDC) => {
    setEditingId(pdc.id)
    setEditingData({
      id: pdc.id,
      docDate: pdc.docDate,
      refNo: pdc.refNo,
      bankName: pdc.bankName,
      dueDate: pdc.dueDate,
      checkNo: pdc.checkNo,
      amount: pdc.amount,
      remarks: pdc.remarks || "",
      bpCode: pdc.bpCode,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleSaveEdit = () => {
    if (!editingData) return
    startTransition(async () => {
      const result = await updatePDC(editingData)
      if (result.success) {
        toast.success("PDC updated successfully")
        setEditingId(null)
        setEditingData(null)
      } else {
        toast.error(result.error || "Failed to update PDC")
      }
    })
  }

  const updateEditingData = <K extends keyof EditingPDC>(field: K, value: EditingPDC[K]) => {
    if (!editingData) return
    setEditingData((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const currentDate = format(new Date(), "EEEE, MMMM dd, yyyy")
    const currentTime = format(new Date(), "hh:mm:ss a")

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PDC Report</title>
          <style>
            body {
               font-family: 'Courier New', Courier, monospace;
               margin: 20px;
               font-size: 12px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0;
            }
            .date-time {
              text-align: right;
              font-size: 10px;
            }
            table {
               width: 100%;
               border-collapse: collapse;
               margin-top: 10px;
            }
            th, td {
               border: 1px solid #000;
               padding: 6px;
               text-align: left;
               font-size: 10px;
            }
            th {
               background-color: #eee;
               font-weight: bold;
               text-transform: uppercase;
            }
            .amount { text-align: right; }
            .center { text-align: center; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CHECK REGISTRY REPORT</h1>
              <div style="font-size: 10px; margin-top: 5px;">RDRDC PROPERTY MANAGEMENT SYSTEM</div>
            </div>
            <div class="date-time">
              GENERATED: ${currentDate}<br>
              TIME: ${currentTime}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>DOC DATE</th>
                <th>REF NO</th>
                <th>BANK</th>
                <th>CHECK NO</th>
                <th>DUE DATE</th>
                <th>BP NAME</th>
                <th>STATUS</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPDCs
                .map(
                  (pdc, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>${format(new Date(pdc.docDate), "MM/dd/yy")}</td>
                  <td>${pdc.refNo}</td>
                  <td>${pdc.bankName}</td>
                  <td>${pdc.checkNo}</td>
                  <td>${format(new Date(pdc.dueDate), "MM/dd/yy")}</td>
                  <td>${pdc.bpName}</td>
                  <td class="center">${pdc.status.toUpperCase()}</td>
                  <td class="amount">${formatCurrency(pdc.amount)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "DOC DATE",
      "REF NO",
      "BANK NAME",
      "CHECK NO",
      "DUE DATE",
      "BP NAME",
      "STATUS",
      "AMOUNT",
      "REMARKS",
    ]

    const csvData = filteredPDCs.map((pdc, index) => [
      index + 1,
      format(new Date(pdc.docDate), "MM/dd/yyyy"),
      pdc.refNo,
      pdc.bankName,
      pdc.checkNo,
      format(new Date(pdc.dueDate), "MM/dd/yyyy"),
      pdc.bpName,
      pdc.status.toUpperCase(),
      pdc.amount,
      pdc.remarks || "",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(','))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `CHECK_REGISTRY_${format(new Date(), "yyyyMMdd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border border-border bg-muted/5 p-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-none border-border bg-background hover:bg-muted font-mono uppercase text-xs">
                <Filter className="mr-2 h-3 w-3" />
                Filters
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-none p-0 flex items-center justify-center font-mono text-[10px]">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-none border-border" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-widest">Filter Options</h4>
                  {hasActiveFilters() && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-[10px] uppercase text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none">
                      Clear All
                    </Button>
                  )}
                </div>
                {/* Row 1: Text Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wide">Business Partner</Label>
                    <div className="space-y-1">
                      <Input
                        placeholder="SEARCH NAME..."
                        value={bpNameFilter}
                        onChange={(e) => setBpNameFilter(e.target.value)}
                        className="h-7 text-xs rounded-none font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wide">Bank Name</Label>
                    <div className="space-y-1">
                      <Input
                        placeholder="SEARCH BANK..."
                        value={bankNameFilter}
                        onChange={(e) => setBankNameFilter(e.target.value)}
                        className="h-7 text-xs rounded-none font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Row 2: Date Ranges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wide">Doc Date</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] px-2 bg-transparent rounded-none border-border font-mono uppercase"
                          >
                            {docDateRange.from ? format(docDateRange.from, "MM/dd") : "FROM"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={docDateRange.from}
                            onSelect={(date) => setDocDateRange((prev) => ({ ...prev, from: date }))}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] px-2 bg-transparent rounded-none border-border font-mono uppercase"
                          >
                            {docDateRange.to ? format(docDateRange.to, "MM/dd") : "TO"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={docDateRange.to}
                            onSelect={(date) => setDocDateRange((prev) => ({ ...prev, to: date }))}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wide">Due Date</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] px-2 bg-transparent rounded-none border-border font-mono uppercase"
                          >
                            {dueDateRange.from ? format(dueDateRange.from, "MM/dd") : "FROM"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDateRange.from}
                            onSelect={(date) => setDueDateRange((prev) => ({ ...prev, from: date }))}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] px-2 bg-transparent rounded-none border-border font-mono uppercase"
                          >
                            {dueDateRange.to ? format(dueDateRange.to, "MM/dd") : "TO"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDateRange.to}
                            onSelect={(date) => setDueDateRange((prev) => ({ ...prev, to: date }))}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Row 3: Status Filter */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wide">Status</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="flex items-center space-x-1.5">
                        <Checkbox
                          id={status.value}
                          checked={statusFilters.includes(status.value)}
                          onCheckedChange={(checked) => handleStatusFilterChange(status.value, checked as boolean)}
                          className="h-3 w-3 rounded-none"
                        />
                        <Label htmlFor={status.value} className="text-[10px] uppercase font-mono leading-none cursor-pointer">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {hasActiveFilters() && (
            <div className="text-[10px] text-muted-foreground font-mono uppercase pl-2 border-l border-border/50">
              Showing {filteredPDCs.length} of {pdcs.length} records
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 rounded-none border-border bg-background hover:bg-muted font-mono uppercase text-xs flex-1 sm:flex-none">
            <Printer className="mr-2 h-3 w-3" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 rounded-none border-border bg-background hover:bg-muted font-mono uppercase text-xs flex-1 sm:flex-none">
            <Download className="mr-2 h-3 w-3" />
            CSV
          </Button>
        </div>
      </div>

      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Doc Date</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Ref No.</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Business Partner</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Bank Name</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Check No.</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Due Date</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5 text-center">Amount</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5 w-[120px]">Remarks</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Status</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Updated By</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5 w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPDCs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-xs font-mono uppercase text-muted-foreground">
                  {hasActiveFilters() ? "No PDCs found matching filters." : "No PDCs found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPDCs.map((pdc) => (
                <TableRow key={pdc.id} className="group border-b border-border hover:bg-muted/5 transition-colors">
                  {/* Doc Date */}
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {editingId === pdc.id ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left font-normal bg-transparent rounded-none h-7 text-xs border-border"
                          >
                            {editingData?.docDate ? format(editingData.docDate, "MM/dd/yy") : "Select"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={editingData?.docDate}
                            onSelect={(date) => date && updateEditingData("docDate", date)}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      format(new Date(pdc.docDate), "MM/dd/yy")
                    )}
                  </TableCell>
                  {/* Ref No */}
                  <TableCell className="text-xs font-mono font-medium">
                    {editingId === pdc.id ? (
                      <Input
                        value={editingData?.refNo || ""}
                        onChange={(e) => updateEditingData("refNo", e.target.value)}
                        className="w-full h-7 text-xs rounded-none border-border font-mono uppercase"
                      />
                    ) : (
                      pdc.refNo
                    )}
                  </TableCell>
                  {/* Business Partner */}
                  <TableCell className="text-xs">
                    {editingId === pdc.id ? (
                      <Select
                        value={editingData?.bpCode || ""}
                        onValueChange={(value) => updateEditingData("bpCode", value)}
                      >
                        <SelectTrigger className="w-full h-7 text-xs rounded-none border-border">
                          <SelectValue placeholder="BP" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border">
                          {tenants && tenants.length > 0 ? (
                            tenants.map((tenant) => (
                              <SelectItem key={tenant.bpCode} value={tenant.bpCode} className="text-xs font-mono">
                                {tenant.company || tenant.businessName}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">No tenants</div>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-bold uppercase text-[10px] truncate max-w-[150px]">{pdc.bpName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{pdc.bpCode}</span>
                      </div>
                    )}
                  </TableCell>
                  {/* Bank Name */}
                  <TableCell className="text-xs font-mono uppercase text-muted-foreground">
                    {editingId === pdc.id ? (
                      <Input
                        value={editingData?.bankName || ""}
                        onChange={(e) => updateEditingData("bankName", e.target.value)}
                        className="w-full h-7 text-xs rounded-none border-border font-mono uppercase"
                      />
                    ) : (
                      pdc.bankName
                    )}
                  </TableCell>
                  {/* Check No */}
                  <TableCell className="text-xs font-mono">
                    {editingId === pdc.id ? (
                      <Input
                        value={editingData?.checkNo || ""}
                        onChange={(e) => updateEditingData("checkNo", e.target.value)}
                        className="w-full h-7 text-xs rounded-none border-border font-mono"
                      />
                    ) : (
                      pdc.checkNo
                    )}
                  </TableCell>
                  {/* Due Date */}
                  <TableCell className="text-xs font-mono">
                    {editingId === pdc.id ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left font-normal bg-transparent rounded-none h-7 text-xs border-border"
                          >
                            {editingData?.dueDate ? format(editingData.dueDate, "MM/dd/yy") : "Select"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={editingData?.dueDate}
                            onSelect={(date) => date && updateEditingData("dueDate", date)}
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      format(new Date(pdc.dueDate), "MM/dd/yy")
                    )}
                  </TableCell>
                  {/* Amount */}
                  <TableCell className="text-right text-xs font-mono font-bold">
                    {editingId === pdc.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData?.amount || ""}
                        onChange={(e) => updateEditingData("amount", Number.parseFloat(e.target.value) || 0)}
                        className="w-full text-right h-7 text-xs rounded-none border-border font-mono"
                      />
                    ) : (
                      formatCurrency(pdc.amount)
                    )}
                  </TableCell>
                  {/* Remarks */}
                  <TableCell className="text-center text-xs uppercase text-muted-foreground truncate max-w-[120px]">
                    {editingId === pdc.id ? (
                      <Input
                        value={editingData?.remarks || ""}
                        onChange={(e) => updateEditingData("remarks", e.target.value)}
                        className="w-full h-7 text-xs rounded-none border-border font-mono uppercase"
                        placeholder="REMARKS"
                      />
                    ) : pdc.remarks || "-"}
                  </TableCell>
                  {/* Status */}
                  <TableCell>
                    <Select
                      value={pdc.status}
                      onValueChange={(value) => handleStatusChange(pdc.id, value as PDC["status"])}
                      disabled={isPending || editingId === pdc.id}
                    >
                      <SelectTrigger className="w-[110px] h-7 text-xs rounded-none border-border bg-transparent">
                        <SelectValue>
                          {getStatusBadge(pdc.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border">
                        <SelectItem value="Open" className="text-xs font-mono uppercase">Open</SelectItem>
                        <SelectItem value="Deposited" className="text-xs font-mono uppercase">Deposited</SelectItem>
                        <SelectItem value="RETURNED" className="text-xs font-mono uppercase">Returned</SelectItem>
                        <SelectItem value="Bounced" className="text-xs font-mono uppercase">Bounced</SelectItem>
                        <SelectItem value="Cancelled" className="text-xs font-mono uppercase">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {/* Updated By */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase">{pdc.updatedBy.firstName}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{format(new Date(pdc.updatedAt), "MM/dd/yy")}</span>
                    </div>
                  </TableCell>
                  {/* Actions */}
                  <TableCell>
                    {editingId === pdc.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isPending}
                          className="h-6 w-6 p-0 rounded-none hover:bg-emerald-100 hover:text-emerald-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="h-6 w-6 p-0 rounded-none hover:bg-rose-100 hover:text-rose-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0 rounded-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-border">
                          <DropdownMenuLabel className="text-[10px] font-mono uppercase text-muted-foreground">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(pdc.refNo)} className="text-xs font-mono uppercase cursor-pointer rounded-none">
                            Copy Ref No.
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(pdc)} className="text-xs font-mono uppercase cursor-pointer rounded-none">
                            <Pencil className="mr-2 h-3 w-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive text-xs font-mono uppercase cursor-pointer rounded-none" onClick={() => setDeleteId(pdc.id)}>
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with Pagination - Fixed */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-[10px] text-muted-foreground font-mono uppercase">
          Showing <span className="font-bold text-foreground">{filteredPDCs.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * ROWS_PER_PAGE, filteredPDCs.length)}</span> of <span className="font-bold text-foreground">{filteredPDCs.length}</span> records
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || totalPages === 0}
            className="h-7 px-2 text-[10px] font-mono uppercase rounded-none border-border"
          >
            Prev
          </Button>
          <div className="h-7 px-2 flex items-center justify-center text-[10px] font-mono font-bold border border-border bg-muted/5 min-w-[30px]">
            {totalPages > 0 ? currentPage : 0}/{totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-7 px-2 text-[10px] font-mono uppercase rounded-none border-border"
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-bold tracking-widest text-sm">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              This action cannot be undone. This will permanently delete the PDC record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none uppercase text-xs font-bold border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90 rounded-none uppercase text-xs font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}