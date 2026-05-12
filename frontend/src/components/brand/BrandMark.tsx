import { cn } from '@/lib/utils'
import { brand } from '@/lib/brand'

type BrandMarkProps = {
  compact?: boolean
  className?: string
  iconClassName?: string
  textClassName?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const logoSizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl sm:text-5xl',
}

export function BrandIcon({
  className,
  withShadow = false,
}: {
  className?: string
  withShadow?: boolean
}) {
  return (
    <span
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-[0.82rem] font-bold leading-none text-white',
        withShadow && 'shadow-sm shadow-slate-900/10',
        className,
      )}
      aria-hidden="true"
    >
      <img
        src={brand.logo.icon}
        alt=""
        className="size-full object-cover"
        draggable="false"
      />
    </span>
  )
}

export function BrandMark({
  compact = false,
  className,
  iconClassName,
  textClassName,
  showTagline = false,
  size = 'md',
}: BrandMarkProps) {
  if (compact) {
    return <BrandIcon className={cn(iconClassName, className)} withShadow />
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <BrandIcon className={iconClassName} withShadow />
      <span className="min-w-0">
        <span
          className={cn(
            'relative inline-flex items-center font-bold leading-none text-slate-800',
            logoSizeClasses[size],
            textClassName,
          )}
        >
          Civi<span className="text-emerald-600">Tm</span>
        </span>
        {showTagline && (
          <span className="mt-1 block text-[0.62rem] font-bold uppercase text-slate-500">
            {brand.tagline}
          </span>
        )}
      </span>
    </span>
  )
}
