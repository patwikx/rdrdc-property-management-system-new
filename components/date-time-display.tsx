"use client"
import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { format } from "date-fns"

export function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">{format(currentTime, "MMM dd, yyyy")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium" suppressHydrationWarning>
          {format(currentTime, "h:mm:ss a")}
        </span>
      </div>
    </div>
  )
}