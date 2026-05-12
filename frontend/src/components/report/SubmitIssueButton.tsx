import { Loader2, Send } from 'lucide-react'
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
      className="h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700"
      disabled={disabled}
    >
      {isSubmitting ? (
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
      ) : (
        <Send data-icon="inline-start" aria-hidden="true" />
      )}
      {isSubmitting ? 'Preparing signal' : 'Send signal'}
    </Button>
  )
}
