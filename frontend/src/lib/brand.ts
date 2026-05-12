import type { LucideIcon } from 'lucide-react'

export const brand = {
  name: 'CiviTm',
  tagline: 'Care. Act. Together.',
  description:
    'A friendly civic companion that brings people, ideas and actions together to build stronger communities.',
  logo: {
    icon: '/logo/ChatGPT Image May 12, 2026, 11_05_51 AM (3).png',
  },
}

export type BrandTone =
  | 'navy'
  | 'seafoam'
  | 'coral'
  | 'sunshine'
  | 'lavender'
  | 'cream'
  | 'slate'

export const brandToneClasses: Record<
  BrandTone,
  {
    border: string
    background: string
    text: string
    icon: string
    badge: string
    bar: string
  }
> = {
  navy: {
    border: 'border-slate-200',
    background: 'bg-slate-50',
    text: 'text-slate-700',
    icon: 'bg-slate-50 text-slate-700',
    badge: 'bg-slate-50 text-slate-700 ring-slate-200',
    bar: 'bg-slate-500',
  },
  seafoam: {
    border: 'border-emerald-200',
    background: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'bg-emerald-50 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
  },
  coral: {
    border: 'border-rose-200',
    background: 'bg-rose-50',
    text: 'text-rose-700',
    icon: 'bg-rose-50 text-rose-700',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    bar: 'bg-rose-500',
  },
  sunshine: {
    border: 'border-yellow-200',
    background: 'bg-yellow-50',
    text: 'text-yellow-800',
    icon: 'bg-yellow-50 text-yellow-800',
    badge: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    bar: 'bg-yellow-500',
  },
  lavender: {
    border: 'border-purple-200',
    background: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'bg-purple-50 text-purple-700',
    badge: 'bg-purple-50 text-purple-700 ring-purple-200',
    bar: 'bg-purple-500',
  },
  cream: {
    border: 'border-orange-100',
    background: 'bg-orange-50',
    text: 'text-orange-800',
    icon: 'bg-orange-50 text-orange-800',
    badge: 'bg-orange-50 text-orange-800 ring-orange-100',
    bar: 'bg-orange-300',
  },
  slate: {
    border: 'border-slate-200',
    background: 'bg-white',
    text: 'text-slate-600',
    icon: 'bg-slate-50 text-slate-600',
    badge: 'bg-slate-50 text-slate-600 ring-slate-200',
    bar: 'bg-slate-400',
  },
}

export type ToneIcon = LucideIcon
