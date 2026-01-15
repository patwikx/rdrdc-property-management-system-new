"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, User, Mail, Phone, Shield, Eye, EyeOff, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createUser } from "@/lib/actions/user-actions"
import { CreateUserSchema, type CreateUserData } from "@/lib/validations/user-schema"
import { UserRole } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to create user")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New User</h2>
            <p className="text-muted-foreground">
              Add a new user to the system with appropriate role and permissions
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>
                Enter the user&apos;s personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
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
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="email" 
                                  placeholder="Enter email address" 
                                  className="pl-10"
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
                            <FormLabel>Contact Number (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Enter contact number" 
                                  className="pl-10"
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
                    <h3 className="text-lg font-medium">Account Security</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
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
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm password" 
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
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Role & Permissions</h3>
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UserRole.ADMIN}>Admin - Full system access</SelectItem>
                              <SelectItem value={UserRole.MANAGER}>Manager - Management access</SelectItem>
                              <SelectItem value={UserRole.STAFF}>Staff - Standard access</SelectItem>
                              <SelectItem value={UserRole.TENANT}>Tenant - Tenant portal access</SelectItem>
                              <SelectItem value={UserRole.TREASURY}>Treasury - Financial operations</SelectItem>
                              <SelectItem value={UserRole.PURCHASER}>Purchaser - Procurement access</SelectItem>
                              <SelectItem value={UserRole.ACCTG}>Accounting - Financial records</SelectItem>
                              <SelectItem value={UserRole.VIEWER}>Viewer - Read-only access</SelectItem>
                              <SelectItem value={UserRole.OWNER}>Owner - Property owner access</SelectItem>
                              <SelectItem value={UserRole.STOCKROOM}>Stockroom - Inventory management</SelectItem>
                              <SelectItem value={UserRole.MAINTENANCE}>Maintenance - Service requests</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rate Change Approval Permissions */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Rate Change Approval Permissions</h4>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="isRecommendingApprover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Recommending Approver</FormLabel>
                              <FormDescription>
                                Can recommend rate changes for final approval
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isFinalApprover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Final Approver</FormLabel>
                              <FormDescription>
                                Can give final approval for rate changes
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                    <Link href="/users">
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Creating User...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create User
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Selected Role</label>
                  <div className="mt-1">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getUserRoleColor(form.watch('role'))}`}>
                      {form.watch('role')}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Access Level</label>
                  <p className="text-sm mt-1">
                    {form.watch('role') === UserRole.ADMIN && "Full system administration access"}
                    {form.watch('role') === UserRole.MANAGER && "Management and oversight capabilities"}
                    {form.watch('role') === UserRole.STAFF && "Standard operational access"}
                    {form.watch('role') === UserRole.TENANT && "Tenant portal and services"}
                    {form.watch('role') === UserRole.TREASURY && "Financial operations and reporting"}
                    {form.watch('role') === UserRole.PURCHASER && "Procurement and purchasing"}
                    {form.watch('role') === UserRole.ACCTG && "Accounting and financial records"}
                    {form.watch('role') === UserRole.VIEWER && "Read-only system access"}
                    {form.watch('role') === UserRole.OWNER && "Property owner dashboard"}
                    {form.watch('role') === UserRole.STOCKROOM && "Inventory and stock management"}
                    {form.watch('role') === UserRole.MAINTENANCE && "Maintenance and service requests"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Security Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>Password must be at least 6 characters long</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p>Email address will be used for login and notifications</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <p>User will need to verify their email address</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <p>Role permissions can be changed later if needed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}