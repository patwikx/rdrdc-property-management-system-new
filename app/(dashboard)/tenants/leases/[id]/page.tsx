"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Edit, Save, Trash2, FileCheck, Building, Users, Calendar, DollarSign, AlertTriangle, History, TrendingUp, Shield } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getLeaseById, updateLease, terminateLease, deleteLease, LeaseWithDetails } from "@/lib/actions/lease-actions"
import { getRateHistory, type RateHistoryWithDetails } from "@/lib/actions/rate-actions"
import { RateHistory, RateHistoryCompact } from "@/components/rate-management/rate-history"
import { RateChangeForm } from "@/components/rate-management/rate-change-form"
import { RateOverrideForm } from "@/components/rate-management/rate-override-form"
import { LeaseUpdateSchema, LeaseUpdateFormData, LeaseTerminationSchema, LeaseTerminationFormData } from "@/lib/validations/lease-schema"
import { LeaseStatus } from "@prisma/client"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"

interface LeasePageProps {
  params: Promise<{
    id: string
  }>
}

function getLeaseStatusColor(status: LeaseStatus) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600'
    case 'PENDING': return 'bg-yellow-600'
    case 'TERMINATED': return 'bg-red-600'
    case 'EXPIRED': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-green-600'
    case 'PENDING': return 'bg-yellow-600'
    case 'FAILED': return 'bg-red-600'
    case 'REFUNDED': return 'bg-blue-600'
    default: return 'bg-gray-600'
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
    
    if (!confirm("Are you sure you want to delete this lease? This action cannot be undone.")) {
      return
    }
    
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
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0 && lease.status === 'ACTIVE'
  const isExpired = daysUntilExpiry < 0 && lease.status === 'ACTIVE'

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight">Lease Agreement</h2>
              <Badge className={getLeaseStatusColor(lease.status)}>
                {lease.status}
              </Badge>
              {isExpiringSoon && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Expiring in {daysUntilExpiry} days
                </Badge>
              )}
              {isExpired && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Expired
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {tenantName} • {lease.tenant.bpCode}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {lease.status === 'ACTIVE' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowTerminateDialog(true)}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Terminate
                </Button>
              )}
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={updateForm.handleSubmit(onUpdate)} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Spaces</TabsTrigger>
          <TabsTrigger value="rate-history">Rate History</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₱{lease.totalRentAmount.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Security Deposit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{lease.securityDeposit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deposit amount
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leased Spaces</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {lease.leaseUnits.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Spaces included
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      daysUntilExpiry < 0 ? 'text-red-600' : 
                      daysUntilExpiry <= 30 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {daysUntilExpiry < 0 ? 'Expired' : daysUntilExpiry}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)} days ago` : 'Until expiry'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lease Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5" />
                    <span>Lease Details</span>
                  </CardTitle>
                  <CardDescription>
                    Complete lease agreement information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Form {...updateForm}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={updateForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
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
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
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
                              <FormLabel>Security Deposit</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
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
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                        <p className="text-sm">{format(new Date(lease.startDate), 'MMMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <p className="text-sm">{format(new Date(lease.endDate), 'MMMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Duration</label>
                        <p className="text-sm">
                          {Math.ceil(differenceInDays(new Date(lease.endDate), new Date(lease.startDate)) / 30)} months
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="text-sm">{format(new Date(lease.createdAt), 'MMMM dd, yyyy')}</p>
                      </div>
                      {lease.terminationDate && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Termination Date</label>
                            <p className="text-sm">{format(new Date(lease.terminationDate), 'MMMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Termination Reason</label>
                            <p className="text-sm">{lease.terminationReason || 'Not specified'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>  
          {/* Sidebar - Tenant Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Tenant Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tenant Name</label>
                    <p className="text-sm font-medium">{tenantName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">BP Code</label>
                    <p className="text-sm font-mono">{lease.tenant.bpCode}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Company</label>
                    <p className="text-sm">{lease.tenant.company}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{lease.tenant.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="outline">{lease.tenant.status}</Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Link href={`/tenants/${lease.tenant.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Tenant Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Leased Spaces</span>
              </CardTitle>
              <CardDescription>
                Spaces included in this lease agreement. You can request rate changes or overrides for each space.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lease.leaseUnits.map((leaseUnit) => (
                  <div key={leaseUnit.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{leaseUnit.unit.unitNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {leaseUnit.unit.property.propertyName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {leaseUnit.unit.totalArea} sqm • {leaseUnit.unit.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₱{leaseUnit.rentAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                    
                    {/* Rate Management Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {currentUserId && lease.status === 'ACTIVE' ? (
                          <>
                            <RateChangeForm
                              leaseUnitId={leaseUnit.id}
                              currentRate={leaseUnit.rentAmount}
                              requestedById={currentUserId}
                              onSuccess={() => {
                                loadRateHistory(lease.leaseUnits)
                              }}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Request Rate Change
                                </Button>
                              }
                            />
                            <RateOverrideForm
                              leaseUnitId={leaseUnit.id}
                              requestedById={currentUserId}
                              onSuccess={() => {
                                loadRateHistory(lease.leaseUnits)
                              }}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <Shield className="h-4 w-4 mr-2" />
                                  Request Override
                                </Button>
                              }
                            />
                          </>
                        ) : !currentUserId && lease.status === 'ACTIVE' ? (
                          <span className="text-sm text-muted-foreground">
                            Loading user session...
                          </span>
                        ) : lease.status !== 'ACTIVE' ? (
                          <span className="text-sm text-muted-foreground">
                            Rate changes only available for active leases
                          </span>
                        ) : null}
                      </div>
                      <Link href={`/properties/${leaseUnit.unit.property.id}/units/${leaseUnit.unit.id}`}>
                        <Button variant="outline" size="sm">
                          View Space
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-history" className="space-y-6">
          {lease.leaseUnits.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Rate History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No spaces in this lease</h3>
                  <p className="mt-2 text-muted-foreground">
                    Rate history will appear here once spaces are added to the lease.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Unit selector for rate history */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Rate History by Space</span>
                  </CardTitle>
                  <CardDescription>
                    Select a space to view its rate change history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lease.leaseUnits.map((leaseUnit) => {
                      const historyCount = rateHistoryByUnit[leaseUnit.id]?.length || 0
                      return (
                        <Button
                          key={leaseUnit.id}
                          variant={selectedUnitForHistory === leaseUnit.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedUnitForHistory(
                            selectedUnitForHistory === leaseUnit.id ? null : leaseUnit.id
                          )}
                        >
                          <Building className="h-4 w-4 mr-2" />
                          {leaseUnit.unit.unitNumber}
                          {historyCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {historyCount}
                            </Badge>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Rate history display */}
              {selectedUnitForHistory ? (
                <RateHistory
                  leaseUnitId={selectedUnitForHistory}
                  history={rateHistoryByUnit[selectedUnitForHistory] || []}
                />
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <History className="mx-auto h-12 w-12 mb-4" />
                      <p>Select a space above to view its rate history</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary of all rate changes */}
              <Card>
                <CardHeader>
                  <CardTitle>All Rate Changes Summary</CardTitle>
                  <CardDescription>
                    Quick overview of recent rate changes across all spaces
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lease.leaseUnits.map((leaseUnit) => {
                      const history = rateHistoryByUnit[leaseUnit.id] || []
                      return (
                        <div key={leaseUnit.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{leaseUnit.unit.unitNumber}</span>
                              <span className="text-sm text-muted-foreground">
                                ({leaseUnit.unit.property.propertyName})
                              </span>
                            </div>
                            <div className="text-sm">
                              Current: <span className="font-medium">₱{leaseUnit.rentAmount.toLocaleString()}</span>
                            </div>
                          </div>
                          <RateHistoryCompact history={history} maxItems={3} />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Payment History</span>
              </CardTitle>
              <CardDescription>
                Payment records for this lease
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lease.payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No payments recorded</h3>
                  <p className="mt-2 text-muted-foreground">
                    Payment history will appear here once payments are made.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lease.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">₱{payment.amount.toLocaleString()}</h3>
                          <p className="text-sm text-muted-foreground">
                            {payment.paymentType} • {payment.paymentMethod}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.paymentDate), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getPaymentStatusColor(payment.paymentStatus)}>
                        {payment.paymentStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5" />
                <span>Lease Documents</span>
              </CardTitle>
              <CardDescription>
                Documents related to this lease agreement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No documents uploaded</h3>
                <p className="mt-2 text-muted-foreground">
                  Lease documents and attachments will appear here.
                </p>
                <Button className="mt-4" variant="outline">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Terminate Lease Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Lease</DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate this lease? This action will mark the lease as terminated and make the spaces available.
            </DialogDescription>
          </DialogHeader>
          <Form {...terminationForm}>
            <form onSubmit={terminationForm.handleSubmit(onTerminate)} className="space-y-4">
              <FormField
                control={terminationForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termination Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason for terminating this lease..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTerminateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Terminating...
                    </>
                  ) : (
                    'Terminate Lease'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}