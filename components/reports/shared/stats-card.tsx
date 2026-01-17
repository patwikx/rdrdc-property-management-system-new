import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
  valueClassName?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  valueClassName
}: StatsCardProps) {
  return (
    <div className={cn("p-4 border border-border bg-background hover:bg-muted/5 transition-colors", className)}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex flex-col gap-1">
        <span className={cn("text-2xl font-mono font-medium tracking-tighter text-foreground", valueClassName)}>
          {value}
        </span>
        {description && (
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            {description}
          </span>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-mono uppercase mt-1",
            trend.positive ? "text-emerald-600" : "text-rose-600"
          )}>
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}