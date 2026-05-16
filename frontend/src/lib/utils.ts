import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeDisplayText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('ro-RO')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/g, '')
}

export function isSameDisplayText(first: string | null | undefined, second: string | null | undefined) {
  if (!first || !second) {
    return false
  }

  return normalizeDisplayText(first) === normalizeDisplayText(second)
}
