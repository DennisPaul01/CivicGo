import { MessageSquareText } from '@/components/icons/hugeicons'

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
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            2
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Detalii optionale
            </p>
            <h2 className="!mb-0 !mt-0.5 !text-base !leading-tight font-semibold text-emerald-950">
              Spune ce nu se vede in poza
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Un reper sau momentul zilei ajuta echipa sa gaseasca mai repede problema.
            </p>
          </div>
        </div>
        <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:flex">
          <MessageSquareText className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <textarea
        className="mt-3 min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-500/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Exemplu: trotuar blocat langa statia de tramvai, vizibil dupa ploaie."
      />

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <p>Optional, dar util pentru analiza AI si trierea civica.</p>
        <span className="shrink-0 font-medium">{value.trim().length}/280</span>
      </div>
    </section>
  )
}
