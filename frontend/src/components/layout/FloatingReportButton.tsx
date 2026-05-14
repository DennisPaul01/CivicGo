import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FloatingReportButton() {
  return (
    <div className="fixed bottom-8 right-8 z-50 hidden justify-center sm:flex">
      <Button
        asChild
        size="lg"
        className="h-16 max-w-full bg-emerald-600 px-5 text-white shadow-xl shadow-emerald-900/24 hover:bg-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/30 sm:h-16 sm:min-w-80"
      >
        <Link to="/report" aria-label="Raportează o problemă">
          <Plus data-icon="inline-start" className="size-6" aria-hidden="true" />
          <span className="min-w-0 text-left">
            <span className="block truncate text-base font-bold">
              Raportează o problemă
            </span>
            <span className="block text-sm font-medium text-emerald-50">
              Alege locul pe hartă pentru raportare
            </span>
          </span>
        </Link>
      </Button>
    </div>
  )
}
