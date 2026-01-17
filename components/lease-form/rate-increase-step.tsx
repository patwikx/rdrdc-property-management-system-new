"use client"

import { TrendingUp } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"

interface RateIncreaseStepProps {
  form: UseFormReturn<any>
}

export function RateIncreaseStep({ form }: RateIncreaseStepProps) {
  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border bg-muted/10 p-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <TrendingUp className="h-3 w-3" />
          Rate Increase Settings
        </span>
      </div>
      <div className="p-6 space-y-6">
        <FormField
          control={form.control}
          name="autoIncreaseEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="rounded-none"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-xs font-mono uppercase tracking-wide">
                  Enable Automatic Rate Increases
                </FormLabel>
                <FormDescription className="text-[10px] font-mono text-muted-foreground">
                  Automatically apply rent increases at specified intervals
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="standardIncreasePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Increase Percentage *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="h-9 rounded-none border-border font-mono text-sm pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormDescription className="text-[10px] font-mono text-muted-foreground">
                  Percentage to increase rent (0-100%)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="increaseIntervalYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Interval (Years) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="1"
                      placeholder="3"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="h-9 rounded-none border-border font-mono text-sm pr-16"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">years</span>
                  </div>
                </FormControl>
                <FormDescription className="text-[10px] font-mono text-muted-foreground">
                  How often to apply increases (1-10 years)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-4 border border-dashed border-border bg-muted/5">
          <p className="text-[10px] font-mono text-muted-foreground">
            <span className="font-bold text-foreground">Example:</span> With 10% increase every 3 years, 
            a ₱10,000 monthly rent will become ₱11,000 after 3 years, ₱12,100 after 6 years, and so on.
          </p>
        </div>
      </div>
    </div>
  )
}
