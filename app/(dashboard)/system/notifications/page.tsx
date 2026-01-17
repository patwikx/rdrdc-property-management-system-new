"use client"

import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function UnderConstructionPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background h-[calc(100vh-4rem)]">
      <div className="w-full max-w-2xl border border-border bg-card p-12 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Icon */}
          <div className="bg-muted/10 p-6 border border-border">
            <Construction className="h-16 w-16 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold uppercase tracking-tighter">
              System Module Offline
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              MODULE_NOTIFICATIONS :: CONSTRUCTION_IN_PROGRESS
            </p>
          </div>

          {/* Details */}
          <div className="w-full border border-border bg-muted/5 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="text-left border-r border-border">
                <span className="text-[10px] uppercase text-muted-foreground block mb-1 tracking-widest">System Status</span>
                <span className="font-bold text-amber-600">DEVELOPMENT</span>
              </div>
              <div className="text-left pl-4">
                <span className="text-[10px] uppercase text-muted-foreground block mb-1 tracking-widest">ETA</span>
                <span className="font-bold">PENDING_DEPLOYMENT</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full h-10 rounded-none uppercase tracking-widest text-xs font-bold border-border">
                <Home className="h-3 w-3 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button 
              variant="default"
              onClick={() => window.history.back()}
              className="flex-1 h-10 rounded-none uppercase tracking-widest text-xs font-bold"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Return
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}