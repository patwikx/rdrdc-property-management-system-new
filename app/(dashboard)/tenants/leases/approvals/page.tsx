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
import { Clock, CheckCircle, RefreshCw, Shield, TrendingUp } from "lucide-react"
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
          <div className="h-8 bg-muted rounded-none w-1/3" />
          <div className="h-4 bg-muted rounded-none w-1/2" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-none" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Rate Approvals</h2>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mt-1">
            Processing Queue & Audits
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Recommendations</span>
            <Clock className="h-4 w-4 text-amber-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-amber-600">{totalRecommending}</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Pending</span>
          </div>
        </div>

        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Final Approval</span>
            <CheckCircle className="h-4 w-4 text-blue-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-blue-600">{totalFinal}</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Action Required</span>
          </div>
        </div>

        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Rate Changes</span>
            <TrendingUp className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-emerald-600">
              {recommendingRequests.length + finalRequests.length}
            </span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Total</span>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Overrides</span>
            <Shield className="h-4 w-4 text-purple-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-purple-600">
              {recommendingOverrides.length + finalOverrides.length}
            </span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Total</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger 
            value="recommending" 
            className="relative rounded-none border-b-2 border-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors"
          >
            Pending Recommendations
            {totalRecommending > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-none px-1.5 py-0 text-[10px] font-mono font-bold">
                {totalRecommending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="final" 
            className="relative rounded-none border-b-2 border-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors"
          >
            Pending Final Approval
            {totalFinal > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-none px-1.5 py-0 text-[10px] font-mono font-bold">
                {totalFinal}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommending" className="space-y-6">
          {totalRecommending === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border bg-muted/5">
              <CheckCircle className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Queue Empty</h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase">
                No items requiring recommendation
              </p>
            </div>
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
                <Card className="rounded-none border border-border shadow-none">
                  <CardHeader className="border-b border-border bg-muted/5 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                      <Shield className="h-4 w-4" />
                      Override Recommendations
                      <Badge variant="secondary" className="ml-auto rounded-none font-mono text-[10px]">{recommendingOverrides.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {recommendingOverrides.map((override) => (
                        <div key={override.id} className="p-4 hover:bg-muted/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold">{override.leaseUnit.unit.unitNumber}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{override.leaseUnit.unit.property.propertyName}</span>
                              </div>
                              <div className="text-xs font-mono text-muted-foreground uppercase">
                                {override.leaseUnit.lease.tenant.company} ({override.leaseUnit.lease.tenant.bpCode})
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">{override.overrideType}</Badge>
                                {override.fixedRate && (
                                  <span className="text-xs font-mono">FIXED: ₱{override.fixedRate.toLocaleString()}</span>
                                )}
                                {override.percentageCap && (
                                  <span className="text-xs font-mono">CAP: {override.percentageCap}%</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Requested By</div>
                              <div className="text-xs font-mono">{override.requestedBy.firstName} {override.requestedBy.lastName}</div>
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
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border bg-muted/5">
              <CheckCircle className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">All Clear</h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase">
                No items pending final approval
              </p>
            </div>
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
                <Card className="rounded-none border border-border shadow-none">
                  <CardHeader className="border-b border-border bg-muted/5 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                      <Shield className="h-4 w-4" />
                      Final Approval Overrides
                      <Badge variant="secondary" className="ml-auto rounded-none font-mono text-[10px]">{finalOverrides.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {finalOverrides.map((override) => (
                        <div key={override.id} className="p-4 hover:bg-muted/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold">{override.leaseUnit.unit.unitNumber}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{override.leaseUnit.unit.property.propertyName}</span>
                              </div>
                              <div className="text-xs font-mono text-muted-foreground uppercase">
                                {override.leaseUnit.lease.tenant.company} ({override.leaseUnit.lease.tenant.bpCode})
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">{override.overrideType}</Badge>
                                {override.fixedRate && (
                                  <span className="text-xs font-mono">FIXED: ₱{override.fixedRate.toLocaleString()}</span>
                                )}
                                {override.percentageCap && (
                                  <span className="text-xs font-mono">CAP: {override.percentageCap}%</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Requested By</div>
                              <div className="text-xs font-mono">{override.requestedBy.firstName} {override.requestedBy.lastName}</div>
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
