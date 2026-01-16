import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Receipt, CheckCircle, Clock, AlertCircle, Plus, Search, Edit, FileText, Calendar, CheckCircle2, Hash, DollarSign } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateTaxForm } from "./create-tax-form"
import { EditTaxForm } from "./edit-tax-form"
import { MarkPaidDialog } from "./mark-paid-dialog"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface RealPropertyTaxProps {
  property: PropertyWithDetails
}

export function RealPropertyTax({ property }: RealPropertyTaxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid" | "overdue">("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingTax, setEditingTax] = useState<any>(null)
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [markingPaidTax, setMarkingPaidTax] = useState<any>(null)

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditTax = (tax: any) => {
    setEditingTax(tax)
    setIsEditDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMarkAsPaid = (tax: any) => {
    setMarkingPaidTax(tax)
    setIsMarkPaidDialogOpen(true)
  }

  // Collect all property taxes from all titles
  const allPropertyTaxes = property.titles.flatMap(title => 
    title.propertyTaxes.map(tax => ({
      ...tax,
      titleNo: title.titleNo,
      lotNo: title.lotNo,
      registeredOwner: title.registeredOwner
    }))
  )

  // Filter taxes based on search and filters
  const filteredTaxes = allPropertyTaxes.filter(tax => {
    const matchesSearch = searchTerm === "" || 
      tax.TaxDecNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.titleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.registeredOwner.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "paid" && tax.isPaid) ||
      (filterStatus === "unpaid" && !tax.isPaid) ||
      (filterStatus === "overdue" && !tax.isPaid && new Date(tax.dueDate) < new Date())

    const matchesYear = selectedYear === "all" || tax.taxYear.toString() === selectedYear

    return matchesSearch && matchesStatus && matchesYear
  })

  // Calculate summary statistics
  const totalTaxes = allPropertyTaxes.length
  const paidTaxes = allPropertyTaxes.filter(tax => tax.isPaid).length
  const unpaidTaxes = allPropertyTaxes.filter(tax => !tax.isPaid).length
  const overdueTaxes = allPropertyTaxes.filter(tax => !tax.isPaid && new Date(tax.dueDate) < new Date()).length
  const totalAmount = allPropertyTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0)
  const paidAmount = allPropertyTaxes.filter(tax => tax.isPaid).reduce((sum, tax) => sum + tax.taxAmount, 0)
  const unpaidAmount = allPropertyTaxes.filter(tax => !tax.isPaid).reduce((sum, tax) => sum + tax.taxAmount, 0)

  // Get unique years for filter
  const availableYears = [...new Set(allPropertyTaxes.map(tax => tax.taxYear))].sort((a, b) => b - a)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusStyle = (tax: any) => {
    if (tax.isPaid) {
      return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500' }
    } else if (new Date(tax.dueDate) < new Date()) {
      return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-500' }
    } else {
      return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-500' }
    }
  }

  // Prepare titles for dropdown
  const titleOptions = property.titles.map(t => ({
    id: t.id,
    titleNo: t.titleNo,
    lotNo: t.lotNo,
    registeredOwner: t.registeredOwner
  }))

  if (allPropertyTaxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Receipt className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Tax Records Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          {property.titles.length > 0 ? "ADD_FIRST_RECORD" : "REGISTER_TITLE_FIRST"}
        </p>
        {property.titles.length > 0 ? (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
                <Plus className="h-3 w-3 mr-2" />
                Add Tax Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-none border-border">
              <DialogHeader>
                <DialogTitle className="font-mono uppercase tracking-wide">Add Property Tax Record</DialogTitle>
              </DialogHeader>
              <CreateTaxForm 
                titles={titleOptions}
                onSuccess={handleTaxCreated}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Button variant="outline" className="rounded-none h-9 text-xs font-mono uppercase tracking-wider opacity-50 cursor-not-allowed">
            Add Title First
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Records</span>
            <Receipt className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">{totalTaxes}</span>
            <span className="text-[10px] text-muted-foreground ml-2">₱{totalAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Paid</span>
            <CheckCircle className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{paidTaxes}</span>
            <span className="text-[10px] text-muted-foreground ml-2">₱{paidAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Unpaid</span>
            <Clock className="h-4 w-4 text-amber-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-amber-600">{unpaidTaxes}</span>
            <span className="text-[10px] text-muted-foreground ml-2">₱{unpaidAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Overdue</span>
            <AlertCircle className="h-4 w-4 text-rose-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-rose-600">{overdueTaxes}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Critical</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Property Taxes
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Real Property Tax Registry
          </p>
        </div>
        {property.titles.length > 0 && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
                <Plus className="h-3 w-3 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-none border-border">
              <DialogHeader>
                <DialogTitle className="font-mono uppercase tracking-wide">Add Property Tax Record</DialogTitle>
              </DialogHeader>
              <CreateTaxForm 
                titles={titleOptions}
                onSuccess={handleTaxCreated}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
          />
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
            <SelectTrigger className="w-[120px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Year: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()} className="font-mono text-xs">{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tax Records Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTaxes.map((tax) => {
          const styles = getStatusStyle(tax)
          return (
            <Card key={tax.id} className="group rounded-none border border-border hover:border-primary/50 transition-all hover:shadow-none bg-background overflow-hidden h-full flex flex-col relative cursor-pointer" onClick={() => handleEditTax(tax)}>
              {/* Status Line */}
              <div className={`h-1 w-full ${styles.bg}`} />
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Tax Year</span>
                    <span className="font-mono text-xl font-bold tracking-tight">{tax.taxYear}</span>
                  </div>
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border ${styles.border} ${styles.text} bg-transparent`}>
                    {tax.isPaid ? 'PAID' : (new Date(tax.dueDate) < new Date() ? 'OVERDUE' : 'UNPAID')}
                  </Badge>
                </div>

                <div className="space-y-3 pt-2 border-t border-dashed border-border/50">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Hash className="h-3 w-3" /> Decl. No
                    </span>
                    <span className="font-medium">{tax.TaxDecNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Amount
                    </span>
                    <span className="font-medium">₱{tax.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Due
                    </span>
                    <span className={cn("font-medium", !tax.isPaid && new Date(tax.dueDate) < new Date() ? "text-rose-600" : "")}>
                      {format(new Date(tax.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-border/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate bg-muted/10 p-1.5 border border-border/30">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{tax.titleNo}</span>
                  </div>

                  {!tax.isPaid && (
                    <Button 
                      size="sm" 
                      className="w-full rounded-none h-7 text-[10px] font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 mt-2 z-10 relative"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsPaid(tax)
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1.5" />
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Hover Action Overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border p-1">
                <Edit className="h-3 w-3 text-muted-foreground" />
              </div>
            </Card>
          )
        })}
      </div>

      {filteredTaxes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching records found</p>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl rounded-none border-border">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">Edit Tax Record</DialogTitle>
          </DialogHeader>
          {editingTax && (
            <EditTaxForm 
              tax={editingTax}
              onSuccess={handleTaxUpdated}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {markingPaidTax && (
        <MarkPaidDialog
          isOpen={isMarkPaidDialogOpen}
          onOpenChange={setIsMarkPaidDialogOpen}
          taxId={markingPaidTax.id}
          taxDecNo={markingPaidTax.TaxDecNo}
          taxAmount={markingPaidTax.taxAmount}
          onSuccess={handleTaxMarkedPaid}
        />
      )}
    </div>
  )
}