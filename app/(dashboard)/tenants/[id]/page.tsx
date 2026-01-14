"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Save, Trash2, User, Building, Phone, Mail, FileText, Wrench, Home, Landmark, Store, CheckIcon } from "lucide-react"
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
import { UploadDocumentForm } from "@/components/properties/upload-document-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
  homeAddress: z.string().optional(),
  facebookName: z.string().optional(),
  natureOfBusiness: z.string().optional(),
  yearsInBusiness: z.string().optional(),
  positionInCompany: z.string().optional(),
  officeAddress: z.string().optional(),
  facebookPage: z.string().optional(),
  website: z.string().optional(),
  authorizedSignatory: z.string().optional(),
  isStore: z.boolean().optional(),
  isOffice: z.boolean().optional(),
  isFranchise: z.boolean().optional(),
  bankName1: z.string().optional(),
  bankAddress1: z.string().optional(),
  bankName2: z.string().optional(),
  bankAddress2: z.string().optional(),
  otherBusinessName: z.string().optional(),
  otherBusinessAddress: z.string().optional(),
})

type TenantUpdateData = z.infer<typeof TenantUpdateSchema>

interface TenantPageProps {
  params: Promise<{ id: string }>
}

function getTenantStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600 text-white border-green-600'
    case 'PENDING': return 'border-yellow-200 text-yellow-700 bg-yellow-50'
    case 'INACTIVE': return 'border-gray-200 text-gray-700 bg-gray-50'
    default: return 'border-gray-200 text-gray-700 bg-gray-50'
  }
}

function getLeaseStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600 text-white border-green-600'
    case 'PENDING': return 'border-yellow-200 text-yellow-700 bg-yellow-50'
    case 'TERMINATED': return 'border-red-200 text-red-700 bg-red-50'
    case 'EXPIRED': return 'border-gray-200 text-gray-700 bg-gray-50'
    default: return 'border-gray-200 text-gray-700 bg-gray-50'
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
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const form = useForm<TenantUpdateData>({
    resolver: zodResolver(TenantUpdateSchema),
    defaultValues: {
      bpCode: "", firstName: "", lastName: "", email: "", phone: "",
      emergencyContactName: "", emergencyContactPhone: "", company: "", businessName: "",
      status: 'PENDING', homeAddress: "", facebookName: "", natureOfBusiness: "",
      yearsInBusiness: "", positionInCompany: "", officeAddress: "", facebookPage: "",
      website: "", authorizedSignatory: "", isStore: false, isOffice: false, isFranchise: false,
      bankName1: "", bankAddress1: "", bankName2: "", bankAddress2: "",
      otherBusinessName: "", otherBusinessAddress: "",
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
          bpCode: tenantData.bpCode, firstName: tenantData.firstName || "", lastName: tenantData.lastName || "",
          email: tenantData.email, phone: tenantData.phone,
          emergencyContactName: tenantData.emergencyContactName || "", emergencyContactPhone: tenantData.emergencyContactPhone || "",
          company: tenantData.company, businessName: tenantData.businessName,
          status: tenantData.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
          homeAddress: tenantData.homeAddress || "", facebookName: tenantData.facebookName || "",
          natureOfBusiness: tenantData.natureOfBusiness || "", yearsInBusiness: tenantData.yearsInBusiness || "",
          positionInCompany: tenantData.positionInCompany || "", officeAddress: tenantData.officeAddress || "",
          facebookPage: tenantData.facebookPage || "", website: tenantData.website || "",
          authorizedSignatory: tenantData.authorizedSignatory || "",
          isStore: tenantData.isStore || false, isOffice: tenantData.isOffice || false, isFranchise: tenantData.isFranchise || false,
          bankName1: tenantData.bankName1 || "", bankAddress1: tenantData.bankAddress1 || "",
          bankName2: tenantData.bankName2 || "", bankAddress2: tenantData.bankAddress2 || "",
          otherBusinessName: tenantData.otherBusinessName || "", otherBusinessAddress: tenantData.otherBusinessAddress || "",
        })
      } catch {
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
                form.setError(field as keyof TenantUpdateData, { message: messages[0] })
              }
            }
          })
        }
      } else {
        toast.success("Tenant updated successfully")
        setIsEditing(false)
        const updatedTenant = await getTenantByIdAction(tenantId)
        if (updatedTenant) setTenant(updatedTenant)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!tenant) return
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return
    setIsDeleting(true)
    try {
      const result = await deleteTenantAction(tenant.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Tenant deleted successfully")
        router.push("/tenants")
      }
    } catch {
      toast.error("Failed to delete tenant")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDocumentUploaded = () => {
    setIsUploadDialogOpen(false)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 bg-muted rounded" />))}
          </div>
        </div>
      </div>
    )
  }

  if (!tenant) return null

  const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
  const totalUnits = activeLease?.leaseUnits.length || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold tracking-tight">{tenant.company}</h2>
            <Badge className={getTenantStatusColor(tenant.status)}>{tenant.status}</Badge>
          </div>
          <p className="text-muted-foreground">{tenant.bpCode} • {tenant.businessName}</p>
          <p className="text-muted-foreground">{tenant.firstName} {tenant.lastName}</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Deleting...</>) : (<><Trash2 className="h-4 w-4 mr-2" />Delete</>)}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />Save Changes</>)}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leases">Lease History ({tenant.leases.length})</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({tenant.maintenanceRequests.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({tenant.documents.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({tenant.pdcs.length})</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB - Clean flat layout */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{tenant.leases.filter(l => l.status === 'ACTIVE').length}</div>
              <p className="text-xs text-muted-foreground">Active Leases</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₱{activeLease?.totalRentAmount.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Monthly Rent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{tenant.maintenanceRequests.length}</div>
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tenant.documents.length}</div>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>

          {/* Tenant Profile - With containers */}
          <div>
              {isEditing ? (
                <Form {...form}>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Basic Info */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Basic Information</h4>
                      <FormField control={form.control} name="bpCode" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">BP Code</FormLabel><FormControl><Input {...field} className="h-8 font-mono" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">First Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Last Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {/* Contact Info */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Contact Information</h4>
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Email</FormLabel><FormControl><Input {...field} type="email" className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Phone</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="homeAddress" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Home Address</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="facebookName" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Facebook Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {/* Emergency Contact */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Emergency Contact</h4>
                      <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Contact Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Contact Phone</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {/* Business Info */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Business Information</h4>
                      <FormField control={form.control} name="company" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Company</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="businessName" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Business Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="natureOfBusiness" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Nature of Business</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="yearsInBusiness" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Years in Business</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {/* Business Details */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Business Details</h4>
                      <FormField control={form.control} name="positionInCompany" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Position</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="officeAddress" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Office Address</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="authorizedSignatory" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Authorized Signatory</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {/* Online & Space Type */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Online & Space Type</h4>
                      <FormField control={form.control} name="facebookPage" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Facebook Page</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="website" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Website</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="space-y-2 pt-2">
                        <FormField control={form.control} name="isStore" render={({ field }) => (
                          <div className="flex items-center space-x-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => field.onChange(!field.value)}>
                            <div className="size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground data-[checked=true]:border-primary" data-checked={!!field.value}>
                              {field.value && <CheckIcon className="size-3.5 text-white" />}
                            </div>
                            <span className="text-sm">Store</span>
                          </div>
                        )} />
                        <FormField control={form.control} name="isOffice" render={({ field }) => (
                          <div className="flex items-center space-x-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => field.onChange(!field.value)}>
                            <div className="size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground data-[checked=true]:border-primary" data-checked={!!field.value}>
                              {field.value && <CheckIcon className="size-3.5 text-white" />}
                            </div>
                            <span className="text-sm">Office</span>
                          </div>
                        )} />
                        <FormField control={form.control} name="isFranchise" render={({ field }) => (
                          <div className="flex items-center space-x-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => field.onChange(!field.value)}>
                            <div className="size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground data-[checked=true]:border-primary" data-checked={!!field.value}>
                              {field.value && <CheckIcon className="size-3.5 text-white" />}
                            </div>
                            <span className="text-sm">Franchise</span>
                          </div>
                        )} />
                      </div>
                    </div>
                    {/* Bank Details */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Primary Bank</h4>
                      <FormField control={form.control} name="bankName1" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Bank Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bankAddress1" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Bank Address</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Secondary Bank</h4>
                      <FormField control={form.control} name="bankName2" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Bank Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="bankAddress2" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Bank Address</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {/* Other Business */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm border-b pb-2">Other Business</h4>
                      <FormField control={form.control} name="otherBusinessName" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Business Name</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="otherBusinessAddress" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Business Address</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                </Form>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Basic Info - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-medium text-muted-foreground">BP Code</label><p className="text-sm font-mono">{tenant.bpCode}</p></div>
                      <div><label className="text-xs font-medium text-muted-foreground">Status</label><div className="mt-1"><Badge className={getTenantStatusColor(tenant.status)}>{tenant.status}</Badge></div></div>
                    </div>
                    <div><label className="text-xs font-medium text-muted-foreground">Full Name</label><p className="text-sm">{tenant.firstName} {tenant.lastName}</p></div>
                    <div><label className="text-xs font-medium text-muted-foreground">Member Since</label><p className="text-sm">{format(new Date(tenant.createdAt), 'MMM dd, yyyy')}</p></div>
                  </div>
                  {/* Contact Info - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Information</h4>
                    <div className="flex items-center space-x-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{tenant.email}</span></div>
                    <div className="flex items-center space-x-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{tenant.phone}</span></div>
                    {tenant.homeAddress && <div><label className="text-xs font-medium text-muted-foreground">Home Address</label><p className="text-sm">{tenant.homeAddress}</p></div>}
                    {tenant.facebookName && <div><label className="text-xs font-medium text-muted-foreground">Facebook</label><p className="text-sm">{tenant.facebookName}</p></div>}
                  </div>
                  {/* Emergency Contact - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> Emergency Contact</h4>
                    {tenant.emergencyContactName ? (
                      <><div><label className="text-xs font-medium text-muted-foreground">Name</label><p className="text-sm">{tenant.emergencyContactName}</p></div>
                      {tenant.emergencyContactPhone && <div><label className="text-xs font-medium text-muted-foreground">Phone</label><p className="text-sm">{tenant.emergencyContactPhone}</p></div>}</>
                    ) : (<p className="text-sm text-muted-foreground">No emergency contact</p>)}
                  </div>
                  {/* Business Info - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Building className="h-4 w-4" /> Business Information</h4>
                    <div><label className="text-xs font-medium text-muted-foreground">Company</label><p className="text-sm">{tenant.company}</p></div>
                    <div><label className="text-xs font-medium text-muted-foreground">Business Name</label><p className="text-sm">{tenant.businessName}</p></div>
                    {tenant.natureOfBusiness && <div><label className="text-xs font-medium text-muted-foreground">Nature of Business</label><p className="text-sm">{tenant.natureOfBusiness}</p></div>}
                    {tenant.yearsInBusiness && <div><label className="text-xs font-medium text-muted-foreground">Years in Business</label><p className="text-sm">{tenant.yearsInBusiness}</p></div>}
                  </div>
                  {/* Business Details - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Building className="h-4 w-4" /> Business Details</h4>
                    {tenant.positionInCompany && <div><label className="text-xs font-medium text-muted-foreground">Position</label><p className="text-sm">{tenant.positionInCompany}</p></div>}
                    {tenant.officeAddress && <div><label className="text-xs font-medium text-muted-foreground">Office Address</label><p className="text-sm">{tenant.officeAddress}</p></div>}
                    {tenant.authorizedSignatory && <div><label className="text-xs font-medium text-muted-foreground">Authorized Signatory</label><p className="text-sm">{tenant.authorizedSignatory}</p></div>}
                    {!tenant.positionInCompany && !tenant.officeAddress && !tenant.authorizedSignatory && <p className="text-sm text-muted-foreground">No additional details</p>}
                  </div>
                  {/* Space Type & Online - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Store className="h-4 w-4" /> Space Type & Online</h4>
                    <div><label className="text-xs font-medium text-muted-foreground">Space Type</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tenant.isStore && <Badge variant="secondary">Store</Badge>}
                        {tenant.isOffice && <Badge variant="secondary">Office</Badge>}
                        {tenant.isFranchise && <Badge variant="secondary">Franchise</Badge>}
                        {!tenant.isStore && !tenant.isOffice && !tenant.isFranchise && <span className="text-sm text-muted-foreground">Not specified</span>}
                      </div>
                    </div>
                    {tenant.facebookPage && <div><label className="text-xs font-medium text-muted-foreground">Facebook Page</label><p className="text-sm">{tenant.facebookPage}</p></div>}
                    {tenant.website && <div><label className="text-xs font-medium text-muted-foreground">Website</label><p className="text-sm">{tenant.website}</p></div>}
                  </div>
                  {/* Bank Details - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Landmark className="h-4 w-4" /> Bank Details</h4>
                    {(tenant.bankName1 || tenant.bankAddress1) && <div><label className="text-xs font-medium text-muted-foreground">Primary Bank</label>{tenant.bankName1 && <p className="text-sm font-medium">{tenant.bankName1}</p>}{tenant.bankAddress1 && <p className="text-sm text-muted-foreground">{tenant.bankAddress1}</p>}</div>}
                    {(tenant.bankName2 || tenant.bankAddress2) && <div><label className="text-xs font-medium text-muted-foreground">Secondary Bank</label>{tenant.bankName2 && <p className="text-sm font-medium">{tenant.bankName2}</p>}{tenant.bankAddress2 && <p className="text-sm text-muted-foreground">{tenant.bankAddress2}</p>}</div>}
                    {!tenant.bankName1 && !tenant.bankAddress1 && !tenant.bankName2 && !tenant.bankAddress2 && <p className="text-sm text-muted-foreground">No bank details</p>}
                  </div>
                  {/* Other Business - View Mode */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2"><Building className="h-4 w-4" /> Other Business</h4>
                    {tenant.otherBusinessName || tenant.otherBusinessAddress ? (
                      <>{tenant.otherBusinessName && <div><label className="text-xs font-medium text-muted-foreground">Business Name</label><p className="text-sm">{tenant.otherBusinessName}</p></div>}
                      {tenant.otherBusinessAddress && <div><label className="text-xs font-medium text-muted-foreground">Address</label><p className="text-sm">{tenant.otherBusinessAddress}</p></div>}</>
                    ) : (<p className="text-sm text-muted-foreground">No other business declared</p>)}
                  </div>
                </div>
              )}
          </div>

          {/* Active Lease Details - Flat */}
          {activeLease && (
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Home className="h-5 w-5" />
                <h3 className="font-semibold">Active Lease</h3>
                <Badge className={getLeaseStatusColor(activeLease.status)}>{activeLease.status}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <div><label className="text-sm font-medium text-muted-foreground">Lease Period</label><p className="text-sm">{format(new Date(activeLease.startDate), 'MMM dd, yyyy')} - {format(new Date(activeLease.endDate), 'MMM dd, yyyy')}</p></div>
                <div><label className="text-sm font-medium text-muted-foreground">Security Deposit</label><p className="text-sm">₱{activeLease.securityDeposit.toLocaleString()}</p></div>
              </div>
              {activeLease.leaseUnits.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Leased Spaces</label>
                  <div className="mt-2 space-y-2">
                    {activeLease.leaseUnits.map((leaseUnit) => (
                      <div key={leaseUnit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div><p className="font-medium">{leaseUnit.unit.unitNumber}</p><p className="text-sm text-muted-foreground">{leaseUnit.unit.property.propertyName}</p></div>
                        </div>
                        <div className="text-right"><p className="font-medium">₱{leaseUnit.rentAmount.toLocaleString()}</p><p className="text-sm text-muted-foreground">per month</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Maintenance Requests - Flat */}
          {tenant.maintenanceRequests.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Wrench className="h-5 w-5" />
                <h3 className="font-semibold">Recent Maintenance Requests</h3>
              </div>
              <div className="space-y-3">
                {tenant.maintenanceRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <Badge variant={getMaintenanceStatusVariant(request.status)}>{request.status}</Badge>
                        <Badge variant={getPriorityVariant(request.priority)}>{request.priority}</Badge>
                      </div>
                      <div><p className="font-medium">{request.category}</p><p className="text-sm text-muted-foreground line-clamp-1">{request.description}</p></div>
                    </div>
                    <div className="text-right"><p className="text-sm text-muted-foreground">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* LEASES TAB */}
        <TabsContent value="leases" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Lease History</CardTitle><CardDescription>All lease agreements for this tenant</CardDescription></CardHeader>
            <CardContent>
              {tenant.leases.length > 0 ? (
                <div className="space-y-4">
                  {tenant.leases.map((lease) => (
                    <div key={lease.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2"><h3 className="font-medium">Lease #{lease.id.slice(-8)}</h3><Badge className={(lease.status)}>{lease.status}</Badge></div>
                        <div className="text-sm text-muted-foreground">{format(new Date(lease.startDate), 'MMM dd, yyyy')} - {format(new Date(lease.endDate), 'MMM dd, yyyy')}</div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div><label className="text-xs font-medium text-muted-foreground">Total Rent</label><p className="text-sm">₱{lease.totalRentAmount.toLocaleString()}/month</p></div>
                        <div><label className="text-xs font-medium text-muted-foreground">Security Deposit</label><p className="text-sm">₱{lease.securityDeposit.toLocaleString()}</p></div>
                        <div><label className="text-xs font-medium text-muted-foreground">Spaces</label><p className="text-sm">{lease.leaseUnits.length} space{lease.leaseUnits.length !== 1 ? 's' : ''}</p></div>
                      </div>
                      {lease.leaseUnits.length > 0 && (
                        <div><label className="text-xs font-medium text-muted-foreground">Leased Spaces</label>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            {lease.leaseUnits.map((leaseUnit) => (
                              <div key={leaseUnit.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div><p className="text-sm font-medium">{leaseUnit.unit.unitNumber}</p><p className="text-xs text-muted-foreground">{leaseUnit.unit.property.propertyName}</p></div>
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
                <div className="text-center py-8"><Home className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No leases found</h3><p className="mt-2 text-muted-foreground">This tenant doesn&apos;t have any lease agreements yet.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MAINTENANCE TAB */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Maintenance Requests</CardTitle><CardDescription>All maintenance requests from this tenant</CardDescription></CardHeader>
            <CardContent>
              {tenant.maintenanceRequests.length > 0 ? (
                <div className="space-y-4">
                  {tenant.maintenanceRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2"><h3 className="font-medium">{request.category}</h3><Badge variant={getMaintenanceStatusVariant(request.status)}>{request.status}</Badge><Badge variant={getPriorityVariant(request.priority)}>{request.priority}</Badge></div>
                        <div className="text-sm text-muted-foreground">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                      {request.status === 'COMPLETED' && <p className="text-xs text-green-600">Status: Completed</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8"><Wrench className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No maintenance requests</h3><p className="mt-2 text-muted-foreground">This tenant hasn&apos;t submitted any maintenance requests yet.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Documents</CardTitle><CardDescription>All documents related to this tenant</CardDescription></div>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline"><FileText className="h-4 w-4 mr-2" />Upload Document</Button></DialogTrigger>
                  <DialogContent className="!w-[650px] !max-w-[650px] !min-w-[650px]" style={{ width: '650px', maxWidth: '650px', minWidth: '650px' }}>
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <UploadDocumentForm tenantId={tenant.id} onSuccess={handleDocumentUploaded} onCancel={() => setIsUploadDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tenant.documents.length > 0 ? (
                <div className="space-y-4">
                  {tenant.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded"><FileText className="h-4 w-4 text-primary" /></div>
                        <div><p className="font-medium">{document.name}</p><p className="text-sm text-muted-foreground">{document.documentType} • {format(new Date(document.createdAt), 'MMM dd, yyyy')}</p></div>
                      </div>
                      <Button variant="outline" size="sm" asChild><a href={document.fileUrl} target="_blank" rel="noopener noreferrer">View</a></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8"><FileText className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No documents</h3><p className="mt-2 text-muted-foreground">No documents have been uploaded for this tenant yet.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-6">
          <TenantPDCSection tenantBpCode={tenant.bpCode} />
        </TabsContent>

        {/* NOTICES TAB */}
        <TabsContent value="notices" className="space-y-6">
          <TenantNoticesSection tenantId={tenant.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
