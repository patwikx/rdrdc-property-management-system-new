/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Save, Info, CheckCircle, Users, Receipt, FileText, Zap, Activity, MapPin, Hash, Home, ChevronRight, LayoutGrid } from "lucide-react"
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
    description: "Office, Retail, Warehouse",
    icon: Building2,
    color: "bg-blue-600"
  },
  { 
    value: PropertyType.RESIDENTIAL, 
    label: "Residential", 
    description: "Apartment, Condo, House",
    icon: Home,
    color: "bg-green-600"
  },
  { 
    value: PropertyType.MIXED, 
    label: "Mixed Use", 
    description: "Combined Asset Types",
    icon: LayoutGrid,
    color: "bg-purple-600"
  },
]

const workflowSteps = [
  { step: 1, title: "Create Property", status: "current" },
  { step: 2, title: "Register Titles", status: "upcoming" },
  { step: 3, title: "Define Spaces", status: "upcoming" },
  { step: 4, title: "Configure Utilities", status: "upcoming" },
  { step: 5, title: "Upload Docs", status: "upcoming" },
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
                form.setError(field as keyof PropertyFormData, { message: messages[0] })
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
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Create New Property</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Add a new property to your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/properties">
            <Button variant="outline" disabled={isLoading} className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            form="property-form"
            disabled={isLoading} 
            className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Create Property
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form id="property-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Type Selection */}
              <div className="border border-border bg-background p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Property Type</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {propertyTypeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = selectedType === option.value
                    return (
                      <div
                        key={option.value}
                        className={`relative cursor-pointer border p-4 transition-all group ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedType(option.value)
                          form.setValue('propertyType', option.value)
                        }}
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className={`p-2 rounded-none ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className={`font-mono text-xs font-bold tracking-wide ${isSelected ? 'text-primary' : 'text-foreground'}`}>{option.label}</h3>
                            <p className="text-[9px] text-muted-foreground mt-1 font-mono uppercase">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Property Details */}
              <div className="border border-border bg-background">
                <div className="border-b border-border bg-muted/10 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    Property Information
                  </span>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="propertyCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Property Code</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. PROP-001" 
                              {...field}
                              disabled={isLoading}
                              className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Property Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Main Building" 
                              {...field}
                              disabled={isLoading}
                              className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Full Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Street, City, Province" 
                            {...field}
                            disabled={isLoading}
                            className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-border">
                    <FormField
                      control={form.control}
                      name="leasableArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Leasable Area (sqm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isLoading}
                              className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Hidden field for property type */}
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <input type="hidden" {...field} value={selectedType} />
                )}
              />
            </form>
          </Form>
        </div>

        {/* Sidebar Guide */}
        <div className="space-y-6">
          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Setup Steps</h3>
            </div>
            <div className="space-y-0 relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              {workflowSteps.map((step, index) => (
                <div key={step.step} className="flex items-center gap-4 relative py-2">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-none border text-xs font-mono z-10 ${
                    step.status === 'current' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-muted-foreground border-border'
                  }`}>
                    {step.step}
                  </div>
                  <span className={`text-xs font-mono uppercase tracking-wide ${
                    step.status === 'current' ? 'text-foreground font-bold' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Helpful Tips</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>Property Code must be unique across the portfolio.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>Asset Type determines available report templates.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>Spaces can be added in bulk after creation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}