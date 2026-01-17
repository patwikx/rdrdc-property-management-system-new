"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, User, Shield, Calendar, Building, FileText, Wrench, Settings, Key, Eye, EyeOff, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { updateUser, deleteUser, getUserById, changeUserPassword, type UserWithDetails } from "@/lib/actions/user-actions"
import { UserUpdateSchema, PasswordResetSchema, type UserUpdateData, type PasswordResetData } from "@/lib/validations/user-schema"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UserPageProps {
  params: Promise<{
    id: string
  }>
}

function getUserRoleStyle(role: UserRole) {
  switch (role) {
    case 'ADMIN': return 'border-red-500 text-red-600 bg-red-500/10'
    case 'MANAGER': return 'border-blue-500 text-blue-600 bg-blue-500/10'
    case 'STAFF': return 'border-green-500 text-green-600 bg-green-500/10'
    case 'TENANT': return 'border-purple-500 text-purple-600 bg-purple-500/10'
    default: return 'border-muted text-muted-foreground bg-muted/10'
  }
}

export default function UserPage({ params }: UserPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserWithDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<UserUpdateData>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      contactNo: "",
      role: UserRole.VIEWER,
      isRecommendingApprover: false,
      isFinalApprover: false,
    },
  })

  const passwordForm = useForm<PasswordResetData>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setUserId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    async function fetchUser() {
      if (!userId) return
      
      setIsLoading(true)
      try {
        const result = await getUserById(userId)
        
        if (result.success && result.user) {
          setUser(result.user)
          form.reset({
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            email: result.user.email,
            contactNo: result.user.contactNo || "",
            role: result.user.role,
            isRecommendingApprover: result.user.isRecommendingApprover,
            isFinalApprover: result.user.isFinalApprover,
          })
        } else {
          toast.error(result.error || "Failed to load user")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast.error("Failed to load user")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId, form])

  const onSubmit = async (data: UserUpdateData) => {
    if (!user) return

    setSaving(true)
    try {
      const result = await updateUser({
        id: user.id,
        ...data
      })

      if (result.success && result.user) {
        setUser(result.user)
        setIsEditing(false)
        toast.success("User updated successfully")
      } else {
        toast.error(result.error || "Failed to update user")
      }
    } catch {
      toast.error("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const result = await deleteUser(user.id)
      
      if (result.success) {
        toast.success("User deleted successfully")
        router.push("/users")
      } else {
        toast.error(result.error || "Failed to delete user")
      }
    } catch {
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordResetData) => {
    if (!user) return

    setIsChangingPassword(true)
    try {
      const result = await changeUserPassword({
        id: user.id,
        newPassword: data.newPassword,
        isAdminReset: true
      })

      if (result.success) {
        toast.success("Password reset successfully")
        setIsPasswordDialogOpen(false)
        passwordForm.reset()
      } else {
        toast.error(result.error || "Failed to reset password")
      }
    } catch {
      toast.error("Failed to reset password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-none w-1/3" />
          <div className="h-4 bg-muted rounded-none w-1/2" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-none" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
          <User className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">User Not Found</h3>
          <Link href="/users">
            <Button variant="outline" className="mt-4 rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <ArrowLeft className="h-3 w-3 mr-2" />
              Return to Directory
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">
              {user.firstName} {user.lastName}
            </h2>
            <Badge variant="outline" className={cn("rounded-none text-[10px] uppercase tracking-widest border", getUserRoleStyle(user.role))}>
              {user.role}
            </Badge>
            {user.emailVerified && (
              <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-widest border-emerald-500 text-emerald-600 bg-emerald-50/10">
                Verified
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
            ID: {user.id} • {user.email}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-none h-9 text-xs font-mono uppercase border-border">
                    <Key className="h-3 w-3 mr-2" />
                    Reset Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-none border-border">
                  <DialogHeader className="border-b border-border pb-4">
                    <DialogTitle className="uppercase tracking-widest font-bold text-sm">Reset Password</DialogTitle>
                    <DialogDescription className="font-mono text-xs">
                      Set a new password for {user?.firstName} {user?.lastName}.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold tracking-widest">New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="ENTER NEW PASSWORD" 
                                  className="rounded-none font-mono text-sm pr-10"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-none"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Confirm</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="CONFIRM PASSWORD" 
                                  className="rounded-none font-mono text-sm pr-10"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-none"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsPasswordDialogOpen(false)}
                          className="rounded-none uppercase text-xs font-bold"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isChangingPassword} className="rounded-none uppercase text-xs font-bold">
                          {isChangingPassword ? "Resetting..." : "Confirm Reset"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-none h-9 text-xs font-mono uppercase border-border">
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting} className="rounded-none h-9 text-xs font-mono uppercase">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-none border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="uppercase tracking-widest font-bold text-sm">Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription className="font-mono text-xs">
                      This action cannot be undone. This will permanently delete the user account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none uppercase text-xs font-bold">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90 rounded-none uppercase text-xs font-bold"
                    >
                      Delete User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-none h-9 text-xs font-mono uppercase border-border">
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} className="rounded-none h-9 text-xs font-mono uppercase">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 bg-background">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Properties</span>
            <Building className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className="text-2xl font-mono font-bold">{user._count.createdProperties}</span>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 bg-background">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Tasks</span>
            <Settings className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className="text-2xl font-mono font-bold">{user._count.assignedTasks}</span>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 bg-background">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Documents</span>
            <FileText className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className="text-2xl font-mono font-bold">{user._count.uploadedDocuments}</span>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 bg-background">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Maintenance</span>
            <Wrench className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <span className="text-2xl font-mono font-bold">{user._count.assignedMaintenance}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Information */}
          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="border-b border-border bg-muted/5 py-3">
              <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                <User className="h-4 w-4" />
                <span>Profile Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isEditing ? (
                <Form {...form}>
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest">First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="FIRST NAME" {...field} className="rounded-none font-mono text-sm" />
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
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="LAST NAME" {...field} className="rounded-none font-mono text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="EMAIL" {...field} className="rounded-none font-mono text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="CONTACT NO" {...field} className="rounded-none font-mono text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest">Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none font-mono text-sm">
                              <SelectValue placeholder="SELECT ROLE" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none border-border">
                            <SelectItem value={UserRole.ADMIN} className="font-mono text-xs uppercase">Admin</SelectItem>
                            <SelectItem value={UserRole.MANAGER} className="font-mono text-xs uppercase">Manager</SelectItem>
                            <SelectItem value={UserRole.STAFF} className="font-mono text-xs uppercase">Staff</SelectItem>
                            <SelectItem value={UserRole.TENANT} className="font-mono text-xs uppercase">Tenant</SelectItem>
                            <SelectItem value={UserRole.MAINTENANCE} className="font-mono text-xs uppercase">Maintenance</SelectItem>
                            <SelectItem value={UserRole.VIEWER} className="font-mono text-xs uppercase">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Rate Change Approval Permissions */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">Approval Authority</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isRecommendingApprover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 border border-border p-3 bg-muted/5">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="rounded-none"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Recommending Approver</FormLabel>
                              <FormDescription className="text-[10px] font-mono">
                                Endorse rate changes
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isFinalApprover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 border border-border p-3 bg-muted/5">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="rounded-none"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-[10px] uppercase font-bold tracking-wide">Final Approver</FormLabel>
                              <FormDescription className="text-[10px] font-mono">
                                Approve rate changes
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Form>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">First Name</label>
                      <p className="text-sm font-mono border-b border-border pb-1">{user.firstName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Last Name</label>
                      <p className="text-sm font-mono border-b border-border pb-1">{user.lastName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Email</label>
                      <p className="text-sm font-mono border-b border-border pb-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Contact</label>
                      <p className="text-sm font-mono border-b border-border pb-1">{user.contactNo || "---"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-border">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center space-x-2 p-3 border border-border bg-muted/5">
                        <Checkbox checked={user.isRecommendingApprover} disabled className="rounded-none opacity-100" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide">Recommending Approver</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border border-border bg-muted/5">
                        <Checkbox checked={user.isFinalApprover} disabled className="rounded-none opacity-100" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide">Final Approver</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tenant Information */}
          {user.tenant && (
            <Card className="rounded-none border-border shadow-none">
              <CardHeader className="border-b border-border bg-muted/5 py-3">
                <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                  <Building className="h-4 w-4" />
                  <span>Linked Tenant Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between p-3 border border-border bg-background">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-muted/20 flex items-center justify-center border border-border">
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold">{user.tenant.businessName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {user.tenant.bpCode} • {user.tenant.status}
                      </p>
                    </div>
                  </div>
                  <Link href={`/tenants/${user.tenant.id}`}>
                    <Button variant="outline" size="sm" className="rounded-none h-7 text-[10px] font-mono uppercase border-border">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Details */}
          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="border-b border-border bg-muted/5 py-3">
              <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                <Shield className="h-4 w-4" />
                <span>System Metadata</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">User ID</label>
                <p className="text-xs font-mono break-all bg-muted/10 p-1 border border-border/50">{user.id}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">Created</label>
                <p className="text-xs font-mono">{format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss')}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">Last Updated</label>
                <p className="text-xs font-mono">{format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm:ss')}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">Email Status</label>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-none", user.emailVerified ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="text-xs font-mono uppercase">{user.emailVerified ? "Verified" : "Unverified"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="border-b border-border bg-muted/5 py-3">
              <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                <Calendar className="h-4 w-4" />
                <span>Activity Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">PROPERTIES_CREATED</span>
                <span className="font-bold">{user._count.createdProperties}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">TASKS_ASSIGNED</span>
                <span className="font-bold">{user._count.assignedTasks}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">DOCS_UPLOADED</span>
                <span className="font-bold">{user._count.uploadedDocuments}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">PROJECTS_OWNED</span>
                <span className="font-bold">{user._count.ownedProjects}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">NOTICES_SENT</span>
                <span className="font-bold">{user._count.createdNotices}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}