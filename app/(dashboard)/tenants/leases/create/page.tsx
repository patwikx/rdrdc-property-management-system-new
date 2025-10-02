"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, X, Building, Users, Calendar, DollarSign } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LeaseSchema, LeaseFormData } from "@/lib/validations/lease-schema"
import { createLease, getAvailableUnits } from "@/lib/actions/lease-actions"
import { getAllTenants } from "@/lib/actions/tenant-actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface Tenant {
  id: string
  bpCode: string
  firstName: string | null
  lastName: string | null
  company: string
  businessName: string
  email: string
  status: string
}

interface Unit {
  id: string
  unitNumber: string
  totalArea: number
  totalRent: number
  status: string
  property: {
    id: string
    propertyName: string
    propertyCode: string
  }
}

export default function CreateLeasePage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [unitRentAmounts, setUnitRentAmounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<LeaseFormData>({
    resolver: zodResolver(LeaseSchema),
    defaultValues: {
      tenantId: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      securityDeposit: 0,
      unitIds: [],
      unitRentAmounts: {}
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [tenantsResult, unitsResult] = await Promise.all([
          getAllTenants(), // Get all tenants
          getAvailableUnits()
        ])
        
        setTenants(tenantsResult.filter(t => t.status === 'ACTIVE'))
        setUnits(unitsResult)
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load tenants and units')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleUnitSelection = (unitId: string, checked: boolean) => {
    if (checked) {
      const unit = units.find(u => u.id === unitId)
      if (unit) {
        setSelectedUnits(prev => [...prev, unitId])
        setUnitRentAmounts(prev => ({
          ...prev,
          [unitId]: unit.totalRent
        }))
      }
    } else {
      setSelectedUnits(prev => prev.filter(id => id !== unitId))
      setUnitRentAmounts(prev => {
        const newAmounts = { ...prev }
        delete newAmounts[unitId]
        return newAmounts
      })
    }
  }

  const handleRentAmountChange = (unitId: string, amount: number) => {
    setUnitRentAmounts(prev => ({
      ...prev,
      [unitId]: amount
    }))
  }

  const calculateTotalRent = () => {
    return Object.values(unitRentAmounts).reduce((sum, amount) => sum + amount, 0)
  }

  async function onSubmit(data: LeaseFormData) {
    setIsSaving(true)
    
    try {
      const leaseData = {
        ...data,
        unitIds: selectedUnits,
        unitRentAmounts
      }

      const result = await createLease(leaseData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Lease created successfully")
        router.push("/tenants/leases")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getTenantName = (tenant: Tenant) => {
    return tenant.firstName && tenant.lastName 
      ? `${tenant.firstName} ${tenant.lastName}`
      : tenant.businessName || tenant.company
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Lease</h2>
          <p className="text-muted-foreground">
            Create a new lease agreement for a tenant
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tenant Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Tenant Information</span>
                  </CardTitle>
                  <CardDescription>
                    Select the tenant for this lease agreement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tenant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{getTenantName(tenant)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {tenant.bpCode}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>    
          {/* Lease Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Lease Period</span>
                  </CardTitle>
                  <CardDescription>
                    Set the start and end dates for the lease
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Unit Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Unit Selection</span>
                  </CardTitle>
                  <CardDescription>
                    Select units to include in this lease and set rent amounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {units.length === 0 ? (
                    <div className="text-center py-8">
                      <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No available units</h3>
                      <p className="mt-2 text-muted-foreground">
                        All units are currently occupied or reserved.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {units.map((unit) => (
                        <div key={unit.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Checkbox
                            checked={selectedUnits.includes(unit.id)}
                            onCheckedChange={(checked) => handleUnitSelection(unit.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{unit.unitNumber}</span>
                              <Badge variant="outline">{unit.property.propertyName}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {unit.totalArea} sqm • Suggested: ₱{unit.totalRent.toLocaleString()}
                            </p>
                          </div>
                          {selectedUnits.includes(unit.id) && (
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`rent-${unit.id}`} className="text-sm">
                                Rent:
                              </Label>
                              <Input
                                id={`rent-${unit.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={unitRentAmounts[unit.id] || 0}
                                onChange={(e) => handleRentAmountChange(unit.id, parseFloat(e.target.value) || 0)}
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Financial Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selected Units:</span>
                      <span className="font-medium">{selectedUnits.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Monthly Rent:</span>
                      <span className="font-medium">₱{calculateTotalRent().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit:</span>
                      <span className="font-medium">₱{form.watch('securityDeposit')?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Initial Payment:</span>
                      <span>₱{(calculateTotalRent() + (form.watch('securityDeposit') || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Units Summary */}
              {selectedUnits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Selected Units</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedUnits.map((unitId) => {
                        const unit = units.find(u => u.id === unitId)
                        if (!unit) return null
                        
                        return (
                          <div key={unitId} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium">{unit.unitNumber}</p>
                              <p className="text-muted-foreground text-xs">{unit.property.propertyName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₱{(unitRentAmounts[unitId] || 0).toLocaleString()}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => handleUnitSelection(unitId, false)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSaving || selectedUnits.length === 0}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Lease...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Lease
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/tenants/leases">
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}