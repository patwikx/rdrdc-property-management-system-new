"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Receipt, Plus, CheckCircle, AlertCircle, Clock, Edit, Search, Calculator } from "lucide-react"
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

  // Filter taxes based on search and filters
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

  // Calculate summary statistics
  const totalTaxes = unit.unitTaxes.length
  const paidTaxes = unit.unitTaxes.filter((tax) => tax.isPaid).length
  const unpaidTaxes = unit.unitTaxes.filter((tax) => !tax.isPaid).length
  const overdueTaxes = unit.unitTaxes.filter((tax) => !tax.isPaid && new Date(tax.dueDate) < new Date()).length
  const totalAmount = unit.unitTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0)
  const paidAmount = unit.unitTaxes.filter((tax) => tax.isPaid).reduce((sum, tax) => sum + tax.taxAmount, 0)
  const unpaidAmount = unit.unitTaxes.filter((tax) => !tax.isPaid).reduce((sum, tax) => sum + tax.taxAmount, 0)

  // Get unique years for filter
  const availableYears = [...new Set(unit.unitTaxes.map((tax) => tax.taxYear))].sort((a, b) => b - a)

  const getStatusBadge = (tax: (typeof unit.unitTaxes)[0]) => {
    if (tax.isPaid) {
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      )
    } else if (new Date(tax.dueDate) < new Date()) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Unpaid
        </Badge>
      )
    }
  }

  if (totalTaxes === 0) {
    return (
      <div className="text-center py-12">
        <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No property taxes found</h3>
        <p className="mt-2 text-muted-foreground">This unit doesn&apos;t have any property tax records yet.</p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 bg-transparent" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Record
            </Button>
          </DialogTrigger>
          <DialogContent
            className="!w-[650px] !max-w-[650px] !min-w-[650px]"
            style={{ width: "650px", maxWidth: "650px", minWidth: "650px" }}
          >
            <DialogHeader>
              <DialogTitle>Add Space RPT Record</DialogTitle>
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
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Taxes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTaxes}</div>
            <p className="text-xs text-muted-foreground">₱{totalAmount.toLocaleString()} total amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Taxes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidTaxes}</div>
            <p className="text-xs text-muted-foreground">₱{paidAmount.toLocaleString()} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Taxes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unpaidTaxes}</div>
            <p className="text-xs text-muted-foreground">₱{unpaidAmount.toLocaleString()} unpaid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Taxes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTaxes}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Property Tax Records</CardTitle>
          <CardDescription>Manage and track all property tax payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by Tax Dec No or Year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="min-w-[140px]">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="unpaid">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Unpaid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="overdue">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span>Overdue</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Label className="text-sm font-medium">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tax
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="!w-[650px] !max-w-[650px] !min-w-[650px]"
                  style={{ width: "650px", maxWidth: "650px", minWidth: "650px" }}
                >
                  <DialogHeader>
                    <DialogTitle>Add Space RPT Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <CreateUnitTaxForm
                      unitId={unit.id}
                      onSuccess={handleTaxCreated}
                      onCancel={() => setIsAddDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tax Records Table */}
          <div className="border rounded-lg">
            {filteredTaxes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tax records match your search criteria.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTaxes.map((tax) => (
                  <div key={tax.id} className="p-4 hover:bg-muted/50 transition-colors">
                    {/* Main Row */}
                    <div className="flex items-center justify-between">
                      {/* Table-like columns */}
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        {/* Tax Dec No Column */}
                        <div className="text-center min-w-[120px]">
                          <div className="font-mono font-semibold text-sm bg-muted px-2 py-1 rounded">
                            {tax.taxDecNo}
                          </div>
                          <div className="text-xs text-muted-foreground">Tax Dec No</div>
                        </div>

                        {/* Amount Column */}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold mb-1">₱{tax.taxAmount.toLocaleString()}</div>
                          {tax.isQuarterly && tax.whatQuarter && (
                            <div className="text-sm text-muted-foreground">{tax.whatQuarter} Quarter</div>
                          )}
                        </div>

                        {/* Year Column */}
                        <div className="text-center min-w-[60px]">
                          <div className="text-lg font-bold">{tax.taxYear}</div>
                          <div className="text-xs text-muted-foreground">Year</div>
                        </div>

                        {/* Due Date Column */}
                        <div className="text-center min-w-[100px]">
                          <div
                            className={`font-medium ${!tax.isPaid && new Date(tax.dueDate) < new Date() ? "text-destructive" : ""}`}
                          >
                            {format(new Date(tax.dueDate), "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">Due Date</div>
                        </div>

                        {/* Status Column */}
                        <div className="text-center min-w-[100px]">{getStatusBadge(tax)}</div>

                        {/* Actions Column */}
                        <div className="flex space-x-2 min-w-[120px] justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEditTax(tax)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {!tax.isPaid && (
                            <Button size="sm" onClick={() => handleMarkAsPaid(tax)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info Row */}
                    {((tax.isPaid && tax.paidDate) || tax.remarks) && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {tax.isPaid && tax.paidDate && (
                            <div className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              <span>Paid on {format(new Date(tax.paidDate), "MMM dd, yyyy")}</span>
                            </div>
                          )}
                          {tax.remarks && (
                            <div className="flex items-start space-x-2 flex-1">
                              <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Remarks:</span>
                                <p className="text-sm">{tax.remarks}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredTaxes.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredTaxes.length} of {totalTaxes} tax records
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Tax Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="!w-[650px] !max-w-[650px] !min-w-[650px]"
          style={{ width: "650px", maxWidth: "650px", minWidth: "650px" }}
        >
          <DialogHeader>
            <DialogTitle>Edit Space RPT Record</DialogTitle>
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

      {/* Mark as Paid Dialog */}
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
