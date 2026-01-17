"use client"
import { useState, useEffect } from "react"
import { format } from "date-fns"

export function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!currentTime) {
    return (
      <div className="flex items-center h-full border-l border-border pl-4 ml-2">
        <div className="flex flex-col items-end gap-0.5 min-w-[120px]">
           <div className="h-2 w-16 bg-muted/20 animate-pulse rounded-none" />
           <div className="h-3 w-24 bg-muted/20 animate-pulse rounded-none" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center h-full border-l border-border pl-4 ml-2">
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
          System Time
        </span>
        <div className="flex items-center gap-2 font-mono text-xs font-medium leading-none">
          <span className="uppercase">{format(currentTime, "MMM dd, yyyy")}</span>
          <span className="text-border">|</span>
          <span suppressHydrationWarning>
            {format(currentTime, "HH:mm:ss")}
          </span>
        </div>
      </div>
    </div>
  )
}