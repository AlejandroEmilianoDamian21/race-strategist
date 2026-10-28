export const STEP_KEYS = ['race', 'info', 'strategy', 'simulate', 'result'] as const

export type StepKey = (typeof STEP_KEYS)[number]
