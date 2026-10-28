import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MobileCtaHostContext } from './mobile-cta-host'

export function MobileCta({ children }: { children: ReactNode }) {
  const host = useContext(MobileCtaHostContext)

  return host === null ? null : createPortal(children, host)
}
