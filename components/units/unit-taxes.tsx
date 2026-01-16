"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Receipt, Plus, CheckCircle, AlertCircle, Clock, Search, Calculator, X } from "lucide-react"
import type { UnitWithDetails } from "@/lib/actions/unit-actions"
import { CreateUnitTaxForm } from "./create-unit-tax-form"
import { EditUnitTaxForm } from "./edit-unit-tax-form"
import { MarkUnitTaxPaidDialog } from "./mark-unit-tax-paid-dialog"
import { format } from "date-fns"

interface UnitTaxesProps {
  unit: UnitWithDetails
}

export function UnitTaxes({ unit }: UnitTaxesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<(typeof unit.unitTaxes)[0] | null>(null)
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false)
  const [markingPaidTax, setMarkingPaidTax] = useState<(typeof unit.unitTaxes)[0] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid" | "overdue">("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const handleTaxCreated = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  const handleTaxUpdated = () => {
    setIsEditDialogOpen(false)
    setEditingTax(null)
    window.location.reload()
  }

  const handleTaxMarkedPaid = () => {
    setIsMarkPaidDialogOpen(false)
    setMarkingPaidTax(null)
    window.location.reload()
  }

  const handleEditTax = (tax: (typeof unit.unitTaxes)[0]) => {
    setEditingTax(tax)
    setIsEditDialogOpen(true)
  }

  const handleMarkAsPaid = (tax: (typeof unit.unitTaxes)[0]) => {
    setMarkingPaidTax(tax)
    setIsMarkPaidDialogOpen(true)
  }

  const filteredTaxes = unit.unitTaxes.filter((tax) => {
    const matchesSearch =
      searchTerm === "" ||
      tax.taxDecNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.taxYear.toString().includes(searchTerm)

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "paid" && tax.isPaid) ||
      (filterStatus === "unpaid" && !tax.isPaid) ||
      (filterStatus === "overdue" && !tax.isPaid && new Date(tax.dueDate) < new Date())

    const matchesYear = selectedYear === "all" || tax.taxYear.toString() === selectedYear

    return matchesSearch && matchesStatus && matchesYear
  })

  const totalTaxes = unit.unitTaxes.length
  const paidTaxes = unit.unitTaxes.filter((tax) => tax.isPaid).length
  const unpaidTaxes = unit.unitTaxes.filter((tax) => !tax.isPaid).length
  const overdueTaxes = unit.unitTaxes.filter((tax) => !tax.isPaid && new Date(tax.dueDate) < new Date()).length
  const totalAmount = unit.unitTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0)
  const paidAmount = unit.unitTaxes.filter((tax) => tax.isPaid).reduce((sum, tax) => sum + tax.taxAmount, 0)
  const unpaidAmount = unit.unitTaxes.filter((tax) => !tax.isPaid).reduce((sum, tax) => sum + tax.taxAmount, 0)

  const availableYears = [...new Set(unit.unitTaxes.map((tax) => tax.taxYear))].sort((a, b) => b - a)

  const getStatusStyle = (tax: (typeof unit.unitTaxes)[0]) => {
    if (tax.isPaid) return { border: 'border-l-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Paid' }
    if (new Date(tax.dueDate) < new Date()) return { border: 'border-l-rose-500', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Overdue' }
    return { border: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Unpaid' }
  }

  if (totalTaxes === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Calculator className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Tax Records</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          No property tax records found for this unit
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-border max-w-[650px]">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Add Space RPT Record</DialogTitle>
            </DialogHeader>
            <CreateUnitTaxForm
              unitId={unit.id}
              onSuccess={handleTaxCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Assessment</span>
            <Receipt className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">₱{totalAmount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-2">Lifetime</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Paid</span>
            <CheckCircle className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">₱{paidAmount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-2">{paidTaxes} records</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Unpaid</span>
            <Clock className="h-4 w-4 text-amber-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-amber-600">₱{unpaidAmount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-2">{unpaidTaxes} records</span>
          </div>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Overdue</span>
            <AlertCircle className="h-4 w-4 text-rose-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-rose-600">{overdueTaxes}</span>
            <span className="text-xs text-muted-foreground ml-2">Attention Needed</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="SEARCH TAX RECORDS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
              <SelectTrigger className="w-[140px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
                <SelectItem value="paid" className="font-mono text-xs uppercase">Paid</SelectItem>
                <SelectItem value="unpaid" className="font-mono text-xs uppercase">Unpaid</SelectItem>
                <SelectItem value="overdue" className="font-mono text-xs uppercase">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
                <SelectValue placeholder="Year: All" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="all" className="font-mono text-xs uppercase">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="font-mono text-xs uppercase">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-10 text-xs font-mono uppercase tracking-wider w-full sm:w-auto">
              <Plus className="h-3 w-3 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-border max-w-[650px]">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Add Space RPT Record</DialogTitle>
            </DialogHeader>
            <CreateUnitTaxForm
              unitId={unit.id}
              onSuccess={handleTaxCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* TAX GRID */}
      {filteredTaxes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTaxes.map((tax) => {
            const styles = getStatusStyle(tax)
            return (
              <div key={tax.id} className={`group border border-border border-l-4 ${styles.border} bg-background hover:bg-muted/5 transition-all flex flex-col`}>
                <div className="p-3 border-b border-dashed border-border/50 flex justify-between items-start">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-0.5">Tax Dec</span>
                    <span className="font-mono font-bold text-sm truncate block max-w-[120px]" title={tax.taxDecNo}>{tax.taxDecNo}</span>
                  </div>
                  <Badge variant="outline" className={`rounded-none text-[10px] uppercase tracking-widest border-0 ${styles.badge} px-1.5 py-0`}>
                    {styles.label}
                  </Badge>
                </div>

                <div className="p-3 flex-1 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Year</span>
                    <span className="font-mono font-medium text-sm">{tax.taxYear} {tax.whatQuarter && <span className="text-xs text-muted-foreground">({tax.whatQuarter})</span>}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Due</span>
                    <span className={`font-mono text-sm ${!tax.isPaid && new Date(tax.dueDate) < new Date() ? 'text-rose-600 font-bold' : ''}`}>
                      {format(new Date(tax.dueDate), 'MMM dd')}
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-2 border-t border-border/50 flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
                    <span className="font-mono font-bold text-base">₱{tax.taxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-2 border-t border-border/50 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditTax(tax)} className="flex-1 h-8 rounded-none text-[10px] font-mono uppercase tracking-wider hover:bg-muted">
                    Edit
                  </Button>
                  {!tax.isPaid && (
                    <Button size="sm" onClick={() => handleMarkAsPaid(tax)} className="flex-1 h-8 rounded-none text-[10px] font-mono uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white">
                      Pay
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredTaxes.length > 0 && (
        <div className="mt-6 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Showing {filteredTaxes.length} of {totalTaxes} records
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-none border-border max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">Edit Space RPT Record</DialogTitle>
          </DialogHeader>
          {editingTax && (
            <EditUnitTaxForm
              tax={{
                id: editingTax.id,
                taxYear: editingTax.taxYear,
                taxDecNo: editingTax.taxDecNo,
                taxAmount: editingTax.taxAmount,
                dueDate: new Date(editingTax.dueDate),
                isPaid: editingTax.isPaid,
                paidDate: editingTax.paidDate ? new Date(editingTax.paidDate) : null,
                remarks: editingTax.remarks,
                isAnnual: editingTax.isAnnual,
                isQuarterly: editingTax.isQuarterly,
                whatQuarter: editingTax.whatQuarter,
              }}
              onSuccess={handleTaxUpdated}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {markingPaidTax && (
        <MarkUnitTaxPaidDialog
          isOpen={isMarkPaidDialogOpen}
          onOpenChange={setIsMarkPaidDialogOpen}
          taxId={markingPaidTax.id}
          taxDecNo={markingPaidTax.taxDecNo}
          taxAmount={markingPaidTax.taxAmount}
          onSuccess={handleTaxMarkedPaid}
        />
      )}
    </div>
  )
}