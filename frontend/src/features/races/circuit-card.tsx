import { useTranslation } from 'react-i18next'
import type { Circuit, RaceOverview } from '@/shared/api/types'
import { Card, CardTitle } from '@/shared/ui/card'
import { Meter } from '@/shared/ui/meter'
import { formatLapTime, formatPercent } from './format'

const TYRE_WEAR_SCALE = 1.5

interface CircuitCardProps {
  circuit: Circuit
  parameters: RaceOverview['parameters']
}

export function CircuitCard({ circuit, parameters }: CircuitCardProps) {
  const { t } = useTranslation()
  const type = t(`circuitTypes.${circuit.type}`, { defaultValue: circuit.type })
  const stats = [
    { label: t('raceInfo.circuit.laps'), value: String(circuit.laps) },
    { label: t('raceInfo.circuit.kmPerLap'), value: circuit.lengthKm.toFixed(3) },
    { label: t('raceInfo.circuit.totalKm'), value: (circuit.laps * circuit.lengthKm).toFixed(1) },
    { label: t('raceInfo.circuit.baseLap'), value: formatLapTime(circuit.baseLapTime) },
  ]

  return (
    <Card className="min-[1100px]:col-span-2">
      <p className="font-display text-eyebrow font-bold uppercase tracking-[1.5px] text-ink-muted">
        {t('raceInfo.circuit.eyebrow', { country: circuit.country, type })}
      </p>
      <CardTitle className="mt-1">{circuit.name}</CardTitle>
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line min-[720px]:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse justify-end bg-surface-1 p-3">
            <dd className="font-mono text-[22px] font-semibold leading-7 tabular-nums">
              {stat.value}
            </dd>
            <dt className="text-caption font-semibold uppercase tracking-[1px] text-ink-muted">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid gap-4 min-[720px]:grid-cols-3">
        <Meter
          label={t('raceInfo.circuit.tyreWear')}
          value={circuit.tyreWear}
          max={TYRE_WEAR_SCALE}
          display={`×${circuit.tyreWear}`}
          note={t('raceInfo.circuit.tyreWearNote')}
          tone="warning"
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
    </Card>
  )
}
