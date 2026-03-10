export function Badge({ count, className = '' }) {
  if (!count || count === 0) return null
  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white bg-blue-500 ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
