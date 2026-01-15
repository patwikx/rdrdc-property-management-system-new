"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createRateChangeRequest } from "@/lib/actions/rate-actions"
import { RateChangeType } from "@prisma/client"
import { CalendarIcon, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const rateChangeFormSchema = z.object({
  proposedRate: z.number().positive("Proposed rate must be positive"),
  effectiveDate: z.date({ message: "Effective date is required" }),
  changeType: z.nativeEnum(RateChangeType),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
})

type RateChangeFormData = z.infer<typeof rateChangeFormSchema>

interface RateChangeFormProps {
  leaseUnitId: string
  currentRate: number
  requestedById: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function RateChangeForm({
  leaseUnitId,
  currentRate,
  requestedById,
  onSuccess,
  trigger,
}: RateChangeFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RateChangeFormData>({
    resolver: zodResolver(rateChangeFormSchema),
    defaultValues: {
      proposedRate: currentRate,
      effectiveDate: new Date(),
      changeType: RateChangeType.MANUAL_ADJUSTMENT,
      reason: "",
    },
  })

  const proposedRate = form.watch("proposedRate")
  const percentageChange = currentRate > 0 
    ? ((proposedRate - currentRate) / currentRate * 100).toFixed(2)
    : "0.00"

  async function onSubmit(data: RateChangeFormData) {
    setIsLoading(true)

    try {
      const result = await createRateChangeRequest({
        leaseUnitId,
        proposedRate: data.proposedRate,
        changeType: data.changeType,
        effectiveDate: data.effectiveDate,
        reason: data.reason,
        requestedById,
      })

      if (result.success) {
        toast.success("Rate change request submitted successfully")
        form.reset()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to submit rate change request")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Request Rate Change
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Rate Change</DialogTitle>
          <DialogDescription>
            Submit a rate change request for approval. Current rate: ₱{currentRate.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="proposedRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Rate *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="pl-8"
                      />
                    </div>
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    Change: {Number(percentageChange) >= 0 ? "+" : ""}{percentageChange}%
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="changeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select change type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RateChangeType.MANUAL_ADJUSTMENT}>
                        Manual Adjustment
                      </SelectItem>
                      <SelectItem value={RateChangeType.RENEWAL_INCREASE}>
                        Renewal Increase
                      </SelectItem>
                      <SelectItem value={RateChangeType.STANDARD_INCREASE}>
                        Standard Increase
                      </SelectItem>
                      <SelectItem value={RateChangeType.OVERRIDE_REQUEST}>
                        Override Request
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a reason for this rate change..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
