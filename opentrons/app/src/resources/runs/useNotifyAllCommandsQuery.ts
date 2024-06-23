import { useAllCommandsQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { CommandsData, GetCommandsParams } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: QueryOptionsWithPolling<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  // Assume the useAllCommandsQuery() response can only change when the command links change.
  //
  // TODO(mm, 2024-05-21): I don't think this is correct. If a command goes from
  // running to succeeded, that may change the useAllCommandsQuery response, but it
  // will not necessarily change the command links. We might need an MQTT topic
  // covering "any change in `GET /runs/{id}/commands`".
  const { notifyOnSettled, shouldRefetch } = useNotifyDataReady({
    topic: 'robot-server/runs/commands_links',
    options,
  })

  const httpResponse = useAllCommandsQuery(runId, params, {
    ...options,
    enabled: options?.enabled !== false && shouldRefetch,
    onSettled: notifyOnSettled,
  })

  return httpResponse
}
