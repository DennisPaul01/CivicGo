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

const wordmarkSizeClasses = {
  sm: 'h-9 w-[6.75rem] sm:w-[7.25rem]',
  md: 'h-10 w-[7.75rem]',
  lg: 'h-14 w-44 sm:h-16 sm:w-52',
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
    <span className={cn('inline-flex min-w-0 flex-col justify-center', className)}>
      <span
        className={cn(
          'relative block shrink-0 overflow-hidden rounded-md',
          wordmarkSizeClasses[size],
        )}
      >
        <img
          src={brand.logo.wordmark}
          alt={brand.name}
          className="size-full object-contain object-center"
          draggable="false"
        />
      </span>
      {showTagline && (
        <span
          className={cn(
            'mt-1 block truncate text-[0.62rem] font-bold uppercase text-slate-500',
            textClassName,
          )}
        >
          {brand.tagline}
        </span>
      )}
    </span>
  )
}
