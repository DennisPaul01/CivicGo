import { Loader2, Send } from '@/components/icons/hugeicons'
import { Button } from '@/components/ui/button'

type SubmitIssueButtonProps = {
  isSubmitting: boolean
  disabled: boolean
}

export function SubmitIssueButton({
  isSubmitting,
  disabled,
}: SubmitIssueButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      className="min-h-12 w-full bg-emerald-600 text-base font-semibold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"
      disabled={disabled}
    >
      {isSubmitting ? (
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
      ) : (
        <Send data-icon="inline-start" aria-hidden="true" />
      )}
      {isSubmitting ? 'Pregatim semnalul' : 'Trimite semnalul'}
    </Button>
  )
}
