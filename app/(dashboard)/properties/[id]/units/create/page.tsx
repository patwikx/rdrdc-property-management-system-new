"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Building2, Save, Info, CheckCircle, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateUnitForm } from "@/components/properties/create-unit-form"
import { useRouter } from "next/navigation"
import { getPropertyById } from "@/lib/actions/property-actions"

interface CreateUnitPageProps {
  params: Promise<{
    id: string
  }>
}

const workflowSteps = [
  { step: 1, title: "Space Identity", status: "current" },
  { step: 2, title: "Floor Config", status: "current" },
  { step: 3, title: "Review Totals", status: "upcoming" },
  { step: 4, title: "Assign Tenant", status: "upcoming" },
]

export default function CreateUnitPage({ params }: CreateUnitPageProps) {
  const [propertyId, setPropertyId] = useState<string>("")
  const [propertyName, setPropertyName] = useState<string>("")
  const [isLoading] = useState(false)
  const router = useRouter()

  // In a real app, you'd fetch the property titles here or pass them from a server component
  const propertyTitles: Array<{ id: string; titleNo: string; lotNo: string }> = []

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      setPropertyId(resolvedParams.id)
      
      try {
        const propertyData = await getPropertyById(resolvedParams.id)
        if (propertyData) {
          setPropertyName(propertyData.propertyName)
        }
      } catch (error) {
        console.error("Failed to load property details", error)
      }
    }
    loadData()
  }, [params])

  if (!propertyId) return null

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Create New Space
          </p>
          <h2 className="text-3xl font-bold tracking-tight font-mono uppercase flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {propertyName || "Loading Property..."}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/properties/${propertyId}`}>
            <Button variant="outline" disabled={isLoading} className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            form="create-space-form"
            disabled={isLoading} 
            className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Create Space
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <CreateUnitForm 
            propertyId={propertyId} 
            propertyTitles={propertyTitles}
            onSuccess={() => router.push(`/properties/${propertyId}`)}
            formId="create-space-form"
            hideActions={true}
          />
        </div>

        {/* Sidebar Guide */}
        <div className="space-y-6">
          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Setup Steps</h3>
            </div>
            <div className="space-y-0 relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              {workflowSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-4 relative py-2">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-none border text-xs font-mono z-10 ${
                    step.status === 'current' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-muted-foreground border-border'
                  }`}>
                    {step.step}
                  </div>
                  <span className={`text-xs font-mono uppercase tracking-wide ${
                    step.status === 'current' ? 'text-foreground font-bold' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Helpful Tips</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>Space Numbers should be unique within the property (e.g., 101, 102).</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>Floor area determines the base rental calculation.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>You can attach a Property Title now or link it later.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}