import { ImagePlus, Trash2, Upload } from '@/components/icons/hugeicons'
import { Button } from '@/components/ui/button'

type ImageUploaderProps = {
  files: File[]
  previewUrls: string[]
  onFilesChange: (files: File[]) => void
}

export function ImageUploader({
  files,
  previewUrls,
  onFilesChange,
}: ImageUploaderProps) {
  const primaryPreviewUrl = previewUrls[0] ?? ''

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            1
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Fotografie obligatorie
            </p>
            <h2 className="!mb-0 !mt-0.5 !text-base !leading-tight font-semibold text-emerald-950">
              Arata-ne problema dintr-o privire
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              O poza clara ajuta AI-ul sa inteleaga categoria si severitatea.
            </p>
          </div>
        </div>
        <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-lime-50 text-emerald-700 sm:flex">
          <ImagePlus className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <label
        htmlFor="issue-photo"
        className="mt-3 flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-emerald-300 bg-emerald-50/70 p-3 text-center transition hover:border-emerald-500 hover:bg-emerald-50 focus-within:ring-3 focus-within:ring-emerald-500/20 sm:min-h-80"
      >
        {primaryPreviewUrl ? (
          <span className="relative flex min-h-52 w-full items-center justify-center rounded-lg bg-slate-100 sm:min-h-72">
            <img
              src={primaryPreviewUrl}
              alt="Preview pentru problema selectata"
              className="max-h-[18rem] w-full rounded-lg object-contain sm:max-h-[28rem]"
            />
            <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm">
              Fotografia principala
            </span>
            <span className="absolute bottom-3 left-3 right-3 rounded-lg bg-emerald-950/80 px-3 py-2 text-sm font-semibold text-white shadow-sm">
              Apasa aici ca sa schimbi sau sa adaugi imagini
            </span>
          </span>
        ) : (
          <span className="flex max-w-sm flex-col items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <Upload className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-semibold text-emerald-950">
                Incarca fotografii
              </span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">
                Alege pana la 6 imagini JPG, PNG sau HEIC de pe telefon.
              </span>
            </span>
          </span>
        )}
      </label>

      <input
        id="issue-photo"
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          onFilesChange(Array.from(event.target.files ?? []).slice(0, 6))
          event.target.value = ''
        }}
      />

      {files.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {previewUrls.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={`Preview ${index + 1}`}
                className="aspect-square rounded-md object-cover"
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-600">
              {files.length} {files.length === 1 ? 'imagine selectata' : 'imagini selectate'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onFilesChange([])}
            >
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              Sterge tot
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
