function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse" />
        <div className="h-3.5 w-4/5 bg-gray-200 rounded animate-pulse" />
        <div className="h-3.5 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
