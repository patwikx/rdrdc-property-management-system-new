"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, User, Mail, Phone, Shield, Eye, EyeOff, CheckCircle, Info } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createUser } from "@/lib/actions/user-actions"
import { CreateUserSchema, type CreateUserData } from "@/lib/validations/user-schema"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

function getUserRoleStyle(role: UserRole) {
  switch (role) {
    case 'ADMIN': return 'text-red-600 border-red-200 bg-red-50'
    case 'MANAGER': return 'text-blue-600 border-blue-200 bg-blue-50'
    case 'STAFF': return 'text-green-600 border-green-200 bg-green-50'
    case 'TENANT': return 'text-purple-600 border-purple-200 bg-purple-50'
    default: return 'text-muted-foreground border-border bg-muted/50'
  }
}

export default function CreateUserPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<CreateUserData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      contactNo: "",
      role: UserRole.VIEWER,
      isRecommendingApprover: false,
      isFinalApprover: false,
    },
  })

  const onSubmit = async (data: CreateUserData) => {
    setIsCreating(true)
    try {
      const result = await createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        contactNo: data.contactNo || undefined,
        role: data.role,
        isRecommendingApprover: data.isRecommendingApprover,
        isFinalApprover: data.isFinalApprover
      })

      if (result.success && result.user) {
        toast.success("User created successfully")
        router.push(`/users/${result.user.id}`)
      } else {
        toast.error(result.error || "Failed to create user")
      }
    } catch (error) {
      toast.error("Failed to create user")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">New User Account</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wide">
            Provision system access & permissions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="rounded-none border border-border shadow-none">
            <CardHeader className="border-b border-border bg-muted/5 py-4">
              <CardTitle className="flex items-center space-x-2 text-sm font-bold uppercase tracking-widest">
                <User className="h-4 w-4" />
                <span>Account Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Personal Data</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="FIRST NAME" {...field} className="rounded-none font-mono text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary" />
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
                            <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="LAST NAME" {...field} className="rounded-none font-mono text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="email" 
                                  placeholder="EMAIL@EXAMPLE.COM" 
                                  className="pl-10 rounded-none font-mono text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary"
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Contact Number (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="CONTACT NUMBER" 
                                  className="pl-10 rounded-none font-mono text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Account Security */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Security Credentials</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="PASSWORD" 
                                  className="rounded-none font-mono text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary pr-10"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-none"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="CONFIRM PASSWORD" 
                                  className="rounded-none font-mono text-sm border-border bg-background focus-visible:ring-0 focus-visible:border-primary pr-10"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-none"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Access Control</h3>
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">User Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-none font-mono text-sm border-border bg-background focus:ring-0">
                                <SelectValue placeholder="SELECT ROLE" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none border-border">
                              <SelectItem value={UserRole.ADMIN} className="font-mono text-xs uppercase">Admin - Full Access</SelectItem>
                              <SelectItem value={UserRole.MANAGER} className="font-mono text-xs uppercase">Manager - Oversight</SelectItem>
                              <SelectItem value={UserRole.STAFF} className="font-mono text-xs uppercase">Staff - Operations</SelectItem>
                              <SelectItem value={UserRole.TENANT} className="font-mono text-xs uppercase">Tenant - Portal</SelectItem>
                              <SelectItem value={UserRole.MAINTENANCE} className="font-mono text-xs uppercase">Maintenance - Field</SelectItem>
                              <SelectItem value={UserRole.VIEWER} className="font-mono text-xs uppercase">Viewer - Read Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rate Change Approval Permissions */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Approval Authority</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isRecommendingApprover"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 border border-border p-3 bg-muted/5">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs font-bold uppercase tracking-wide">Recommending Approver</FormLabel>
                                <FormDescription className="text-[10px] font-mono">
                                  Can endorse rate changes
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
                                  className="rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs font-bold uppercase tracking-wide">Final Approver</FormLabel>
                                <FormDescription className="text-[10px] font-mono">
                                  Can approve rate changes
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
                    <Link href="/users">
                      <Button variant="outline" type="button" className="rounded-none uppercase tracking-wider text-xs font-bold h-10 border-border">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" disabled={isCreating} className="rounded-none uppercase tracking-wider text-xs font-bold h-10 min-w-[140px]">
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role Preview */}
          <Card className="rounded-none border border-border shadow-none">
            <CardHeader className="border-b border-border bg-muted/5 py-3">
              <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                <Shield className="h-4 w-4" />
                <span>Role Spec</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-2">Selected Role</label>
                  <div className={cn("inline-flex items-center px-3 py-1 text-xs font-mono uppercase tracking-wide border", getUserRoleStyle(form.watch('role')))}>
                    {form.watch('role')}
                  </div>
                </div>
                <div className="pt-4 border-t border-dashed border-border">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-2">Capabilities</label>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    {form.watch('role') === UserRole.ADMIN && "FULL SYSTEM CONTROL :: USER_MANAGEMENT :: CONFIGURATION"}
                    {form.watch('role') === UserRole.MANAGER && "OVERSIGHT :: REPORTS :: APPROVALS"}
                    {form.watch('role') === UserRole.STAFF && "OPERATIONS :: DATA_ENTRY :: BASIC_ACCESS"}
                    {form.watch('role') === UserRole.TENANT && "PORTAL_ACCESS :: BILLING :: REQUESTS"}
                    {form.watch('role') === UserRole.MAINTENANCE && "RWO_MANAGEMENT :: FIELD_OPERATIONS"}
                    {form.watch('role') === UserRole.VIEWER && "READ_ONLY :: NO_EDIT_RIGHTS"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Guidelines */}
          <Card className="rounded-none border border-border shadow-none">
            <CardHeader className="border-b border-border bg-muted/5 py-3">
              <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
                <Info className="h-4 w-4" />
                <span>Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 bg-primary mt-2 flex-shrink-0" />
                <p className="text-xs font-mono text-muted-foreground">Password length &gt;= 6 chars</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 bg-primary mt-2 flex-shrink-0" />
                <p className="text-xs font-mono text-muted-foreground">Valid corporate email required</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 bg-primary mt-2 flex-shrink-0" />
                <p className="text-xs font-mono text-muted-foreground">Email verification pending</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}