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
  FormDescription,
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
import { createRateOverride } from "@/lib/actions/rate-actions"
import { RateOverrideType } from "@prisma/client"
import { CalendarIcon, Shield } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const rateOverrideFormSchema = z.object({
  overrideType: z.nativeEnum(RateOverrideType),
  fixedRate: z.number().positive("Fixed rate must be positive").optional(),
  percentageCap: z.number().positive("Percentage cap must be positive").max(100, "Cannot exceed 100%").optional(),
  effectiveFrom: z.date({ message: "Effective from date is required" }),
  effectiveTo: z.date().optional(),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
}).refine((data) => {
  if (data.overrideType === RateOverrideType.FIXED_RATE && !data.fixedRate) {
    return false
  }
  return true
}, {
  message: "Fixed rate is required for FIXED_RATE override type",
  path: ["fixedRate"],
}).refine((data) => {
  if (data.overrideType === RateOverrideType.PERCENTAGE_CAP && !data.percentageCap) {
    return false
  }
  return true
}, {
  message: "Percentage cap is required for PERCENTAGE_CAP override type",
  path: ["percentageCap"],
}).refine((data) => {
  if (data.effectiveTo && data.effectiveTo <= data.effectiveFrom) {
    return false
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["effectiveTo"],
})

type RateOverrideFormData = z.infer<typeof rateOverrideFormSchema>

interface RateOverrideFormProps {
  leaseUnitId: string
  requestedById: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function RateOverrideForm({
  leaseUnitId,
  requestedById,
  onSuccess,
  trigger,
}: RateOverrideFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RateOverrideFormData>({
    resolver: zodResolver(rateOverrideFormSchema),
    defaultValues: {
      overrideType: RateOverrideType.FIXED_RATE,
      effectiveFrom: new Date(),
      reason: "",
    },
  })

  const overrideType = form.watch("overrideType")

  async function onSubmit(data: RateOverrideFormData) {
    setIsLoading(true)

    try {
      const result = await createRateOverride({
        leaseUnitId,
        overrideType: data.overrideType,
        fixedRate: data.fixedRate,
        percentageCap: data.percentageCap,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        reason: data.reason,
        requestedById,
      })

      if (result.success) {
        toast.success("Rate override request submitted successfully")
        form.reset()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to submit rate override request")
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
            <Shield className="h-4 w-4 mr-2" />
            Request Override
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Rate Override</DialogTitle>
          <DialogDescription>
            Create a rate override to modify or freeze standard rate increases for this lease unit.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="overrideType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Override Type *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Clear conditional fields when type changes
                      if (value !== RateOverrideType.FIXED_RATE) {
                        form.setValue("fixedRate", undefined)
                      }
                      if (value !== RateOverrideType.PERCENTAGE_CAP) {
                        form.setValue("percentageCap", undefined)
                      }
                    }}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select override type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RateOverrideType.FIXED_RATE}>
                        Fixed Rate
                      </SelectItem>
                      <SelectItem value={RateOverrideType.PERCENTAGE_CAP}>
                        Percentage Cap
                      </SelectItem>
                      <SelectItem value={RateOverrideType.NO_INCREASE}>
                        No Increase
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {overrideType === RateOverrideType.FIXED_RATE && "Lock the rate at a specific amount"}
                    {overrideType === RateOverrideType.PERCENTAGE_CAP && "Limit rate increases to a maximum percentage"}
                    {overrideType === RateOverrideType.NO_INCREASE && "Prevent any rate increases during the override period"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {overrideType === RateOverrideType.FIXED_RATE && (
              <FormField
                control={form.control}
                name="fixedRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixed Rate *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          disabled={isLoading}
                          className="pl-8"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {overrideType === RateOverrideType.PERCENTAGE_CAP && (
              <FormField
                control={form.control}
                name="percentageCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentage Cap *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="0.0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          disabled={isLoading}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormDescription>Maximum percentage increase allowed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From *</FormLabel>
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
                            {field.value ? format(field.value, "PP") : "Start date"}
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
                name="effectiveTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective To</FormLabel>
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
                            {field.value ? format(field.value, "PP") : "End date"}
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
                    <FormDescription>Leave empty for indefinite</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a reason for this rate override..."
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
