import { useTranslation } from 'react-i18next'
import { useQueryStatus } from '@/shared/hooks/use-query-status'
import { FlagIcon } from '@/shared/ui/icons'
import { QueryStateGate } from '@/shared/ui/query-state-gate'
import { SectionHead } from '@/shared/ui/section-head'
import { StatusFrame } from '@/shared/ui/status-panel/status-frame'
import { RacePicker, RacePickerSkeleton } from './race-picker'
import { RACES_QUERY_KEY, useRaces } from './use-races'

interface RacesStepProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function RacesStep({ selectedId, onSelect }: RacesStepProps) {
  const { t } = useTranslation()
  const { status, retry } = useQueryStatus(useRaces(), RACES_QUERY_KEY)
  const count = status.kind === 'success' ? status.data.length : 0

  return (
    <section aria-labelledby="step-race-title" className="scroll-mt-24">
      <SectionHead
        step={1}
        title={t('races.title')}
        titleId="step-race-title"
        right={
          count > 0 ? (
            <p className="text-label text-ink-muted">{t('races.loaded', { count })}</p>
          ) : undefined
        }
      />
      <QueryStateGate status={status} onRetry={retry} loading={<RacePickerSkeleton />}>
        {(races) =>
          races.length === 0 ? (
            <StatusFrame tone="empty" icon={<FlagIcon />} title={t('races.empty.title')}>
              <p className="mt-1 text-body text-ink-muted">{t('races.empty.body')}</p>
            </StatusFrame>
          ) : (
            <RacePicker races={races} selectedId={selectedId} onSelect={onSelect} />
          )
        }
      </QueryStateGate>
    </section>
  )
}
