import { UserMenu } from '@/components/auth/UserMenu'
import { BrandMark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import { Compass, Gift, HeartHandshake, Plus, Trophy } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Harta', href: '/#map', icon: Compass, match: '/' },
  {
    label: 'Misiuni',
    href: '/missions',
    icon: HeartHandshake,
    match: '/missions',
  },
  { label: 'Recompense', href: '/rewards', icon: Gift, match: '/rewards' },
  { label: 'Zone', href: '/zones', icon: Trophy, match: '/zones' },
]

const mobileNavItems = [
  navItems[0],
  navItems[1],
  { label: 'Raport', href: '/report', icon: Plus, match: '/report', isPrimary: true },
  navItems[2],
  navItems[3],
]

export function TopNavigation() {
  const location = useLocation()

  return (
    <>
      <header className="sticky top-3 z-30 w-full sm:top-4">
        <nav className="mx-auto flex min-h-14 w-full max-w-7xl items-center gap-3 rounded-lg border border-slate-200/80 bg-white/94 px-3 py-2 shadow-sm shadow-slate-900/5 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:flex-none">
            <Link
              to="/"
              className="flex min-w-0 items-center rounded-md px-1 py-1 text-sm font-semibold text-slate-800 outline-none transition-colors hover:text-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/25 sm:min-w-max sm:px-1.5"
              aria-label="Acasa CiviTm"
            >
              <BrandMark
                size="sm"
                iconClassName="size-8"
                textClassName="text-lg min-[390px]:text-xl"
              />
            </Link>

            <div className="sm:hidden">
              <UserMenu />
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.match === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.match)

              return (
                <Button
                  key={item.label}
                  asChild
                  size="sm"
                  variant={isActive ? 'default' : 'ghost'}
                  className={
                    isActive
                      ? 'h-9 min-w-0 bg-emerald-600 px-2.5 text-white shadow-sm hover:bg-emerald-700'
                      : 'h-9 min-w-0 px-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                  }
                >
                  <Link to={item.href} aria-label={item.label}>
                    <Icon data-icon="inline-start" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>

          <div className="hidden sm:block">
            <UserMenu />
          </div>
        </nav>
      </header>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 rounded-lg border border-emerald-200/80 bg-white/95 p-1 shadow-lg shadow-slate-900/12 backdrop-blur-md sm:hidden"
        aria-label="Navigatie mobila principala"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.match === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.match)
            const isPrimary = 'isPrimary' in item && item.isPrimary

            return (
              <Button
                key={item.label}
                asChild
                size="sm"
                variant={isActive ? 'default' : 'ghost'}
                className={
                  isPrimary
                    ? 'h-12 min-w-0 flex-col gap-0.5 bg-emerald-600 px-1 text-[0.68rem] font-bold leading-none text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/30'
                    : isActive
                    ? 'h-12 min-w-0 flex-col gap-0.5 bg-emerald-600 px-1 text-[0.68rem] font-semibold leading-none text-white shadow-sm hover:bg-emerald-700'
                    : 'h-12 min-w-0 flex-col gap-0.5 px-1 text-[0.68rem] font-semibold leading-none text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }
              >
                <Link to={item.href} aria-label={item.label}>
                  <Icon
                    className={isPrimary ? 'size-5' : 'size-4'}
                    aria-hidden="true"
                  />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
