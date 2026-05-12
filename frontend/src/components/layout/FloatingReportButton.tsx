import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function FloatingReportButton() {
  return (
    <div className="fixed right-4 bottom-20 z-40 sm:right-6 sm:bottom-6">
      <Button
        asChild
        size="lg"
        className="size-12 rounded-full bg-emerald-600 px-0 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/30 sm:h-12 sm:w-auto sm:rounded-lg sm:px-4"
      >
        <a href="/report" aria-label="Report an issue">
          <Plus data-icon="inline-start" aria-hidden="true" />
          <span className="hidden sm:inline">Share a report</span>
        </a>
      </Button>
    </div>
  )
}
