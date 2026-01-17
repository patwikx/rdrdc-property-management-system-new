"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Edit, Save, Trash2, FileCheck, Building, Calendar, DollarSign, AlertTriangle, History, ChevronRight, X, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { getLeaseById, updateLease, terminateLease, deleteLease, LeaseWithDetails } from "@/lib/actions/lease-actions"
import { getRateHistory, type RateHistoryWithDetails } from "@/lib/actions/rate-actions"
import { RateHistory } from "@/components/rate-management/rate-history"
import { RateChangeForm } from "@/components/rate-management/rate-change-form"
import { RateOverrideForm } from "@/components/rate-management/rate-override-form"
import { LeaseUpdateSchema, LeaseUpdateFormData, LeaseTerminationSchema, LeaseTerminationFormData } from "@/lib/validations/lease-schema"
import { LeaseStatus } from "@prisma/client"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

interface LeasePageProps {
  params: Promise<{
    id: string
  }>
}

function getLeaseStatusColor(status: LeaseStatus) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'TERMINATED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
    case 'EXPIRED': return 'bg-slate-500/10 text-slate-600 border-slate-500/20'
    default: return 'bg-muted/10 text-muted-foreground border-border'
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'FAILED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
    case 'REFUNDED': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    default: return 'bg-muted/10 text-muted-foreground border-border'
  }
}

export default function LeaseDetailPage({ params }: LeasePageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [lease, setLease] = useState<LeaseWithDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [leaseId, setLeaseId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [rateHistoryByUnit, setRateHistoryByUnit] = useState<Record<string, RateHistoryWithDetails[]>>({})
  const [selectedUnitForHistory, setSelectedUnitForHistory] = useState<string | null>(null)

  // Get current user ID for rate change requests
  const currentUserId = session?.user?.id

  const updateForm = useForm<LeaseUpdateFormData>({
    resolver: zodResolver(LeaseUpdateSchema),
    defaultValues: {
      id: "",
      startDate: new Date(),
      endDate: new Date(),
      securityDeposit: 0,
      status: 'PENDING'
    },
  })

  const terminationForm = useForm<LeaseTerminationFormData>({
    resolver: zodResolver(LeaseTerminationSchema),
    defaultValues: {
      id: "",
      reason: ""
    }
  })

  // Function to load rate history for all lease units
  const loadRateHistory = useCallback(async (leaseUnits: { id: string }[]) => {
    const historyMap: Record<string, RateHistoryWithDetails[]> = {}
    await Promise.all(
      leaseUnits.map(async (leaseUnit) => {
        const history = await getRateHistory(leaseUnit.id)
        historyMap[leaseUnit.id] = history
      })
    )
    setRateHistoryByUnit(historyMap)
  }, [])

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params
      setLeaseId(resolvedParams.id)
    }
    
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!leaseId) return

    async function loadLease() {
      try {
        const leaseData = await getLeaseById(leaseId)
        if (!leaseData) {
          toast.error("Lease not found")
          router.push("/tenants/leases")
          return
        }
        
        setLease(leaseData)
        updateForm.reset({
          id: leaseData.id,
          startDate: new Date(leaseData.startDate),
          endDate: new Date(leaseData.endDate),
          securityDeposit: leaseData.securityDeposit,
          status: leaseData.status
        })
        terminationForm.reset({
          id: leaseData.id,
          reason: ""
        })
        
        // Load rate history for all lease units
        if (leaseData.leaseUnits.length > 0) {
          loadRateHistory(leaseData.leaseUnits)
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to load lease")
        router.push("/tenants/leases")
      } finally {
        setIsLoading(false)
      }
    }

    loadLease()
  }, [leaseId, router, updateForm, terminationForm, loadRateHistory])

  async function onUpdate(data: LeaseUpdateFormData) {
    if (!lease) return
    
    setIsSaving(true)
    
    try {
      const result = await updateLease(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Lease updated successfully")
        setIsEditing(false)
        // Reload lease data
        const updatedLease = await getLeaseById(leaseId)
        if (updatedLease) {
          setLease(updatedLease)
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  async function onTerminate(data: LeaseTerminationFormData) {
    setIsSaving(true)
    
    try {
      const result = await terminateLease(data.id, data.reason)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Lease terminated successfully")
        setShowTerminateDialog(false)
        // Reload lease data
        const updatedLease = await getLeaseById(leaseId)
        if (updatedLease) {
          setLease(updatedLease)
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to terminate lease")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!lease) return
    
    setIsDeleting(true)
    
    try {
      const result = await deleteLease(lease.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Lease deleted successfully")
        router.push("/tenants/leases")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete lease")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!lease) {
    return null
  }

  const tenantName = lease.tenant.firstName && lease.tenant.lastName 
    ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
    : lease.tenant.businessName || lease.tenant.company

  const daysUntilExpiry = differenceInDays(new Date(lease.endDate), new Date())

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileCheck },
    { id: 'units', label: `Spaces (${lease.leaseUnits.length})`, icon: Building },
    { id: 'rate-history', label: 'Rate History', icon: History },
    { id: 'payments', label: `Payments (${lease.payments.length})`, icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileCheck },
  ]

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-mono uppercase flex items-center gap-3">
              LEASE-{lease.id.slice(0, 8)}
              <Badge variant="outline" className={cn("rounded-none text-xs uppercase tracking-widest border-0 px-2 py-0.5", getLeaseStatusColor(lease.status))}>
                {lease.status}
              </Badge>
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
              <span className="uppercase tracking-wide">{lease.tenant.bpCode}</span>
              <span className="text-border">|</span>
              <span>{tenantName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Contract
                </Button>
                {lease.status === 'ACTIVE' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTerminateDialog(true)}
                    className="rounded-none h-9 text-xs font-mono uppercase tracking-wider text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    <AlertTriangle className="h-3 w-3 mr-2" />
                    Terminate
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="rounded-none h-9 text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-700"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-none border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-mono uppercase tracking-wide">Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this lease contract? This action cannot be undone and will remove all associated records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-none border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="rounded-none bg-rose-600 hover:bg-rose-700" disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete Lease"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border">
                  <X className="h-3 w-3 mr-2" />
                  Cancel
                </Button>
                <Button onClick={updateForm.handleSubmit(onUpdate)} disabled={isSaving} className="rounded-none h-9 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSaving ? "Saving..." : <><Save className="h-3 w-3 mr-2" /> Save Changes</>}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Monthly Rent</span>
              <DollarSign className="h-4 w-4 text-emerald-600/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">
                ₱{lease.totalRentAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Deposit</span>
              <DollarSign className="h-4 w-4 text-blue-600/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">
                ₱{lease.securityDeposit.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Spaces</span>
              <Building className="h-4 w-4 text-purple-600/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter text-purple-600">
                {lease.leaseUnits.length}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">Units</span>
            </div>
          </div>
          <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Remaining</span>
              <Calendar className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div>
              <span className={`text-2xl font-mono font-medium tracking-tighter ${daysUntilExpiry < 0 ? 'text-rose-600' : daysUntilExpiry <= 30 ? 'text-amber-600' : ''}`}>
                {daysUntilExpiry < 0 ? 'Expired' : daysUntilExpiry}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="border-b border-border w-full overflow-x-auto">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              {/* Contract Terms */}
              <div className="border border-border bg-background">
                <div className="border-b border-border bg-muted/10 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <FileCheck className="h-3 w-3" />
                    Contract Terms
                  </span>
                </div>
                <div className="p-6">
                  {isEditing ? (
                    <Form {...updateForm}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={updateForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest">Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(new Date(e.target.value))} className="rounded-none h-9 font-mono text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={updateForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest">End Date</FormLabel>
                              <FormControl>
                                <Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(new Date(e.target.value))} className="rounded-none h-9 font-mono text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={updateForm.control}
                          name="securityDeposit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest">Security Deposit</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="rounded-none h-9 font-mono text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={updateForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase tracking-widest">Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="rounded-none h-9 font-mono text-sm"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent className="rounded-none">
                                  <SelectItem value="PENDING">Pending</SelectItem>
                                  <SelectItem value="ACTIVE">Active</SelectItem>
                                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                                  <SelectItem value="EXPIRED">Expired</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="text-[10px] uppercase text-muted-foreground tracking-widest block mb-1">Duration</label>
                        <div className="font-mono text-sm">
                          {format(new Date(lease.startDate), 'MMM dd, yyyy')} - {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.ceil(differenceInDays(new Date(lease.endDate), new Date(lease.startDate)) / 30)} months
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-muted-foreground tracking-widest block mb-1">Financials</label>
                        <div className="font-mono text-sm">Rent: ₱{lease.totalRentAmount.toLocaleString()}</div>
                        <div className="font-mono text-sm text-muted-foreground">Dep: ₱{lease.securityDeposit.toLocaleString()}</div>
                      </div>
                      {lease.terminationDate && (
                        <div className="col-span-2 border-t border-dashed border-border pt-4 mt-2">
                          <label className="text-[10px] uppercase text-rose-600 tracking-widest block mb-1">Termination Details</label>
                          <div className="font-mono text-sm text-rose-600">Terminated on {format(new Date(lease.terminationDate), 'MMM dd, yyyy')}</div>
                          <p className="text-sm mt-1">{lease.terminationReason || 'No reason specified'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="border border-border bg-background">
                <div className="border-b border-border bg-muted/10 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Tenant Party
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Name</label>
                    <div className="font-medium text-sm">{tenantName}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">BP Code</label>
                    <div className="font-mono text-sm">{lease.tenant.bpCode}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Contact</label>
                    <div className="text-sm truncate">{lease.tenant.email}</div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Link href={`/tenants/${lease.tenant.id}`}>
                      <Button variant="outline" className="w-full rounded-none h-8 text-xs font-mono uppercase tracking-wider">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeTab === 'units' && (
          <div className="space-y-4">
            <div className="border border-border bg-background p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Leased Spaces</h3>
              <div className="grid gap-4">
                {lease.leaseUnits.map((leaseUnit) => (
                  <div key={leaseUnit.id} className="border border-border p-4 hover:bg-muted/5 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/10 border border-border">
                          <Building className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <h4 className="font-mono font-bold text-sm">{leaseUnit.unit.unitNumber}</h4>
                          <p className="text-xs text-muted-foreground">{leaseUnit.unit.property.propertyName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm">₱{leaseUnit.rentAmount.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">/ MONTH</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
                      <div className="flex gap-2">
                        {currentUserId && lease.status === 'ACTIVE' && (
                          <>
                            <RateChangeForm
                              leaseUnitId={leaseUnit.id}
                              currentRate={leaseUnit.rentAmount}
                              requestedById={currentUserId}
                              onSuccess={() => loadRateHistory(lease.leaseUnits)}
                              trigger={
                                <Button variant="outline" size="sm" className="rounded-none h-7 text-[10px] uppercase font-mono">
                                  Request Change
                                </Button>
                              }
                            />
                            <RateOverrideForm
                              leaseUnitId={leaseUnit.id}
                              requestedById={currentUserId}
                              onSuccess={() => loadRateHistory(lease.leaseUnits)}
                              trigger={
                                <Button variant="outline" size="sm" className="rounded-none h-7 text-[10px] uppercase font-mono">
                                  Override
                                </Button>
                              }
                            />
                          </>
                        )}
                      </div>
                      <Link href={`/properties/${leaseUnit.unit.property.id}/units/${leaseUnit.unit.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-none h-7 text-[10px] uppercase font-mono hover:bg-transparent hover:underline">
                          View Details <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rate History Tab */}
        {activeTab === 'rate-history' && (
          <div className="space-y-6">
            <div className="border border-border bg-background p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Rate History</h3>
              {lease.leaseUnits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No spaces in this lease</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {lease.leaseUnits.map((leaseUnit) => {
                      const historyCount = rateHistoryByUnit[leaseUnit.id]?.length || 0
                      return (
                        <Button
                          key={leaseUnit.id}
                          variant={selectedUnitForHistory === leaseUnit.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedUnitForHistory(selectedUnitForHistory === leaseUnit.id ? null : leaseUnit.id)}
                          className="rounded-none h-8 text-xs font-mono uppercase"
                        >
                          {leaseUnit.unit.unitNumber}
                          {historyCount > 0 && <Badge variant="secondary" className="ml-2 rounded-none px-1 h-4">{historyCount}</Badge>}
                        </Button>
                      )
                    })}
                  </div>

                  {selectedUnitForHistory ? (
                    <RateHistory history={rateHistoryByUnit[selectedUnitForHistory] || []} />
                  ) : (
                    <div className="border border-dashed border-border p-12 text-center">
                      <History className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Select a space above to view its rate history</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="border border-border bg-background p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Payment History</h3>
              {lease.payments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border bg-muted/5">
                  <DollarSign className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No payments recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lease.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border border-border bg-muted/5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 border border-green-500/20">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm">₱{payment.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{payment.paymentType} • {payment.paymentMethod}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={cn("rounded-none text-[9px] uppercase tracking-widest mb-1", getPaymentStatusColor(payment.paymentStatus))}>
                          {payment.paymentStatus}
                        </Badge>
                        <div className="text-[10px] font-mono text-muted-foreground">{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="border border-border bg-background p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Lease Documents</h3>
              <div className="text-center py-12 border border-dashed border-border bg-muted/5">
                <FileCheck className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No documents uploaded</p>
                <Button variant="outline" className="rounded-none h-8 text-xs font-mono uppercase">
                  Upload Document
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminate Lease Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent className="rounded-none border-border">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase tracking-wide">Terminate Lease</DialogTitle>
            <DialogDescription>
              Mark this lease as terminated. This will free up the associated spaces.
            </DialogDescription>
          </DialogHeader>
          <Form {...terminationForm}>
            <form onSubmit={terminationForm.handleSubmit(onTerminate)} className="space-y-4">
              <FormField
                control={terminationForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wide">Termination Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason..."
                        {...field}
                        className="rounded-none border-border min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTerminateDialog(false)} className="rounded-none border-border">
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isSaving} className="rounded-none bg-orange-600 hover:bg-orange-700">
                  {isSaving ? "Processing..." : "Confirm Termination"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}