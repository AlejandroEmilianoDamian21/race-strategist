import { useTranslation } from 'react-i18next'
import type { Tyre } from '@/shared/api/types'
import { Card, CardTitle } from '@/shared/ui/card'
import { TyreChip } from '@/shared/ui/compound-badge'
import { formatSignedSeconds } from './format'

interface TyreCompoundsProps {
  tyres: Tyre[]
  tyreWear: number
}

export function TyreCompounds({ tyres, tyreWear }: TyreCompoundsProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardTitle className="mb-4">{t('raceInfo.tyres.title')}</CardTitle>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {tyres.map((tyre) => (
          <li key={tyre.compound} className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <TyreChip compound={tyre.compound} />
              <span className="font-mono text-data tabular-nums">
                {formatSignedSeconds(tyre.pace)}
              </span>
            </div>
            <div className="flex justify-between gap-2 text-caption text-ink-muted">
              <span>{t('raceInfo.tyres.degradation')}</span>
              <span className="font-mono tabular-nums text-ink">
                {`${formatSignedSeconds(tyre.degradation * tyreWear, 3)}/v`}
              </span>
            </div>
            <div className="flex justify-between gap-2 text-caption text-ink-muted">
              <span>{t('raceInfo.tyres.optimalRain')}</span>
              <span className="font-mono tabular-nums text-ink">
                {`${tyre.optimalRainIntensity.min}–${tyre.optimalRainIntensity.max}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-caption text-ink-faint">{t('raceInfo.tyres.note')}</p>
    </Card>
  )
}
