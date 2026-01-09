export function SkeletonLoader({ count = 1, className = "" }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`bg-muted animate-pulse rounded-lg ${className}`} />
      ))}
    </>
  )
}
