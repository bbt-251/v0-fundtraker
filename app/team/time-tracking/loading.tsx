import { Skeleton } from "@/components/ui/skeleton"

export default function TimeTrackingLoading() {
  return (
    <div className="flex flex-col">
      <header className="flex h-[5rem] items-center gap-4 border-b bg-background px-6 pt-10 pb-8">
        <div className="flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </header>
      <div className="flex-1 p-6">
        <Skeleton className="h-10 w-[400px] mb-6" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="border rounded-lg p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
