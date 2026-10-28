import { Trans, useTranslation } from 'react-i18next'
import { formatPercent } from '@/features/races/format'
import type { RaceOverview, SimulationResult } from '@/shared/api/types'
import { InfoIcon } from '@/shared/ui/icons'
import { driverInfo } from './driver-info'

interface AssumptionsProps {
  result: SimulationResult
  overview: RaceOverview
}

const COMPONENTS = {
  b: <b />,
  code: <code className="font-mono text-[0.88em] text-ink" />,
}

export function Assumptions({ result, overview }: AssumptionsProps) {
  const { t } = useTranslation()
  const { circuit, parameters } = overview
  const driver = driverInfo(overview, result.driverId)
  const values = {
    base: circuit.baseLapTime,
    wear: circuit.tyreWear,
    fuel: parameters.fuelEffectPerLap,
    delta: result.driverDelta.toFixed(2),
    car: driver?.carPerformance,
    pace: driver?.pace,
    lane: parameters.pitStopLoss,
    change: parameters.tyreChangeTime,
    safety: formatPercent(parameters.safetyCarProbability),
    variance: parameters.lapTimeVariance,
    overtaking: circuit.overtakingDifficulty,
  }
  const keys = ['lap', 'driver', 'rain', 'pit', 'unmodeled'] as const

  return (
    <details className="mt-4 border-t border-line pt-3">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-ink-muted [&_svg]:size-4">
        <InfoIcon />
        {t('result.assumptions.title')}
      </summary>
      <ul className="mt-2 grid list-disc gap-1 pl-[18px] text-[13px] leading-5 text-ink-muted">
        {keys.map((key) => (
          <li key={key}>
            <Trans i18nKey={`result.assumptions.${key}`} values={values} components={COMPONENTS} />
          </li>
        ))}
      </ul>
    </details>
  )
}
