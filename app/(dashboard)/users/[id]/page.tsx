"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Save, Trash2, User, Shield, Calendar, Building, FileText, Wrench, Settings, Key, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { updateUser, deleteUser, getUserById, changeUserPassword, type UserWithDetails } from "@/lib/actions/user-actions"
import { UserUpdateSchema, PasswordResetSchema, type UserUpdateData, type PasswordResetData } from "@/lib/validations/user-schema"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"

interface UserPageProps {
  params: Promise<{
    id: string
  }>
}

function getUserRoleColor(role: UserRole) {
  switch (role) {
    case 'ADMIN': return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
    case 'MANAGER': return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
    case 'STAFF': return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
    case 'TENANT': return 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
    case 'TREASURY': return 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600'
    case 'PURCHASER': return 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
    case 'ACCTG': return 'bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600'
    case 'VIEWER': return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600'
    case 'OWNER': return 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
    case 'STOCKROOM': return 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
    case 'MAINTENANCE': return 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600'
    default: return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600'
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to reset password")
    } finally {
      setIsChangingPassword(false)
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

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">User not found</h3>
          <p className="mt-2 text-muted-foreground">
            The user you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/users">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {user.firstName} {user.lastName}
              </h2>
              <Badge className={getUserRoleColor(user.role)}>
                {user.role}
              </Badge>
              {user.emailVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Set a new password for {user?.firstName} {user?.lastName}. As an admin, you can reset passwords without knowing the current one.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Enter new password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
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
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm new password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsPasswordDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Resetting...
                            </>
                          ) : (
                            "Reset Password"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user account and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user._count.createdProperties}</div>
            <p className="text-xs text-muted-foreground">
              Created properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{user._count.assignedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Assigned tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{user._count.uploadedDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Uploaded documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user._count.assignedMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Assigned requests
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>
                {isEditing ? "Edit user details and role" : "View user account information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Form {...form}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email" {...field} />
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
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact number" {...field} />
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
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                            <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                            <SelectItem value={UserRole.TENANT}>Tenant</SelectItem>
                            <SelectItem value={UserRole.TREASURY}>Treasury</SelectItem>
                            <SelectItem value={UserRole.PURCHASER}>Purchaser</SelectItem>
                            <SelectItem value={UserRole.ACCTG}>Accounting</SelectItem>
                            <SelectItem value={UserRole.VIEWER}>Viewer</SelectItem>
                            <SelectItem value={UserRole.OWNER}>Owner</SelectItem>
                            <SelectItem value={UserRole.STOCKROOM}>Stockroom</SelectItem>
                            <SelectItem value={UserRole.MAINTENANCE}>Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="text-sm">{user.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="text-sm">{user.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                    <p className="text-sm">{user.contactNo || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="mt-1">
                      <Badge className={getUserRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email Status</label>
                    <div className="mt-1">
                      <Badge variant={user.emailVerified ? "default" : "secondary"}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tenant Information */}
          {user.tenant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Linked Tenant Account</span>
                </CardTitle>
                <CardDescription>
                  This user is linked to a tenant account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{user.tenant.businessName}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.tenant.bpCode} • {user.tenant.status}
                      </p>
                    </div>
                  </div>
                  <Link href={`/tenants/${user.tenant.id}`}>
                    <Button variant="outline" size="sm">
                      View Tenant
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Account Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{format(new Date(user.updatedAt), 'MMM dd, yyyy')}</p>
              </div>
              {user.emailVerified && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                  <p className="text-sm">{format(new Date(user.emailVerified), 'MMM dd, yyyy')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Activity Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Properties Created</span>
                <Badge variant="outline">{user._count.createdProperties}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tasks Assigned</span>
                <Badge variant="outline">{user._count.assignedTasks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Documents Uploaded</span>
                <Badge variant="outline">{user._count.uploadedDocuments}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Projects Owned</span>
                <Badge variant="outline">{user._count.ownedProjects}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Notices Created</span>
                <Badge variant="outline">{user._count.createdNotices}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}