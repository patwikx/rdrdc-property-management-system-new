"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Save, X, User, Building, Phone, Mail, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createTenant } from "@/lib/actions/tenant-actions"

const TenantSchema = z.object({
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
  // Business type flags (required by server action)
  isStore: z.boolean(),
  isOffice: z.boolean(),
  isFranchise: z.boolean(),
})

type TenantFormData = z.infer<typeof TenantSchema>

const statusOptions = [
  { 
    value: 'ACTIVE' as const, 
    label: "Active", 
    description: "Tenant is currently active",
    color: "bg-green-600"
  },
  { 
    value: 'PENDING' as const, 
    label: "Pending", 
    description: "Tenant application is pending",
    color: "bg-yellow-600"
  },
  { 
    value: 'INACTIVE' as const, 
    label: "Inactive", 
    description: "Tenant is inactive or suspended",
    color: "bg-gray-600"
  },
]

interface CreateTenantFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTenantForm({ onSuccess, onCancel }: CreateTenantFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TenantFormData>({
    resolver: zodResolver(TenantSchema),
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
      isStore: false,
      isOffice: false,
      isFranchise: false,
    },
  })

  async function onSubmit(data: TenantFormData) {
    setIsLoading(true)
    
    try {
      const result = await createTenant(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof TenantFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Tenant created successfully")
        form.reset()
        onSuccess?.()
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStatus = form.watch('status')
  const selectedOption = statusOptions.find(opt => opt.value === selectedStatus)

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Status Selection */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant Status</FormLabel>
                <FormControl>
                  <div className="grid gap-3 md:grid-cols-3">
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                          field.value === option.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => field.onChange(option.value)}
                      >
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className={`rounded-lg p-2 ${option.color}`}>
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{option.label}</h3>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* BP Code and Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="bpCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>BP Code</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., BP001234" 
                      {...field}
                      disabled={isLoading}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique Business Partner identification code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="First name" 
                      {...field}
                      disabled={isLoading}
                    />
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
                    <Input 
                      placeholder="Last name" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="email@example.com" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Primary contact email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+63 XXX XXX XXXX" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Primary contact phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Emergency Contact Name</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Emergency contact name (optional)" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Name of emergency contact person
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Emergency contact phone (optional)" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Phone number of emergency contact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Company</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Company name" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Legal company name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Business/trade name" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Business or trade name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tenant Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tenant Preview</h4>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">
                {form.watch('bpCode') || 'BP Code'}
              </Badge>
              {selectedOption && (
                <Badge className={selectedOption.color}>
                  {selectedOption.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {form.watch('firstName')} {form.watch('lastName')} • {form.watch('company')}
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}