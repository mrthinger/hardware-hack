import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

import { getTopPortalEl } from '../../App/portal'
import { InterventionModal } from '../../molecules/InterventionModal'
import { BeforeBeginning } from './BeforeBeginning'
import { RecoveryError } from './RecoveryError'
import {
  SelectRecoveryOption,
  RetryStep,
  CancelRun,
  RetryNewTips,
  ManageTips,
  FillWellAndSkip,
  RetrySameTips,
  SkipStepSameTips,
  SkipStepNewTips,
  IgnoreErrorSkipStep,
} from './RecoveryOptions'
import { useErrorDetailsModal, ErrorDetailsModal } from './shared'
import { RecoveryInProgress } from './RecoveryInProgress'
import { getErrorKind } from './utils'
import { RECOVERY_MAP } from './constants'

import type { RobotType } from '@opentrons/shared-data'
import type { RecoveryContentProps } from './types'
import type {
  useRouteUpdateActions,
  useRecoveryCommands,
  ERUtilsResults,
} from './hooks'
import type { ErrorRecoveryFlowsProps } from '.'

interface UseERWizardResult {
  hasLaunchedRecovery: boolean
  showERWizard: boolean
  toggleERWizard: (hasLaunchedER: boolean) => Promise<void>
}

export function useERWizard(): UseERWizardResult {
  const [showERWizard, setShowERWizard] = React.useState(false)
  // Because RunPausedSplash has access to some ER Wiz routes but is not a part of the ER wizard, the splash screen
  // is the "home" route as opposed to SelectRecoveryOption (accessed by pressing "go back" or "continue" enough times)
  // when recovery mode has not been launched.
  const [hasLaunchedRecovery, setHasLaunchedRecovery] = React.useState(false)

  const toggleERWizard = (hasLaunchedER: boolean): Promise<void> => {
    setHasLaunchedRecovery(hasLaunchedER)
    setShowERWizard(!showERWizard)
    return Promise.resolve()
  }

  return { showERWizard, toggleERWizard, hasLaunchedRecovery }
}

export type ErrorRecoveryWizardProps = ErrorRecoveryFlowsProps &
  ERUtilsResults & {
    robotType: RobotType
    isOnDevice: boolean
  }

export function ErrorRecoveryWizard(
  props: ErrorRecoveryWizardProps
): JSX.Element {
  const {
    hasLaunchedRecovery,
    failedCommand,
    recoveryCommands,
    routeUpdateActions,
  } = props
  const errorKind = getErrorKind(failedCommand?.error?.errorType)

  useInitialPipetteHome({
    hasLaunchedRecovery,
    recoveryCommands,
    routeUpdateActions,
  })

  return <ErrorRecoveryComponent errorKind={errorKind} {...props} />
}

export function ErrorRecoveryComponent(
  props: RecoveryContentProps
): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { showModal, toggleModal } = useErrorDetailsModal()

  const buildTitleHeading = (): JSX.Element => {
    const titleText = props.hasLaunchedRecovery
      ? t('recovery_mode')
      : t('cancel_run')
    return <LegacyStyledText as="h4Bold">{titleText}</LegacyStyledText>
  }

  const buildIconHeading = (): JSX.Element => (
    <LegacyStyledText as="pSemiBold">
      {t('view_error_details')}
    </LegacyStyledText>
  )

  if (props.isOnDevice) {
    return createPortal(
      <InterventionModal
        iconName="information"
        iconHeading={buildIconHeading()}
        titleHeading={buildTitleHeading()}
        iconHeadingOnClick={toggleModal}
        type="error"
      >
        {showModal ? (
          <ErrorDetailsModal {...props} toggleModal={toggleModal} />
        ) : null}
        <ErrorRecoveryContent {...props} />
      </InterventionModal>,
      getTopPortalEl()
    )
  } else {
    return null
  }
}

export function ErrorRecoveryContent(props: RecoveryContentProps): JSX.Element {
  const buildBeforeBeginning = (): JSX.Element => {
    return <BeforeBeginning {...props} />
  }

  const buildSelectRecoveryOption = (): JSX.Element => {
    return <SelectRecoveryOption {...props} />
  }

  const buildRecoveryError = (): JSX.Element => {
    return <RecoveryError {...props} />
  }

  const buildRecoveryInProgress = (): JSX.Element => {
    return <RecoveryInProgress {...props} />
  }

  const buildResumeRun = (): JSX.Element => {
    return <RetryStep {...props} />
  }

  const buildCancelRun = (): JSX.Element => {
    return <CancelRun {...props} />
  }

  const buildManageTips = (): JSX.Element => {
    return <ManageTips {...props} />
  }

  const buildRetryNewTips = (): JSX.Element => {
    return <RetryNewTips {...props} />
  }

  const buildRetrySameTips = (): JSX.Element => {
    return <RetrySameTips {...props} />
  }

  const buildFillWellAndSkip = (): JSX.Element => {
    return <FillWellAndSkip {...props} />
  }

  const buildSkipStepSameTips = (): JSX.Element => {
    return <SkipStepSameTips {...props} />
  }

  const buildSkipStepNewTips = (): JSX.Element => {
    return <SkipStepNewTips {...props} />
  }

  const buildIgnoreErrorSkipStep = (): JSX.Element => {
    return <IgnoreErrorSkipStep {...props} />
  }

  switch (props.recoveryMap.route) {
    case RECOVERY_MAP.BEFORE_BEGINNING.ROUTE:
      return buildBeforeBeginning()
    case RECOVERY_MAP.OPTION_SELECTION.ROUTE:
      return buildSelectRecoveryOption()
    case RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE:
      return buildRecoveryError()
    case RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE:
      return buildResumeRun()
    case RECOVERY_MAP.CANCEL_RUN.ROUTE:
      return buildCancelRun()
    case RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE:
      return buildManageTips()
    case RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE:
      return buildRetryNewTips()
    case RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE:
      return buildRetrySameTips()
    case RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE:
      return buildFillWellAndSkip()
    case RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE:
      return buildSkipStepSameTips()
    case RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE:
      return buildSkipStepNewTips()
    case RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE:
      return buildIgnoreErrorSkipStep()
    case RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE:
    case RECOVERY_MAP.ROBOT_RESUMING.ROUTE:
    case RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE:
    case RECOVERY_MAP.ROBOT_CANCELING.ROUTE:
    case RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE:
    case RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE:
      return buildRecoveryInProgress()
    default:
      return buildSelectRecoveryOption()
  }
}
interface UseInitialPipetteHomeParams {
  hasLaunchedRecovery: boolean
  recoveryCommands: ReturnType<typeof useRecoveryCommands>
  routeUpdateActions: ReturnType<typeof useRouteUpdateActions>
}
// Home the Z-axis of all attached pipettes on Error Recovery launch.
export function useInitialPipetteHome({
  hasLaunchedRecovery,
  recoveryCommands,
  routeUpdateActions,
}: UseInitialPipetteHomeParams): void {
  const { homePipetteZAxes } = recoveryCommands
  const { setRobotInMotion } = routeUpdateActions

  // Synchronously set the recovery route to "robot in motion" before initial render to prevent screen flicker on ER launch.
  React.useLayoutEffect(() => {
    if (hasLaunchedRecovery) {
      void setRobotInMotion(true)
        .then(() => homePipetteZAxes())
        .finally(() => setRobotInMotion(false))
    }
  }, [hasLaunchedRecovery])
}
