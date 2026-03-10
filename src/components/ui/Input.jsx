export function Input({
  label,
  error,
  className = '',
  icon: Icon,
  rightIcon,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        <input
          className={`
            w-full rounded-xl border border-gray-200 bg-gray-50
            px-4 py-3 text-sm text-gray-900 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100
            disabled:opacity-60 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
