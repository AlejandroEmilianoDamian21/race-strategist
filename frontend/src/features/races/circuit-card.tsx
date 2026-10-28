import { useTranslation } from 'react-i18next'
import type { Circuit, RaceOverview } from '@/shared/api/types'
import { Card, CardTitle } from '@/shared/ui/card'
import { BoltIcon } from '@/shared/ui/icons'
import { Meter } from '@/shared/ui/meter'
import { circuitReading } from './circuit-reading'
import { formatLapTime, formatPercent } from './format'

const TYRE_WEAR_SCALE = 1.5
const PIT_COST_SCALE = 30

interface CircuitCardProps {
  circuit: Circuit
  parameters: RaceOverview['parameters']
  rainProbability: number
}

export function CircuitCard({ circuit, parameters, rainProbability }: CircuitCardProps) {
  const { t } = useTranslation()
  const type = t(`circuitTypes.${circuit.type}`, { defaultValue: circuit.type })
  const pitCost = parameters.pitStopLoss + parameters.tyreChangeTime
  const reading = circuitReading({
    tyreWear: circuit.tyreWear,
    overtakingDifficulty: circuit.overtakingDifficulty,
    rainProbability,
    safetyCarProbability: parameters.safetyCarProbability,
  })
  const stats = [
    { label: t('raceInfo.circuit.laps'), value: String(circuit.laps) },
    { label: t('raceInfo.circuit.kmPerLap'), value: circuit.lengthKm.toFixed(3) },
    { label: t('raceInfo.circuit.totalKm'), value: (circuit.laps * circuit.lengthKm).toFixed(1) },
    { label: t('raceInfo.circuit.baseLap'), value: formatLapTime(circuit.baseLapTime) },
  ]

  return (
    <Card>
      <p className="font-display text-eyebrow font-bold uppercase tracking-[1.5px] text-ink-muted">
        {t('raceInfo.circuit.eyebrow', { country: circuit.country, type })}
      </p>
      <CardTitle className="mt-1">{circuit.name}</CardTitle>
      <dl className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-sm border border-line bg-line max-[720px]:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse justify-end bg-surface-1 p-3">
            <dt className="text-caption font-semibold uppercase leading-[23px] tracking-[1px] text-ink-muted">
              {stat.label}
            </dt>
            <dd className="font-mono text-[22px] font-semibold leading-7 tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 max-[720px]:grid-cols-1">
        <Meter
          label={t('raceInfo.circuit.tyreWear')}
          value={circuit.tyreWear}
          max={TYRE_WEAR_SCALE}
          display={`×${circuit.tyreWear}`}
          note={t('raceInfo.circuit.tyreWearNote')}
          tone="warning"
        />
        <Meter
          label={t('raceInfo.circuit.pitCost')}
          value={pitCost}
          max={PIT_COST_SCALE}
          display={`${pitCost.toFixed(1)}s`}
          note={t('raceInfo.circuit.pitCostNote', {
            pitStopLoss: parameters.pitStopLoss,
            tyreChangeTime: parameters.tyreChangeTime,
          })}
        />
        <Meter
          label={t('raceInfo.circuit.overtaking')}
          value={circuit.overtakingDifficulty}
          max={1}
          display={String(circuit.overtakingDifficulty)}
          note={t('raceInfo.circuit.overtakingNote')}
        />
        <Meter
          label={t('raceInfo.circuit.safetyCar')}
          value={parameters.safetyCarProbability}
          max={1}
          display={formatPercent(parameters.safetyCarProbability)}
          note={t('raceInfo.circuit.safetyCarNote')}
        />
      </div>
      <div className="mt-4 flex gap-3 rounded-sm bg-surface-2 px-4 py-3">
        <BoltIcon className="mt-px size-5 flex-none text-accent-text" />
        <div>
          <p className="text-label font-semibold text-ink">{t('raceInfo.circuit.reading.title')}</p>
          <ul
            aria-label={t('raceInfo.circuit.reading.title')}
            className="m-0 mt-1 list-disc pl-[18px] text-data leading-5 text-ink-muted"
          >
            {reading.map((item) => (
              <li key={item.key}>
                {t(`raceInfo.circuit.reading.${item.key}`, { value: item.value })}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
