import * as RadixAvatar from '@radix-ui/react-avatar'

export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <RadixAvatar.Root className={`relative inline-flex shrink-0 rounded-full ${sizes[size]} ${className}`}>
      <RadixAvatar.Image
        src={src}
        alt={name}
        className="w-full h-full rounded-full object-cover"
      />
      <RadixAvatar.Fallback
        className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #1a5fd0 100%)' }}
      >
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
