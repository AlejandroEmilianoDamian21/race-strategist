import { useTranslation } from 'react-i18next'
import { emptyListLine } from '@/shared/api/technical-line'
import { useQueryStatus } from '@/shared/hooks/use-query-status'
import { QueryStateGate } from '@/shared/ui/query-state-gate'
import { SectionHead } from '@/shared/ui/section-head'
import { StatusPanel } from '@/shared/ui/status-panel/status-panel'
import { RacePicker, RacePickerSkeleton } from './race-picker'
import { RACES_QUERY_KEY, useRaces } from './use-races'

const RACES_REQUEST = { method: 'GET', path: '/api/races' }

interface RacesStepProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function RacesStep({ selectedId, onSelect }: RacesStepProps) {
  const { t } = useTranslation()
  const { status, retry } = useQueryStatus(useRaces(), RACES_QUERY_KEY)
  const races = status.kind === 'success' ? status.data : []
  const count = races.length
  const year = races[0]?.date.slice(0, 4)

  return (
    <section
      id="step-race"
      aria-labelledby="step-race-title"
      className="scroll-mt-[90px] pt-12 first:pt-0"
    >
      <SectionHead
        step={1}
        title={t('races.title')}
        titleId="step-race-title"
        right={
          count > 0 ? (
            <p className="text-caption text-ink-faint">{t('races.season', { year, count })}</p>
          ) : undefined
        }
      />
      <QueryStateGate
        status={status}
        onRetry={retry}
        request={RACES_REQUEST}
        loading={<RacePickerSkeleton />}
      >
        {(loaded) =>
          loaded.length === 0 ? (
            <StatusPanel
              variant="api-empty"
              technical={emptyListLine({ ...RACES_REQUEST, key: 'data.races' })}
              onRetry={retry}
            />
          ) : (
            <RacePicker races={loaded} selectedId={selectedId} onSelect={onSelect} />
          )
        }
      </QueryStateGate>
    </section>
  )
}
