import { useTranslation } from 'react-i18next'
import { lapTicks } from './lap-ticks'

export function LapAxis({ total }: { total: number }) {
  const { t } = useTranslation()
  const prefix = t('raceInfo.drivers.lapShort')
  const ticks = lapTicks(total)
  const last = ticks.length - 1

  return (
    <div
      aria-hidden="true"
      className="relative mt-2 h-3.5 font-mono text-[11px] leading-[inherit] text-ink-faint"
    >
      {ticks.map((lap, index) => (
        <span
          key={lap}
          style={{ left: `${(index === 0 ? 0 : lap / total) * 100}%` }}
          className={
            index === 0
              ? 'absolute'
              : index === last
                ? 'absolute -translate-x-full'
                : 'absolute -translate-x-1/2'
          }
        >
          {`${prefix}${lap}`}
        </span>
      ))}
    </div>
  )
}
