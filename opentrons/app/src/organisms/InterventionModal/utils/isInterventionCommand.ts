import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RunCommandSummary } from '@opentrons/api-client'

export function isInterventionCommand(
  command: RunTimeCommand | RunCommandSummary
): boolean {
  return (
    command.commandType === 'pause' ||
    command.commandType === 'waitForResume' ||
    (command.commandType === 'moveLabware' &&
      command.params.strategy === 'manualMoveWithPause')
  )
}
