"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Save, Trash2, User, FileText, Wrench, Home, CreditCard, AlertCircle, X, Activity } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTenantByIdAction, updateTenantAction, deleteTenantAction } from "@/lib/actions/tenant-server-actions"
import { TenantWithDetails } from "@/lib/actions/tenant-actions"
import { toast } from "sonner"
import { format } from "date-fns"
import { z } from "zod"
import { TenantPDCSection } from "@/components/tenants/tenant-pdc-section"
import { TenantPDC } from "@/lib/actions/tenant-pdc-actions"
import { TenantNoticesSection } from "@/components/tenants/tenant-notices-section"
import { UploadDocumentForm } from "@/components/properties/upload-document-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

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

function getTenantStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { border: 'border-l-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'PENDING': return { border: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    case 'INACTIVE': return { border: 'border-l-slate-500', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }
    default: return { border: 'border-l-muted', badge: 'bg-muted/10 text-muted-foreground border-border' }
  }
}

function getLeaseStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-600'
    case 'PENDING': return 'bg-amber-600'
    case 'TERMINATED': return 'bg-rose-600'
    case 'EXPIRED': return 'bg-slate-600'
    default: return 'bg-slate-600'
  }
}

function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'URGENT': return 'destructive'
    case 'HIGH': return 'destructive'
    case 'MEDIUM': return 'secondary'
    case 'LOW': return 'outline'
    default: return 'outline'
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
          <div className="h-8 bg-muted/20 w-1/3" />
          <div className="h-4 bg-muted/20 w-1/2" />
          <div className="grid gap-4 md:grid-cols-4 h-24 bg-muted/10 border border-border" />
        </div>
      </div>
    )
  }

  if (!tenant) return null

  const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
  const statusStyle = getTenantStatusStyle(tenant.status)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'leases', label: `Lease History (${tenant.leases.length})`, icon: Home },
    { id: 'maintenance', label: `Repair Work Orders (${tenant.maintenanceRequests.length})`, icon: Wrench },
    { id: 'documents', label: `Documents (${tenant.documents.length})`, icon: FileText },
    { id: 'payments', label: `Payments (${tenant.pdcs.length})`, icon: CreditCard },
    { id: 'notices', label: 'Notices', icon: AlertCircle },
  ]

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-mono uppercase flex items-center gap-3">
              {tenant.businessName}
              <Badge variant="outline" className={`rounded-none text-xs uppercase tracking-widest border-0 ${statusStyle.badge} px-2 py-0.5`}>
                {tenant.status}
              </Badge>
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
              <span className="uppercase tracking-wide">{tenant.bpCode}</span>
              <span className="text-border">|</span>
              <span>{tenant.company}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Profile
                </Button>
                
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
                        Are you sure you want to delete this tenant profile? This action cannot be undone and will remove all associated records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-none border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="rounded-none bg-rose-600 hover:bg-rose-700" disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete Tenant"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border"
                >
                  <X className="h-3 w-3 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isSaving}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                >
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
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Leases</span>
              <CreditCard className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter">
                {tenant.leases.filter(l => l.status === 'ACTIVE').length}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">Active</span>
            </div>
          </div>
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Monthly Rent</span>
              <Activity className="h-4 w-4 text-emerald-600/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">
                ₱{activeLease?.totalRentAmount.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Work Orders</span>
              <Wrench className="h-4 w-4 text-amber-600/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter text-amber-600">
                {tenant.maintenanceRequests.length}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">Requests</span>
            </div>
          </div>
          <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Documents</span>
              <FileText className="h-4 w-4 text-blue-600/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">
                {tenant.documents.length}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">Files</span>
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

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 mt-6">
            <div className="border border-border bg-background">
              <div className="border-b border-border bg-muted/10 p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Tenant Profile
                </span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* ID Card */}
                <div className="col-span-1 space-y-4 border border-border p-4 bg-muted/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 block mb-3">Identification</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Tenant Name</label>
                    <div className="font-medium text-sm">{tenant.firstName} {tenant.lastName}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Company</label>
                    <div className="text-sm truncate">{tenant.company}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Trade Name</label>
                    <div className="text-sm truncate">{tenant.businessName}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">BP Code</label>
                    <div className="text-sm font-mono">{tenant.bpCode}</div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="col-span-1 space-y-4 border border-border p-4 bg-muted/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 block mb-3">Business Info</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Nature of Business</label>
                    <div className="text-sm">{tenant.natureOfBusiness || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Years Active</label>
                    <div className="text-sm">{tenant.yearsInBusiness || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Position</label>
                    <div className="text-sm">{tenant.positionInCompany || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Signatory</label>
                    <div className="text-sm truncate">{tenant.authorizedSignatory || "N/A"}</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="col-span-1 space-y-4 border border-border p-4 bg-muted/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 block mb-3">Contact Details</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Email</label>
                    <a href={`mailto:${tenant.email}`} className="text-sm hover:underline truncate block">{tenant.email}</a>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Phone</label>
                    <div className="text-sm font-mono">{tenant.phone}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Home Address</label>
                    <div className="text-sm line-clamp-2">{tenant.homeAddress || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Office Address</label>
                    <div className="text-sm line-clamp-2">{tenant.officeAddress || "N/A"}</div>
                  </div>
                </div>

                {/* Operations & Bank */}
                <div className="col-span-1 space-y-4 border border-border p-4 bg-muted/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 block mb-3">Operations & Bank</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Bank</label>
                    <div className="text-sm">{tenant.bankName1 || "N/A"}</div>
                    <div className="text-xs text-muted-foreground truncate">{tenant.bankAddress1}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Facebook</label>
                    <div className="text-sm truncate">{tenant.facebookPage || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Emergency Contact</label>
                    <div className="text-sm truncate">{tenant.emergencyContactName || "N/A"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{tenant.emergencyContactPhone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Lease (Compact View) */}
            {activeLease && (
              <div className="border border-border bg-background p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border bg-muted/10">
                    <CreditCard className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">Active Lease Period</span>
                    <span className="text-sm font-mono font-bold">
                      {format(new Date(activeLease.startDate), 'MMM yyyy')} - {format(new Date(activeLease.endDate), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
                <Badge className="rounded-none h-6 bg-emerald-600 hover:bg-emerald-700">ACTIVE LEASE</Badge>
              </div>
            )}
          </div>
        )}

        {/* LEASES TAB */}
        {activeTab === 'leases' && (
          <div className="space-y-4">
            <div className="border border-border bg-background p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Lease History</h3>
              {tenant.leases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tenant.leases.map((lease) => (
                    <div key={lease.id} className="border border-border bg-muted/5 p-4 flex flex-col gap-4 hover:border-primary/50 transition-colors group relative">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs truncate" title={lease.id}>LEASE-{lease.id.slice(0, 8)}</span>
                        <Badge className={cn("rounded-none text-[10px] px-1.5 py-0.5", getLeaseStatusColor(lease.status))}>
                          {lease.status}
                        </Badge>
                      </div>

                      {/* Dates */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase text-muted-foreground tracking-widest block">Duration</span>
                        <div className="text-xs font-mono bg-background border border-border p-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">START</span>
                            <span>{format(new Date(lease.startDate), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">END</span>
                            <span>{format(new Date(lease.endDate), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financials */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] uppercase text-muted-foreground tracking-widest block mb-1">Total Rent</span>
                          <span className="font-mono text-sm font-bold block">₱{lease.totalRentAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-muted-foreground tracking-widest block mb-1">Deposit</span>
                          <span className="font-mono text-sm text-muted-foreground block">₱{lease.securityDeposit.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Spaces */}
                      <div className="space-y-2 pt-3 border-t border-dashed border-border/50 mt-auto">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase text-muted-foreground tracking-widest">Leased Spaces</span>
                          <span className="text-[9px] font-mono bg-muted/20 px-1">{lease.leaseUnits.length} UNITS</span>
                        </div>
                        <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-none">
                          {lease.leaseUnits.map((lu) => (
                            <div key={lu.id} className="flex justify-between items-center text-[10px] bg-background border border-border p-1.5 hover:bg-muted/10 transition-colors">
                              <span className="font-mono font-bold text-primary">{lu.unit.unitNumber}</span>
                              <span className="font-mono text-muted-foreground">₱{lu.rentAmount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">No lease history found</div>
              )}
            </div>
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="border border-border bg-background p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Repair Work Orders</h3>
              {tenant.maintenanceRequests.length > 0 ? (
                <div className="space-y-4">
                  {tenant.maintenanceRequests.map((request) => (
                    <div key={request.id} className="border border-border p-4 flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-none border-foreground text-foreground font-mono text-[10px]">{request.category}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <p className="text-sm font-medium">{request.description}</p>
                      </div>
                      <Badge variant={getPriorityVariant(request.priority)} className="rounded-none text-[10px]">
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">No repair work orders found</div>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="border border-border bg-background p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest">Document Vault</h3>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase">
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none border-border max-w-[650px]">
                    <DialogHeader>
                      <DialogTitle className="font-mono uppercase tracking-wide">Upload Document</DialogTitle>
                    </DialogHeader>
                    <UploadDocumentForm tenantId={tenant.id} onSuccess={handleDocumentUploaded} onCancel={() => setIsUploadDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              
              {tenant.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenant.documents.map((doc) => (
                    <div key={doc.id} className="border border-border p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-muted/10 border border-border">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">{doc.documentType}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(doc.createdAt), 'MMM dd')}</span>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline text-primary">View</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">No documents found</div>
              )}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <TenantPDCSection pdcs={tenant.pdcs as TenantPDC[]} />
          </div>
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            <TenantNoticesSection notices={tenant.notices} />
          </div>
        )}
      </div>
    </div>
  )
}