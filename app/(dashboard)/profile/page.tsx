// app/under-construction/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function UnderConstructionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative bg-muted p-8 rounded-full border border-border/50">
              <Construction className="h-20 w-20 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Under Construction
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              This page is currently being built. Check back soon for updates.
            </p>
          </div>

          {/* Details */}
          <div className="w-full max-w-xl p-6 rounded-lg bg-muted/30 border border-border/50">
            <div className="grid grid-cols-2 gap-6 text-base">
              <div className="text-left">
                <span className="text-muted-foreground block mb-1">Status:</span>
                <span className="font-medium">In Development</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block mb-1">Expected:</span>
                <span className="font-medium">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full max-w-md">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full h-12">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Button 
              variant="default"
              onClick={() => window.history.back()}
              className="flex-1 h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}