import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ImageUploaderProps = {
  file: File | null
  previewUrl: string
  onFileChange: (file: File | null) => void
}

export function ImageUploader({
  file,
  previewUrl,
  onFileChange,
}: ImageUploaderProps) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Photo
          </p>
          <h2 className="!mb-0 !mt-0.5 !text-base !leading-tight font-semibold text-emerald-950">
            Add a clear issue photo
          </h2>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
          <ImagePlus className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <label
        htmlFor="issue-photo"
        className="mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50/70 p-4 text-center transition hover:border-emerald-500 hover:bg-emerald-50 sm:min-h-40"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected issue preview"
            className="h-36 w-full rounded-lg object-cover sm:h-40"
          />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <Upload className="size-4.5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-emerald-950">
                Upload a photo
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Use JPG, PNG or HEIC from your phone.
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
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />

      {file && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="min-w-0 truncate text-sm font-medium text-slate-700">
            {file.name}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => onFileChange(null)}
          >
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Remove
          </Button>
        </div>
      )}
    </section>
  )
}
