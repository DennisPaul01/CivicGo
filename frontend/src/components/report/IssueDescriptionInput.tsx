import { MessageSquareText } from 'lucide-react'

type IssueDescriptionInputProps = {
  value: string
  onChange: (value: string) => void
}

export function IssueDescriptionInput({
  value,
  onChange,
}: IssueDescriptionInputProps) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Description
          </p>
          <h2 className="!mb-0 !mt-0.5 !text-base !leading-tight font-semibold text-emerald-950">
            What should the city know?
          </h2>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
          <MessageSquareText className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <textarea
        className="mt-3 min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: blocked sidewalk near the tram stop, visible after rain."
      />

      <p className="mt-2 text-xs text-slate-500">
        Optional, but useful for AI analysis and civic triage.
      </p>
    </section>
  )
}
