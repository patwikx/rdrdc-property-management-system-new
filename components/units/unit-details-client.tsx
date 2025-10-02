"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Calendar, Receipt, FileText, Wrench } from "lucide-react"
import { format } from "date-fns"

interface UnitDetailsClientProps {
  unit: {
    id: string
    unitNumber: string
    totalArea: number
    totalRent: number
    status: string
    createdAt: Date
    updatedAt: Date
    property: {
      id: string
      propertyName: string
      address: string
      propertyType: string
    }
    propertyTitle: {
      id: string
      titleNo: string
      lotNo: string
      lotArea: number
      registeredOwner: string
    } | null
    unitFloors: {
      id: string
      floorType: string
      area: number
      rate: number
      rent: number
    }[]
    leaseUnits: {
      id: string
      rentAmount: number
      lease: {
        id: string
        startDate: Date
        endDate: Date
        totalRentAmount: number
        securityDeposit: number
        status: string
        terminationDate: Date | null
        terminationReason: string | null
        createdAt: Date
        tenant: {
          id: string
          bpCode: string
          firstName: string | null
          lastName: string | null
          email: string
          phone: string
          emergencyContactName: string | null
          emergencyContactPhone: string | null
          company: string
          businessName: string
          status: string
        }
      }
    }[]
    unitTaxes: {
      id: string
      taxYear: number
      taxDecNo: string
      taxAmount: number
      dueDate: Date
      isPaid: boolean
      paidDate: Date | null
      remarks: string | null
      isAnnual: boolean
      isQuarterly: boolean
      whatQuarter: string | null
    }[]
    maintenanceRequests: {
      id: string
      category: string
      priority: string
      description: string
      status: string
      createdAt: Date
      completedAt: Date | null
    }[]
    documents: {
      id: string
      name: string
      description: string | null
      documentType: string
      fileUrl: string
      createdAt: Date
    }[]
  }
}

function getLeaseStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600'
    case 'PENDING': return 'bg-yellow-600'
    case 'TERMINATED': return 'bg-red-600'
    case 'EXPIRED': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

export function UnitDetailsClient({ unit }: UnitDetailsClientProps) {
  // Get current active lease
  const currentLease = unit.leaseUnits.find(lu => lu.lease.status === 'ACTIVE')?.lease
  const currentTenant = currentLease?.tenant

  // Get lease history (all leases sorted by most recent)
  const leaseHistory = unit.leaseUnits
    .map(lu => lu.lease)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tenant">Current Tenant</TabsTrigger>
        <TabsTrigger value="history">Tenant History</TabsTrigger>
        <TabsTrigger value="taxes">Property Taxes</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Floor Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Floor Configuration</CardTitle>
            <CardDescription>Breakdown of unit floors and rental rates</CardDescription>
          </CardHeader>
          <CardContent>
            {unit.unitFloors.length > 0 ? (
              <div className="space-y-4">
                {unit.unitFloors.map((floor) => (
                  <div key={floor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{floor.floorType.replace('_', ' ')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {floor.area} sqm × ₱{floor.rate.toLocaleString()}/sqm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₱{floor.rent.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Monthly</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Monthly Rent:</span>
                    <span>₱{unit.totalRent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No floor configuration available</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tenant" className="space-y-6">
        {currentTenant && currentLease ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Tenant Information</CardTitle>
              <CardDescription>Active lease details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Tenant Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {currentTenant.firstName} {currentTenant.lastName}</p>
                    <p><span className="font-medium">Company:</span> {currentTenant.company}</p>
                    <p><span className="font-medium">Business:</span> {currentTenant.businessName}</p>
                    <p><span className="font-medium">Email:</span> {currentTenant.email}</p>
                    <p><span className="font-medium">Phone:</span> {currentTenant.phone}</p>
                    <p><span className="font-medium">BP Code:</span> {currentTenant.bpCode}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Lease Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Start Date:</span> {format(new Date(currentLease.startDate), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">End Date:</span> {format(new Date(currentLease.endDate), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">Total Rent:</span> ₱{currentLease.totalRentAmount.toLocaleString()}</p>
                    <p><span className="font-medium">Security Deposit:</span> ₱{currentLease.securityDeposit.toLocaleString()}</p>
                    <p>
                      <span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getLeaseStatusColor(currentLease.status)}`}>
                        {currentLease.status}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
              {currentTenant.emergencyContactName && (
                <div>
                  <h4 className="font-medium mb-2">Emergency Contact</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {currentTenant.emergencyContactName}</p>
                    <p><span className="font-medium">Phone:</span> {currentTenant.emergencyContactPhone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Current Tenant</h3>
              <p className="mt-2 text-muted-foreground">
                This unit is currently vacant or not leased.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenant History</CardTitle>
            <CardDescription>All previous and current leases for this unit</CardDescription>
          </CardHeader>
          <CardContent>
            {leaseHistory.length > 0 ? (
              <div className="space-y-4">
                {leaseHistory.map((lease) => (
                  <div key={lease.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          {lease.tenant.firstName} {lease.tenant.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">{lease.tenant.company}</p>
                      </div>
                      <Badge className={getLeaseStatusColor(lease.status)}>
                        {lease.status}
                      </Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="font-medium">Period:</span>
                        <p>{format(new Date(lease.startDate), 'MMM dd, yyyy')} - {format(new Date(lease.endDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Rent:</span>
                        <p>₱{lease.totalRentAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Security Deposit:</span>
                        <p>₱{lease.securityDeposit.toLocaleString()}</p>
                      </div>
                    </div>
                    {lease.terminationDate && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm">
                          <span className="font-medium">Terminated:</span> {format(new Date(lease.terminationDate), 'MMM dd, yyyy')}
                        </p>
                        {lease.terminationReason && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Reason:</span> {lease.terminationReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                <h4 className="mt-2 text-sm font-semibold">No lease history</h4>
                <p className="text-sm text-muted-foreground">
                  This unit has no lease records yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="taxes" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Unit Property Taxes</CardTitle>
            <CardDescription>Property tax records specific to this unit</CardDescription>
          </CardHeader>
          <CardContent>
            {unit.unitTaxes.length > 0 ? (
              <div className="space-y-4">
                {unit.unitTaxes.map((tax) => (
                  <div key={tax.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Tax Year {tax.taxYear}</h4>
                        <p className="text-sm text-muted-foreground">Tax Dec: {tax.taxDecNo}</p>
                      </div>
                      <Badge className={tax.isPaid ? 'bg-green-600' : 'bg-red-600'}>
                        {tax.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="font-medium">Amount:</span>
                        <p>₱{tax.taxAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p>{format(new Date(tax.dueDate), 'MMM dd, yyyy')}</p>
                      </div>
                      {tax.isPaid && tax.paidDate && (
                        <div>
                          <span className="font-medium">Paid Date:</span>
                          <p>{format(new Date(tax.paidDate), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                    </div>
                    {tax.remarks && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm">
                          <span className="font-medium">Remarks:</span> {tax.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
                <h4 className="mt-2 text-sm font-semibold">No tax records</h4>
                <p className="text-sm text-muted-foreground">
                  This unit has no property tax records yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="maintenance" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>Maintenance history for this unit</CardDescription>
          </CardHeader>
          <CardContent>
            {unit.maintenanceRequests.length > 0 ? (
              <div className="space-y-4">
                {unit.maintenanceRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{request.category}</h4>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">{request.priority}</Badge>
                        <Badge>{request.status}</Badge>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <span className="font-medium">Requested:</span>
                        <p>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                      {request.completedAt && (
                        <div>
                          <span className="font-medium">Completed:</span>
                          <p>{format(new Date(request.completedAt), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
                <h4 className="mt-2 text-sm font-semibold">No maintenance requests</h4>
                <p className="text-sm text-muted-foreground">
                  This unit has no maintenance history yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Unit Documents</CardTitle>
            <CardDescription>Documents related to this unit</CardDescription>
          </CardHeader>
          <CardContent>
            {unit.documents.length > 0 ? (
              <div className="space-y-4">
                {unit.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{document.name}</h4>
                        <p className="text-sm text-muted-foreground">{document.documentType}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <h4 className="mt-2 text-sm font-semibold">No documents</h4>
                <p className="text-sm text-muted-foreground">
                  This unit has no documents uploaded yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}