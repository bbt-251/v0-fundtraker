import { Skeleton } from "@/components/ui/skeleton"

export default function TeamMembersLoading() {
  return (
    <div className="flex flex-col">
      <header className="flex h-[5rem] items-center gap-4 border-b bg-background px-6 pt-10 pb-8">
        <div className="flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </header>
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-[28px_2fr_1.5fr_1.5fr_2fr_1fr_40px] items-center gap-4 border-b p-4 font-medium">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <div></div>
          </div>

          {Array(5)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[28px_2fr_1.5fr_1.5fr_2fr_1fr_40px] items-center gap-4 border-b p-4"
              >
                <Skeleton className="h-4 w-4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
                <div className="flex gap-1">
                  {Array(7)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-6 w-6 rounded-full" />
                    ))}
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
