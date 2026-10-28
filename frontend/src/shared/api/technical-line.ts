import type { AppError } from './app-error'

interface EmptyListLineInput {
  method: string
  path: string
  key: string
}

function joinParts(parts: Array<string | undefined>): string {
  return parts.filter((part): part is string => part !== undefined && part !== '').join(' · ')
}

function outcome(error: AppError): string {
  if (error.kind === 'network') return 'network'
  if (error.kind === 'timeout') return 'timeout'
  return joinParts([error.status?.toString(), error.code, error.backendMessage])
}

export function technicalLine(error: AppError): string {
  const request = joinParts([error.method, error.path]).replace(' · ', ' ')
  const result = outcome(error)
  if (request && result) return `${request} → ${result}`
  return request || result
}

export function emptyListLine({ method, path, key }: EmptyListLineInput): string {
  return `${method} ${path} → 200 · ${key} = [] (0 elementos)`
}
