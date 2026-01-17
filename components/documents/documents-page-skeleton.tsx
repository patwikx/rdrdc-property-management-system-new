import { Skeleton } from "@/components/ui/skeleton"

export function DocumentsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-border bg-background">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border-r border-border border-b md:border-b-0 last:border-r-0">
            <div className="flex justify-between items-start mb-2">
              <Skeleton className="h-3 w-20 rounded-none" />
              <Skeleton className="h-4 w-4 rounded-none" />
            </div>
            <Skeleton className="h-8 w-16 rounded-none" />
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-none" />
          <Skeleton className="h-4 w-64 rounded-none" />
        </div>
        <Skeleton className="h-9 w-32 rounded-none" />
      </div>

      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 p-1 bg-muted/10 border border-border">
          <div className="relative flex-1 max-w-sm">
            <Skeleton className="h-8 w-full rounded-none" />
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Skeleton className="h-8 w-40 rounded-none" />
        </div>

        {/* Table */}
        <div className="border border-border bg-background">
          {/* Table Header */}
          <div className="bg-muted/5 border-b border-border p-3 grid grid-cols-12 gap-4">
            <Skeleton className="h-4 w-24 col-span-5 rounded-none" />
            <Skeleton className="h-4 w-16 col-span-2 rounded-none" />
            <Skeleton className="h-4 w-20 col-span-2 rounded-none" />
            <Skeleton className="h-4 w-16 col-span-2 rounded-none" />
            <Skeleton className="h-4 w-8 col-span-1 ml-auto rounded-none" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-3 border-b border-border grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5 space-y-2">
                <div className="flex items-center gap-2">
                   <Skeleton className="h-3 w-3 rounded-none" />
                   <Skeleton className="h-4 w-48 rounded-none" />
                </div>
                <Skeleton className="h-3 w-32 ml-5 rounded-none" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-5 w-16 rounded-none" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-none" />
                <div className="space-y-1">
                   <Skeleton className="h-3 w-16 rounded-none" />
                   <Skeleton className="h-2 w-24 rounded-none" />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Skeleton className="h-3 w-20 rounded-none" />
                <Skeleton className="h-3 w-16 rounded-none" />
              </div>
              <div className="col-span-1 flex justify-end">
                <Skeleton className="h-6 w-6 rounded-none" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Skeleton className="h-3 w-48 rounded-none" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-7 w-7 rounded-none" />
            <Skeleton className="h-7 w-7 rounded-none" />
            <Skeleton className="h-7 w-7 rounded-none" />
            <Skeleton className="h-7 w-7 rounded-none" />
            <Skeleton className="h-7 w-7 rounded-none" />
          </div>
        </div>
      </div>
    </div>
  )
}