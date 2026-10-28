import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

function BaseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 3 18 17H2z" />
      <path d="M10 8v4M10 14.5v.01" />
    </BaseIcon>
  )
}

export function ErrorIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v5M10 13.8v.01" />
    </BaseIcon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </BaseIcon>
  )
}

export function RainIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 2.5S4.5 9 4.5 12.3a5.5 5.5 0 0 0 11 0C15.5 9 10 2.5 10 2.5z" />
    </BaseIcon>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </BaseIcon>
  )
}

export function WrenchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12.5 3a4 4 0 0 0-3.8 5.3L3 14l3 3 5.7-5.7A4 4 0 0 0 17 7.5l-2.5 2.5-2.5-.5-.5-2.5L14 4.5A4 4 0 0 0 12.5 3z" />
    </BaseIcon>
  )
}

export function RetryIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M16 10a6 6 0 1 1-1.8-4.3" />
      <path d="M16 3.5v3.5h-3.5" />
    </BaseIcon>
  )
}

export function BoltIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M11 2 4 11h5l-1 7 7-9h-5z" />
    </BaseIcon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 4v12M4 10h12" />
    </BaseIcon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </BaseIcon>
  )
}

export function ServerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="3" width="14" height="6" rx="1" />
      <rect x="3" y="11" width="14" height="6" rx="1" />
      <path d="M6 6h.01M6 14h.01" />
    </BaseIcon>
  )
}

export function FlagIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 18V3M4 3h11l-2 3.5 2 3.5H4" />
    </BaseIcon>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M17 10H3M8 5l-5 5 5 5" />
    </BaseIcon>
  )
}

export function DotIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="3" />
    </BaseIcon>
  )
}
