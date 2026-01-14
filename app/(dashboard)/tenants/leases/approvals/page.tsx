"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PendingApprovals } from "@/components/rate-management/pending-approvals"
import { 
  getPendingApprovals, 
  getPendingOverrideApprovals,
  type RateChangeRequestWithDetails,
  type RateOverrideWithDetails
} from "@/lib/actions/rate-actions"
import { Clock, CheckCircle, XCircle, RefreshCw, Shield, TrendingUp } from "lucide-react"
import { toast } from "sonner"

export default function ApprovalsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("recommending")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Rate change requests
  const [recommendingRequests, setRecommendingRequests] = useState<RateChangeRequestWithDetails[]>([])
  const [finalRequests, setFinalRequests] = useState<RateChangeRequestWithDetails[]>([])
  
  // Rate override requests
  const [recommendingOverrides, setRecommendingOverrides] = useState<RateOverrideWithDetails[]>([])
  const [finalOverrides, setFinalOverrides] = useState<RateOverrideWithDetails[]>([])

  const userId = session?.user?.id || ""

  const loadApprovals = useCallback(async () => {
    if (!userId) return
    
    try {
      const [recRequests, finRequests, recOverrides, finOverrides] = await Promise.all([
        getPendingApprovals(userId, 'recommending'),
        getPendingApprovals(userId, 'final'),
        getPendingOverrideApprovals(userId, 'recommending'),
        getPendingOverrideApprovals(userId, 'final')
      ])
      
      setRecommendingRequests(recRequests)
      setFinalRequests(finRequests)
      setRecommendingOverrides(recOverrides)
      setFinalOverrides(finOverrides)
    } catch (error) {
      console.error('Error loading approvals:', error)
      toast.error('Failed to load approvals')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadApprovals()
    setIsRefreshing(false)
    toast.success('Approvals refreshed')
  }

  const totalRecommending = recommendingRequests.length + recommendingOverrides.length
  const totalFinal = finalRequests.length + finalOverrides.length

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rate Approvals</h2>
          <p className="text-muted-foreground">
            Review and process pending rate change and override requests
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Recommendations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalRecommending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your recommendation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Final Approval</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalFinal}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your final approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Changes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recommendingRequests.length + finalRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pending rate changes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Overrides</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {recommendingOverrides.length + finalOverrides.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pending overrides
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Recommending vs Final Approval */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommending" className="relative">
            Pending Recommendations
            {totalRecommending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalRecommending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="final" className="relative">
            Pending Final Approval
            {totalFinal > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalFinal}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommending" className="space-y-6">
          {totalRecommending === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                  <p className="mt-2 text-muted-foreground">
                    No pending recommendations at this time.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Rate Change Requests */}
              {recommendingRequests.length > 0 && (
                <PendingApprovals
                  userId={userId}
                  approvalType="recommending"
                  requests={recommendingRequests}
                  onRefresh={loadApprovals}
                />
              )}

              {/* Rate Override Requests */}
              {recommendingOverrides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Pending Override Recommendations
                      <Badge variant="secondary">{recommendingOverrides.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Rate override requests awaiting your recommendation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendingOverrides.map((override) => (
                        <div key={override.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {override.leaseUnit.unit.property.propertyName} - Unit {override.leaseUnit.unit.unitNumber}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {override.leaseUnit.lease.tenant.company} ({override.leaseUnit.lease.tenant.bpCode})
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline">{override.overrideType}</Badge>
                                {override.fixedRate && (
                                  <span className="ml-2 text-sm">Fixed: ₱{override.fixedRate.toLocaleString()}</span>
                                )}
                                {override.percentageCap && (
                                  <span className="ml-2 text-sm">Cap: {override.percentageCap}%</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Requested by {override.requestedBy.firstName} {override.requestedBy.lastName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="final" className="space-y-6">
          {totalFinal === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                  <p className="mt-2 text-muted-foreground">
                    No pending final approvals at this time.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Rate Change Requests */}
              {finalRequests.length > 0 && (
                <PendingApprovals
                  userId={userId}
                  approvalType="final"
                  requests={finalRequests}
                  onRefresh={loadApprovals}
                />
              )}

              {/* Rate Override Requests */}
              {finalOverrides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Pending Override Final Approvals
                      <Badge variant="secondary">{finalOverrides.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Recommended rate overrides awaiting your final approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {finalOverrides.map((override) => (
                        <div key={override.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {override.leaseUnit.unit.property.propertyName} - Unit {override.leaseUnit.unit.unitNumber}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {override.leaseUnit.lease.tenant.company} ({override.leaseUnit.lease.tenant.bpCode})
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline">{override.overrideType}</Badge>
                                {override.fixedRate && (
                                  <span className="ml-2 text-sm">Fixed: ₱{override.fixedRate.toLocaleString()}</span>
                                )}
                                {override.percentageCap && (
                                  <span className="ml-2 text-sm">Cap: {override.percentageCap}%</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Requested by {override.requestedBy.firstName} {override.requestedBy.lastName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
