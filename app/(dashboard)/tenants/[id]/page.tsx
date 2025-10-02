"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Save, Trash2, User, Building, Phone, Mail, FileText, Wrench, CreditCard, Home } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTenantByIdAction, updateTenantAction, deleteTenantAction } from "@/lib/actions/tenant-server-actions"
import { TenantWithDetails } from "@/lib/actions/tenant-actions"

import { toast } from "sonner"
import { format } from "date-fns"
import { z } from "zod"
import { TenantPDCSection } from "@/components/tenants/tenant-pdc-section"
import { TenantNoticesSection } from "@/components/tenants/tenant-notices-section"

const TenantUpdateSchema = z.object({
  bpCode: z.string().min(1, "BP Code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  businessName: z.string().min(1, "Business name is required"),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
})

type TenantUpdateData = z.infer<typeof TenantUpdateSchema>

interface TenantPageProps {
  params: Promise<{
    id: string
  }>
}

function getTenantStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE': return 'default' as const
    case 'PENDING': return 'secondary' as const
    case 'INACTIVE': return 'outline' as const
    default: return 'outline' as const
  }
}

function getLeaseStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE': return 'default' as const
    case 'PENDING': return 'secondary' as const
    case 'TERMINATED': return 'destructive' as const
    case 'EXPIRED': return 'outline' as const
    default: return 'outline' as const
  }
}

function getMaintenanceStatusVariant(status: string) {
  switch (status) {
    case 'PENDING': return 'secondary' as const
    case 'ASSIGNED': return 'outline' as const
    case 'IN_PROGRESS': return 'secondary' as const
    case 'COMPLETED': return 'default' as const
    case 'CANCELLED': return 'outline' as const
    default: return 'outline' as const
  }
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'EMERGENCY': return 'destructive' as const
    case 'HIGH': return 'destructive' as const
    case 'MEDIUM': return 'secondary' as const
    case 'LOW': return 'outline' as const
    default: return 'outline' as const
  }
}

export default function TenantPage({ params }: TenantPageProps) {
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantWithDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [tenantId, setTenantId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")

  const form = useForm<TenantUpdateData>({
    resolver: zodResolver(TenantUpdateSchema),
    defaultValues: {
      bpCode: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      company: "",
      businessName: "",
      status: 'PENDING',
    },
  })

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params
      setTenantId(resolvedParams.id)
    }
    
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!tenantId) return

    async function loadTenant() {
      try {
        const tenantData = await getTenantByIdAction(tenantId)
        if (!tenantData) {
          toast.error("Tenant not found")
          router.push("/tenants")
          return
        }
        
        setTenant(tenantData)
        form.reset({
          bpCode: tenantData.bpCode,
          firstName: tenantData.firstName || "",
          lastName: tenantData.lastName || "",
          email: tenantData.email,
          phone: tenantData.phone,
          emergencyContactName: tenantData.emergencyContactName || "",
          emergencyContactPhone: tenantData.emergencyContactPhone || "",
          company: tenantData.company,
          businessName: tenantData.businessName,
          status: tenantData.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
        })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to load tenant")
        router.push("/tenants")
      } finally {
        setIsLoading(false)
      }
    }

    loadTenant()
  }, [tenantId, router, form])

  async function onSubmit(data: TenantUpdateData) {
    if (!tenant) return
    
    setSaving(true)
    
    try {
      const result = await updateTenantAction(tenant.id, data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof TenantUpdateData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Tenant updated successfully")
        setIsEditing(false)
        // Reload tenant data
        const updatedTenant = await getTenantByIdAction(tenantId)
        if (updatedTenant) {
          setTenant(updatedTenant)
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!tenant) return
    
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const result = await deleteTenantAction(tenant.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Tenant deleted successfully")
        router.push("/tenants")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete tenant")
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

  if (!tenant) {
    return null
  }

  const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
  const totalUnits = activeLease?.leaseUnits.length || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {tenant.firstName} {tenant.lastName}
              </h2>
              <Badge variant={getTenantStatusVariant(tenant.status)}>
                {tenant.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {tenant.bpCode} • {tenant.company}
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
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leases">Leases</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {tenant.leases.filter(l => l.status === 'ACTIVE').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {totalUnits} unit{totalUnits !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₱{activeLease?.totalRentAmount.toLocaleString() || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current lease
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {tenant.maintenanceRequests.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {tenant.documents.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Files uploaded
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Lease Details */}
              {activeLease && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Home className="h-5 w-5" />
                      <span>Active Lease</span>
                      <Badge variant={getLeaseStatusVariant(activeLease.status)}>
                        {activeLease.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Current lease agreement details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Lease Period</label>
                        <p className="text-sm">
                          {format(new Date(activeLease.startDate), 'MMM dd, yyyy')} - {format(new Date(activeLease.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Security Deposit</label>
                        <p className="text-sm">₱{activeLease.securityDeposit.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {activeLease.leaseUnits.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Leased Units</label>
                        <div className="mt-2 space-y-2">
                          {activeLease.leaseUnits.map((leaseUnit) => (
                            <div key={leaseUnit.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="bg-primary/10 p-2 rounded">
                                  <Building className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{leaseUnit.unit.unitNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {leaseUnit.unit.property.propertyName}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₱{leaseUnit.rentAmount.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">per month</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Maintenance Requests */}
              {tenant.maintenanceRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wrench className="h-5 w-5" />
                      <span>Recent Maintenance Requests</span>
                    </CardTitle>
                    <CardDescription>
                      Latest maintenance requests from this tenant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tenant.maintenanceRequests.slice(0, 5).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-2">
                              <Badge variant={getMaintenanceStatusVariant(request.status)}>
                                {request.status}
                              </Badge>
                              <Badge variant={getPriorityVariant(request.priority)}>
                                {request.priority}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">{request.category}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {request.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Business Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <Form {...form}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">


                          <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Company</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Business Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="bpCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">BP Code</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8 font-mono" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">Active</SelectItem>
                                  <SelectItem value="PENDING">Pending</SelectItem>
                                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Company</label>
                        <p className="text-sm">{tenant.company}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Business Name</label>
                        <p className="text-sm">{tenant.businessName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge className={(tenant.status)} variant="outline">
                            {tenant.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Member Since</label>
                        <p className="text-sm">{format(new Date(tenant.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <Form {...form}>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Phone</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Emergency Contact</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Name" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Emergency Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Phone" className="h-8" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{tenant.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{tenant.phone}</span>
                      </div>
                      {tenant.emergencyContactName && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Emergency Contact</label>
                          <p className="text-sm">{tenant.emergencyContactName}</p>
                          {tenant.emergencyContactPhone && (
                            <p className="text-sm text-muted-foreground">{tenant.emergencyContactPhone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tenant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Tenant Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <Form {...form}>
                      <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-8" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-8" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>
                    </Form>
                  ) : (
                    <div className="space-y-3">
 

                                           <div>
                        <label className="text-xs font-medium text-muted-foreground">BP Code</label>
                        <p className="text-sm font-mono">{tenant.bpCode}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                        <p className="text-sm">{tenant.firstName} {tenant.lastName}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lease History</CardTitle>
              <CardDescription>
                All lease agreements for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.leases.length > 0 ? (
                <div className="space-y-4">
                  {tenant.leases.map((lease) => (
                    <div key={lease.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">Lease #{lease.id.slice(-8)}</h3>
                          <Badge className={(lease.status)}>
                            {lease.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(lease.startDate), 'MMM dd, yyyy')} - {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Total Rent</label>
                          <p className="text-sm">₱{lease.totalRentAmount.toLocaleString()}/month</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Security Deposit</label>
                          <p className="text-sm">₱{lease.securityDeposit.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Units</label>
                          <p className="text-sm">{lease.leaseUnits.length} unit{lease.leaseUnits.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {lease.leaseUnits.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Leased Units</label>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            {lease.leaseUnits.map((leaseUnit) => (
                              <div key={leaseUnit.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div>
                                  <p className="text-sm font-medium">{leaseUnit.unit.unitNumber}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {leaseUnit.unit.property.propertyName}
                                  </p>
                                </div>
                                <p className="text-sm">₱{leaseUnit.rentAmount.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No leases found</h3>
                  <p className="mt-2 text-muted-foreground">
                    This tenant doesn&apos;t have any lease agreements yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Requests</CardTitle>
              <CardDescription>
                All maintenance requests from this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.maintenanceRequests.length > 0 ? (
                <div className="space-y-4">
                  {tenant.maintenanceRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{request.category}</h3>
                          <Badge variant={getMaintenanceStatusVariant(request.status)}>
                            {request.status}
                          </Badge>
                          <Badge variant={getPriorityVariant(request.priority)}>
                            {request.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.description}
                      </p>
                      
                      {request.status === 'COMPLETED' && (
                        <p className="text-xs text-green-600">
                          Status: Completed
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No maintenance requests</h3>
                  <p className="mt-2 text-muted-foreground">
                    This tenant hasn&apos;t submitted any maintenance requests yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                All documents related to this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.documents.length > 0 ? (
                <div className="space-y-4">
                  {tenant.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {document.documentType} • {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No documents</h3>
                  <p className="mt-2 text-muted-foreground">
                    No documents have been uploaded for this tenant yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <TenantPDCSection tenantBpCode={tenant.bpCode} />
        </TabsContent>

        <TabsContent value="notices" className="space-y-6">
          <TenantNoticesSection tenantId={tenant.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}