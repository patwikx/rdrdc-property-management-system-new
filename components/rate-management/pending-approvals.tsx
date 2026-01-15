"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  recommendRateChange,
  approveRateChange,
  rejectRateChange,
  type RateChangeRequestWithDetails,
} from "@/lib/actions/rate-actions"
import { ApprovalStep, RateChangeType } from "@prisma/client"
import { Check, X, Clock, TrendingUp, Building2, User } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface PendingApprovalsProps {
  userId: string
  approvalType: "recommending" | "final"
  requests: RateChangeRequestWithDetails[]
  onRefresh?: () => void
}

const changeTypeLabels: Record<RateChangeType, string> = {
  STANDARD_INCREASE: "Standard Increase",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
  RENEWAL_INCREASE: "Renewal Increase",
  OVERRIDE_REQUEST: "Override Request",
}

export function PendingApprovals({
  userId,
  approvalType,
  requests,
  onRefresh,
}: PendingApprovalsProps) {
  const [selectedRequest, setSelectedRequest] = useState<RateChangeRequestWithDetails | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [remarks, setRemarks] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    if (!selectedRequest) return
    setIsLoading(true)

    try {
      const result = approvalType === "recommending"
        ? await recommendRateChange(selectedRequest.id, userId, remarks || undefined)
        : await approveRateChange(selectedRequest.id, userId, remarks || undefined)

      if (result.success) {
        toast.success(
          approvalType === "recommending"
            ? "Rate change recommended successfully"
            : "Rate change approved successfully"
        )
        closeDialog()
        onRefresh?.()
      } else {
        toast.error(result.error || "Failed to process approval")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !remarks.trim()) {
      toast.error("Rejection reason is required")
      return
    }
    setIsLoading(true)

    try {
      const step = approvalType === "recommending" 
        ? ApprovalStep.RECOMMENDING 
        : ApprovalStep.FINAL

      const result = await rejectRateChange(selectedRequest.id, userId, remarks, step)

      if (result.success) {
        toast.success("Rate change rejected")
        closeDialog()
        onRefresh?.()
      } else {
        toast.error(result.error || "Failed to reject rate change")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const closeDialog = () => {
    setSelectedRequest(null)
    setActionType(null)
    setRemarks("")
  }

  const openApproveDialog = (request: RateChangeRequestWithDetails) => {
    setSelectedRequest(request)
    setActionType("approve")
  }

  const openRejectDialog = (request: RateChangeRequestWithDetails) => {
    setSelectedRequest(request)
    setActionType("reject")
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {approvalType === "recommending" ? "Pending Recommendations" : "Pending Final Approvals"}
          </CardTitle>
          <CardDescription>
            {approvalType === "recommending"
              ? "Rate change requests awaiting your recommendation"
              : "Recommended rate changes awaiting your final approval"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending approvals at this time.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {approvalType === "recommending" ? "Pending Recommendations" : "Pending Final Approvals"}
            <Badge variant="secondary">{requests.length}</Badge>
          </CardTitle>
          <CardDescription>
            {approvalType === "recommending"
              ? "Rate change requests awaiting your recommendation"
              : "Recommended rate changes awaiting your final approval"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead className="text-right">Current Rate</TableHead>
                <TableHead className="text-right">Proposed Rate</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{request.leaseUnit.unit.property.propertyName}</div>
                        <div className="text-sm text-muted-foreground">
                          Unit {request.leaseUnit.unit.unitNumber}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{request.leaseUnit.lease.tenant.company}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.leaseUnit.lease.tenant.bpCode}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {changeTypeLabels[request.changeType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ₱{request.currentRate.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className={`h-4 w-4 ${request.proposedRate > request.currentRate ? "text-green-500" : "text-red-500"}`} />
                      ₱{request.proposedRate.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.effectiveDate), "PP")}
                  </TableCell>
                  <TableCell>
                    {request.requestedBy.firstName} {request.requestedBy.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => openApproveDialog(request)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {approvalType === "recommending" ? "Recommend" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openRejectDialog(request)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve/Recommend Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalType === "recommending" ? "Recommend Rate Change" : "Approve Rate Change"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {approvalType === "recommending"
                    ? "Recommend this rate change for final approval."
                    : "Give final approval for this rate change."}
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="text-sm">
                      <strong>Unit:</strong> {selectedRequest.leaseUnit.unit.property.propertyName} - Unit {selectedRequest.leaseUnit.unit.unitNumber}
                    </div>
                    <div className="text-sm">
                      <strong>Rate Change:</strong> ₱{selectedRequest.currentRate.toLocaleString()} → ₱{selectedRequest.proposedRate.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <strong>Reason:</strong> {selectedRequest.reason}
                    </div>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Remarks (Optional)</label>
              <Textarea
                placeholder="Add any remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? "Processing..." : approvalType === "recommending" ? "Recommend" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Rate Change</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Provide a reason for rejecting this rate change request.
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="text-sm">
                      <strong>Unit:</strong> {selectedRequest.leaseUnit.unit.property.propertyName} - Unit {selectedRequest.leaseUnit.unit.unitNumber}
                    </div>
                    <div className="text-sm">
                      <strong>Rate Change:</strong> ₱{selectedRequest.currentRate.toLocaleString()} → ₱{selectedRequest.proposedRate.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <strong>Reason:</strong> {selectedRequest.reason}
                    </div>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                placeholder="Provide a reason for rejection..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isLoading || !remarks.trim()}
            >
              {isLoading ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
