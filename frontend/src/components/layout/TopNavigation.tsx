import { UserMenu } from '@/components/auth/UserMenu'
import { BrandMark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  Flag,
  Gift,
  MapPinned,
  Medal,
  Menu,
  Plus,
  Trophy,
  X,
} from '@/components/icons/hugeicons'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Harta', href: '/#map', icon: MapPinned, match: '/' },
  {
    label: 'Evenimente',
    href: '/missions',
    icon: Flag,
    match: '/missions',
  },
  { label: 'Recompense', href: '/rewards', icon: Gift, match: '/rewards' },
  { label: 'Clasament', href: '/leaderboard', icon: Medal, match: '/leaderboard' },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const shouldShowMobileBottomNav = location.pathname !== '/report'

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsMobileMenuOpen(false), 0)

    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', closeMenu)
    document.body.classList.add('overflow-hidden')

    return () => {
      document.removeEventListener('keydown', closeMenu)
      document.body.classList.remove('overflow-hidden')
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <header className="sticky top-3 z-30 w-full sm:top-4">
        <nav className="mx-auto flex min-h-14 w-full max-w-7xl items-center gap-4 rounded-2xl border border-emerald-100/80 bg-white/96 px-4 py-2.5 shadow-sm shadow-slate-900/6 backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:flex-none">
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

            <div className="md:hidden">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={isMobileMenuOpen ? 'Inchide meniul' : 'Deschide meniul'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                {isMobileMenuOpen ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  <Menu className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <div className="inline-flex items-center gap-1.5">
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
                      ? 'h-9 min-w-0 rounded-xl bg-emerald-600 px-3.5 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700'
                      : 'h-9 min-w-0 rounded-xl px-3.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                  }
                >
                  <Link to={item.href} aria-label={item.label}>
                    <Icon className="size-4" aria-hidden="true" data-icon="inline-start" type={isActive ? 'filled' : 'outlined'} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
            </div>
          </div>

          <div className="hidden md:block">
            <UserMenu />
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-[2px] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.aside
              className="absolute inset-x-3 top-20 max-h-[calc(100svh-8rem)] overflow-y-auto rounded-xl border border-emerald-200 bg-white p-3 text-slate-950 shadow-xl shadow-slate-900/18"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              aria-label="Meniu mobil"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <BrandMark
                  size="sm"
                  iconClassName="size-8"
                  textClassName="text-lg"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Inchide meniul"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-3 grid gap-2">
                {[...navItems, { label: 'Activitate', href: '/activity', icon: Activity, match: '/activity' }].map(
                  (item) => {
                    const Icon = item.icon
                    const isActive =
                      item.match === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.match)

                    return (
                      <Button
                        key={item.label}
                        asChild
                        variant={isActive ? 'default' : 'ghost'}
                        className={
                          isActive
                            ? 'h-12 justify-start bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'h-12 justify-start bg-emerald-50/50 text-slate-700 hover:bg-emerald-100 hover:text-emerald-900'
                        }
                      >
                        <Link to={item.href}>
                          <Icon data-icon="inline-start" aria-hidden="true" type={isActive ? 'filled' : 'outlined'} />
                          {item.label}
                        </Link>
                      </Button>
                    )
                  },
                )}
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <UserMenu />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {shouldShowMobileBottomNav && (
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
              const isPrimary = 'isPrimary' in item && item.isPrimary && isActive

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
                      type={isActive ? 'filled' : 'outlined'}
                    />
                    <span className="max-w-full truncate">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}
