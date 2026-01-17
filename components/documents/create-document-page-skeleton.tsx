import { Skeleton } from "@/components/ui/skeleton"

export function CreateDocumentPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Skeleton className="h-6 w-6 rounded-none" />
             <Skeleton className="h-8 w-48 rounded-none" />
          </div>
          <Skeleton className="h-4 w-32 rounded-none" />
        </div>
        <Skeleton className="h-9 w-32 rounded-none" />
      </div>

      {/* Create Form */}
      <div className="border border-border bg-background p-6 space-y-8">
        {/* Document Category */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded-none" />
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-border p-3 space-y-2">
                 <Skeleton className="h-6 w-6 rounded-none" />
                 <div className="space-y-1">
                    <Skeleton className="h-4 w-20 rounded-none" />
                    <Skeleton className="h-3 w-16 rounded-none" />
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded-none" />
            <Skeleton className="h-9 w-full rounded-none" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded-none" />
            <Skeleton className="h-9 w-full rounded-none" />
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-none" />
          <div className="border border-dashed border-border p-6 flex flex-col items-center gap-2">
             <Skeleton className="h-8 w-8 rounded-none" />
             <Skeleton className="h-4 w-48 rounded-none" />
             <Skeleton className="h-3 w-32 rounded-none" />
          </div>
        </div>

        {/* Associations */}
        <div className="space-y-4 pt-4 border-t border-border">
          <Skeleton className="h-4 w-32 rounded-none" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-none" />
                <Skeleton className="h-9 w-full rounded-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border border-dashed border-border p-4 bg-muted/5">
           <Skeleton className="h-3 w-24 mb-3 rounded-none" />
           <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-none" />
              <div className="space-y-2 flex-1">
                 <div className="flex gap-2">
                    <Skeleton className="h-5 w-48 rounded-none" />
                    <Skeleton className="h-5 w-24 rounded-none" />
                 </div>
                 <div className="flex gap-2">
                    <Skeleton className="h-4 w-20 rounded-none" />
                    <Skeleton className="h-4 w-20 rounded-none" />
                 </div>
              </div>
           </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <Skeleton className="h-9 w-20 rounded-none" />
          <Skeleton className="h-9 w-32 rounded-none" />
        </div>
      </div>
    </div>
  )
}