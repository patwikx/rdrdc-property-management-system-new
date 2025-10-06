/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Save, Info, CheckCircle, Users, Receipt, FileText, Zap, Activity, MapPin, Hash, Home } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PropertySchema, PropertyFormData } from "@/lib/validations/property-schema"
import { createProperty } from "@/lib/actions/property-actions"
import { PropertyType } from "@prisma/client"
import { toast } from "sonner"

const propertyTypeOptions = [
  { 
    value: PropertyType.COMMERCIAL, 
    label: "Commercial", 
    description: "Office buildings, retail spaces, warehouses",
    icon: Building2,
    color: "bg-blue-600"
  },
  { 
    value: PropertyType.RESIDENTIAL, 
    label: "Residential", 
    description: "Apartments, condominiums, houses",
    icon: Home,
    color: "bg-green-600"
  },
  { 
    value: PropertyType.MIXED, 
    label: "Mixed Use", 
    description: "Combined residential and commercial spaces",
    icon: Building2,
    color: "bg-purple-600"
  },
]

const workflowSteps = [
  {
    step: 1,
    title: "Create Property",
    description: "Add basic property information",
    icon: Building2,
    status: "current"
  },
  {
    step: 2,
    title: "Add Property Titles",
    description: "Register property titles and ownership details",
    icon: Receipt,
    status: "upcoming"
  },
  {
    step: 3,
    title: "Create Spaces",
    description: "Define leasable spaces and spaces",
    icon: Home,
    status: "upcoming"
  },
  {
    step: 4,
    title: "Setup Utilities",
    description: "Configure utility connections",
    icon: Zap,
    status: "upcoming"
  },
  {
    step: 5,
    title: "Upload Documents",
    description: "Add property documents and contracts",
    icon: FileText,
    status: "upcoming"
  },
  {
    step: 6,
    title: "Manage Tenants",
    description: "Add tenants and create leases",
    icon: Users,
    status: "upcoming"
  }
]

export default function CreatePropertyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<PropertyType>(PropertyType.COMMERCIAL)

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(PropertySchema),
    defaultValues: {
      propertyCode: "",
      propertyName: "",
      leasableArea: 0,
      address: "",
      propertyType: PropertyType.COMMERCIAL,
      totalUnits: 0,
    },
  })

  async function onSubmit(data: PropertyFormData) {
    setIsLoading(true)
    
    try {
      const result = await createProperty(data)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof PropertyFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Property created successfully")
        router.push(`/properties/${result.property?.id}`)
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New Property</h2>
            <p className="text-muted-foreground">
              Add a new property to your portfolio and start managing it
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Property Type</span>
              </CardTitle>
              <CardDescription>
                Choose the type of property you&apos;re adding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {propertyTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <div
                      key={option.value}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                        selectedType === option.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedType(option.value)
                        form.setValue('propertyType', option.value)
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`rounded-lg p-2 ${option.color}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{option.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      {selectedType === option.value && (
                        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Property Information Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Property Information</span>
              </CardTitle>
              <CardDescription>
                Enter the basic details for your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Property Code and Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="propertyCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Hash className="h-4 w-4" />
                            <span>Property Code</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., PROP-001, BLD-A, COM-001" 
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for easy reference (must be unique)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>Property Name</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Downtown Commercial Center" 
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Full name of the property
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Complete Address</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Street, Barangay, City, Province" 
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Full address including street, city, and province
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Area and Units */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="leasableArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Leasable Area (sqm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Total area available for leasing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>

                  {/* Hidden field for property type */}
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <input type="hidden" {...field} value={selectedType} />
                    )}
                  />

                  {/* Submit Buttons */}
                  <div className="flex items-center space-x-4 pt-6 border-t">
                    <Button type="submit" disabled={isLoading} size="lg">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Creating Property...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Property
                        </>
                      )}
                    </Button>
                    <Link href="/properties">
                      <Button variant="outline" disabled={isLoading} size="lg">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Quick Guide */}
        <div className="space-y-6">
          {/* Property Management Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Property Setup Workflow</span>
              </CardTitle>
              <CardDescription>
                Follow these steps to fully set up your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.step} className="flex items-start space-x-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step.status === 'current' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.status === 'current' ? (
                          <Icon className="h-4 w-4" />
                        ) : (
                          step.step
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          step.status === 'current' ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Quick Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Property Code</p>
                    <p className="text-xs text-muted-foreground">
                      Use a consistent naming convention like PROP-001, BLD-A, etc.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Property Type</p>
                    <p className="text-xs text-muted-foreground">
                      Choose carefully as this affects available features and reports
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">After Creation</p>
                    <p className="text-xs text-muted-foreground">
                      You can add spaces, titles, documents, and utilities next
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What You Can Manage */}
          <Card>
            <CardHeader>
              <CardTitle>What You Can Manage</CardTitle>
              <CardDescription>
                Features available after creating your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Home className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Spaces</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Receipt className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Property Titles & Taxes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Tenants & Leases</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Documents & Contracts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Utilities & Services</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Title Movements</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}