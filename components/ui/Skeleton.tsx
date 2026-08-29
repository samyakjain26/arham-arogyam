export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-input bg-green-50 motion-reduce:animate-none ${className}`}
    />
  )
}
