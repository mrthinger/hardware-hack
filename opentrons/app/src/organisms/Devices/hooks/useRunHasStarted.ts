import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useRunStatus } from '../../../organisms/RunTimeControl/hooks'

export function useRunHasStarted(runId: string | null): boolean {
  const runStatus = useRunStatus(runId)

  return runStatus != null && runStatus !== RUN_STATUS_IDLE
}
