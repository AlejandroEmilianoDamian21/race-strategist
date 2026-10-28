import { Trans, useTranslation } from 'react-i18next'
import { formatSignedSeconds } from '@/features/races/format'
import type { SimulationResult } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'
import { CompoundBadge } from '@/shared/ui/compound-badge'
import { ArrowIcon } from '@/shared/ui/icons'

interface PitStopsProps {
  result: SimulationResult
}

const NOTE_COMPONENTS = { code: <code className="font-mono text-[0.88em] text-ink" /> }

export function PitStops({ result }: PitStopsProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')
  const stops = result.pitStops
  const total = stops.reduce((sum, stop) => sum + stop.totalLoss, 0)
  const first = stops[0]

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('result.pitStops.title')}</CardTitle>
        <span className="text-caption text-ink-faint">
          {t('result.pitStops.count', { count: stops.length })}
        </span>
      </CardHead>
      {first === undefined ? (
        <p className="m-0 text-ink-muted">{t('result.pitStops.none')}</p>
      ) : (
        <>
          <ol className="m-0 grid list-none gap-2 p-0">
            {stops.map((stop) => (
              <li
                key={stop.lap}
                className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-sm bg-surface-2 p-3"
              >
                <span className="font-mono text-[15px] font-bold">{`${lap}${stop.lap}`}</span>
                <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                  <CompoundBadge compound={stop.fromCompound} size="sm" decorative />
                  <ArrowIcon width={14} height={14} />
                  <CompoundBadge compound={stop.toCompound} size="sm" decorative />
                  <span>
                    {t(compoundNameKey(stop.fromCompound))} → {t(compoundNameKey(stop.toCompound))}
                  </span>
                </span>
                <span className="font-mono font-bold text-warning">
                  {formatSignedSeconds(stop.totalLoss)}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-[14px]">
            <span className="text-ink-muted">{t('result.pitStops.total')}</span>
            <b className="font-mono">{formatSignedSeconds(total)}</b>
          </div>
          <p className="mb-0 ml-0 mr-0 mt-2 text-caption text-ink-faint">
            <Trans
              i18nKey="result.pitStops.note"
              values={{ lane: first.pitLaneLoss, change: first.tyreChangeTime }}
              components={NOTE_COMPONENTS}
            />
          </p>
        </>
      )}
    </Card>
  )
}
