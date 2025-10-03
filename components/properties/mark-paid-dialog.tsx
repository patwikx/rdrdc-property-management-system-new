"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { markPropertyTaxAsPaid } from "@/lib/actions/property-tax-actions"
import { CheckCircle, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MarkPaidDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  taxId: string
  taxDecNo: string
  taxAmount: number
  onSuccess?: () => void
}

export function MarkPaidDialog({ 
  isOpen, 
  onOpenChange, 
  taxId, 
  taxDecNo, 
  taxAmount, 
  onSuccess 
}: MarkPaidDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paidDate, setPaidDate] = useState<Date>(new Date())
  const [paidRemarks, setPaidRemarks] = useState("")

  const handleMarkAsPaid = async () => {
    setIsLoading(true)
    
    try {
      const result = await markPropertyTaxAsPaid(
        taxId, 
        paidDate, 
        paidRemarks.trim() || undefined
      )
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Property tax marked as paid successfully")
        onOpenChange(false)
        onSuccess?.()
        // Reset form
        setPaidDate(new Date())
        setPaidRemarks("")
      }
    } catch (error) {
      console.error("Error marking property tax as paid:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Mark Tax as Paid</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tax Information */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax Declaration No:</span>
              <span className="font-mono font-semibold">{taxDecNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-semibold text-lg">₱{taxAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Payment Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full justify-start text-left font-normal",
                    !paidDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paidDate ? (
                    format(paidDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paidDate}
                  onSelect={(date) => date && setPaidDate(date)}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01") || isLoading
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Remarks */}
          <div className="space-y-2">
            <Label htmlFor="paid-remarks" className="text-sm font-medium">
              Payment Notes (Optional)
            </Label>
            <Textarea
              id="paid-remarks"
              placeholder="Add any notes about the payment..."
              value={paidRemarks}
              onChange={(e) => setPaidRemarks(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={isLoading || !paidDate}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}