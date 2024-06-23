import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUSES_TERMINAL,
} from '@opentrons/api-client'
import {
  useModulesQuery,
  useDoorQuery,
  useHost,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  Link as LinkButton,
  PrimaryButton,
  SecondaryButton,
  SIZE_1,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  useConditionalConfirm,
  useHoverTooltip,
} from '@opentrons/components'

import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
import { getRobotSettings } from '../../../redux/robot-settings'
import { getRobotSerialNumber } from '../../../redux/discovery'
import { ProtocolAnalysisErrorBanner } from './ProtocolAnalysisErrorBanner'
import { ProtocolDropTipBanner } from './ProtocolDropTipBanner'
import {
  DropTipWizardFlows,
  useDropTipWizardFlows,
  useTipAttachmentStatus,
} from '../../DropTipWizardFlows'
import { ProtocolAnalysisErrorModal } from './ProtocolAnalysisErrorModal'
import { Banner } from '../../../atoms/Banner'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
} from '../../../redux/analytics'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { Tooltip } from '../../../atoms/Tooltip'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../../organisms/ProtocolUpload/hooks'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import { HeaterShakerIsRunningModal } from '../HeaterShakerIsRunningModal'
import {
  useRunControls,
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { useIsHeaterShakerInProtocol } from '../../ModuleCard/hooks'
import { ConfirmAttachmentModal } from '../../ModuleCard/ConfirmAttachmentModal'
import {
  useProtocolDetailsForRun,
  useProtocolAnalysisErrors,
  useRunCalibrationStatus,
  useRunCreatedAtTimestamp,
  useUnmatchedModulesForProtocol,
  useIsRobotViewable,
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
  useIsFlex,
  useModuleCalibrationStatus,
  useRobot,
} from '../hooks'
import { formatTimestamp } from '../utils'
import { RunTimer } from './RunTimer'
import { EMPTY_TIMESTAMP } from '../constants'
import { getHighestPriorityError } from '../../OnDeviceDisplay/RunningProtocol'
import { RunFailedModal } from './RunFailedModal'
import { RunProgressMeter } from '../../RunProgressMeter'
import { getIsFixtureMismatch } from '../../../resources/deck_configuration/utils'
import { useDeckConfigurationCompatibility } from '../../../resources/deck_configuration/hooks'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useMostRecentRunId } from '../../ProtocolUpload/hooks/useMostRecentRunId'
import { useNotifyRunQuery } from '../../../resources/runs'

import type { Run, RunError, RunStatus } from '@opentrons/api-client'
import type { IconName } from '@opentrons/components'
import type { State } from '../../../redux/types'
import type { HeaterShakerModule } from '../../../redux/modules/types'

const EQUIPMENT_POLL_MS = 5000
const CANCELLABLE_STATUSES = [
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_AWAITING_RECOVERY,
]

interface ProtocolRunHeaderProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}

export function ProtocolRunHeader({
  protocolRunHeaderRef,
  robotName,
  runId,
  makeHandleJumpToStep,
}: ProtocolRunHeaderProps): JSX.Element | null {
  const { t } = useTranslation(['run_details', 'shared'])
  const history = useHistory()
  const host = useHost()
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const {
    protocolData,
    displayName,
    protocolKey,
    isProtocolAnalyzing,
  } = useProtocolDetailsForRun(runId)

  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const isRobotViewable = useIsRobotViewable(robotName)
  const runStatus = useRunStatus(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const { data: attachedInstruments } = useInstrumentsQuery()
  const isRunCurrent = Boolean(useNotifyRunQuery(runId)?.data?.data?.current)
  const mostRecentRunId = useMostRecentRunId()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const [showRunFailedModal, setShowRunFailedModal] = React.useState(false)
  const [showDropTipBanner, setShowDropTipBanner] = React.useState(true)
  const isResetRunLoadingRef = React.useRef(false)
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const highestPriorityError =
    runRecord?.data.errors?.[0] != null
      ? getHighestPriorityError(runRecord?.data?.errors)
      : null

  const robotSettings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )
  const isFlex = useIsFlex(robotName)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const robotType = isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    robotProtocolAnalysis
  )
  const isFixtureMismatch = getIsFixtureMismatch(deckConfigCompatibility)

  const doorSafetySetting = robotSettings.find(
    setting => setting.id === 'enableDoorSafetySwitch'
  )
  const { data: doorStatus } = useDoorQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })
  let isDoorOpen: boolean
  if (isFlex) {
    isDoorOpen = doorStatus?.data.status === 'open'
  } else if (!isFlex && Boolean(doorSafetySetting?.value)) {
    isDoorOpen = doorStatus?.data.status === 'open'
  } else {
    isDoorOpen = false
  }

  const { showDTWiz, toggleDTWiz } = useDropTipWizardFlows()
  const {
    areTipsAttached,
    determineTipStatus,
    resetTipStatus,
    setTipStatusResolved,
    pipettesWithTip,
  } = useTipAttachmentStatus({
    runId,
    runRecord,
    attachedInstruments,
    host,
    isFlex,
  })

  React.useEffect(() => {
    if (isFlex) {
      if (runStatus === RUN_STATUS_IDLE) {
        setShowDropTipBanner(true)
        resetTipStatus()
      } else if (
        runStatus != null &&
        // @ts-expect-error runStatus expected to possibly not be terminal
        RUN_STATUSES_TERMINAL.includes(runStatus)
      ) {
        void determineTipStatus()
      }
    }
  }, [runStatus])

  React.useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      history.push(`/devices`)
    }
  }, [protocolData, isRobotViewable, history])

  // Side effects dependent on the current run state.
  React.useEffect(() => {
    // After a user-initiated stopped run, close the run current run automatically.
    if (runStatus === RUN_STATUS_STOPPED && isRunCurrent && runId != null) {
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
        properties: {
          ...robotAnalyticsData,
        },
      })
      closeCurrentRun()
    }
  }, [runStatus, isRunCurrent, runId, closeCurrentRun])

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP

  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

  // redirect to new run after successful reset
  const onResetSuccess = (createRunResponse: Run): void => {
    history.push(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
    )
  }

  const { pause, play } = useRunControls(runId, onResetSuccess)

  const [showAnalysisErrorModal, setShowAnalysisErrorModal] = React.useState(
    false
  )
  const handleErrorModalCloseClick: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowAnalysisErrorModal(false)
  }
  React.useEffect(() => {
    if (analysisErrors != null && analysisErrors?.length > 0) {
      setShowAnalysisErrorModal(true)
    }
  }, [analysisErrors])

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const handleCancelClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) pause()
    setShowConfirmCancelModal(true)
  }

  const handleClearClick = (): void => {
    trackProtocolRunEvent({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
      properties: robotAnalyticsData ?? undefined,
    })
    closeCurrentRun()
  }

  return (
    <>
      {showRunFailedModal ? (
        <RunFailedModal
          robotName={robotName}
          runId={runId}
          setShowRunFailedModal={setShowRunFailedModal}
          highestPriorityError={highestPriorityError}
        />
      ) : null}
      <Flex
        ref={protocolRunHeaderRef}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        marginBottom={SPACING.spacing16}
        padding={SPACING.spacing16}
      >
        {showAnalysisErrorModal &&
          analysisErrors != null &&
          analysisErrors.length > 0 && (
            <ProtocolAnalysisErrorModal
              displayName={displayName}
              errors={analysisErrors}
              onClose={handleErrorModalCloseClick}
              robotName={robotName}
            />
          )}
        <Flex>
          {protocolKey != null ? (
            <Link to={`/protocols/${protocolKey}`}>
              <LegacyStyledText
                as="h2"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                color={COLORS.blue50}
              >
                {displayName}
              </LegacyStyledText>
            </Link>
          ) : (
            <LegacyStyledText
              as="h2"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {displayName}
            </LegacyStyledText>
          )}
        </Flex>
        {analysisErrors != null && analysisErrors.length > 0 && (
          <ProtocolAnalysisErrorBanner errors={analysisErrors} />
        )}
        {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('close_door_to_resume')}
          </Banner>
        ) : null}
        {runStatus === RUN_STATUS_STOPPED ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('run_canceled')}
          </Banner>
        ) : null}
        {/* Note: This banner is for before running a protocol */}
        {isDoorOpen &&
        runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
        runStatus != null &&
        CANCELLABLE_STATUSES.includes(runStatus) ? (
          <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
            {t('shared:close_robot_door')}
          </Banner>
        ) : null}
        {mostRecentRunId === runId ? (
          <TerminalRunBanner
            {...{
              runStatus,
              handleClearClick,
              isClosingCurrentRun,
              setShowRunFailedModal,
              highestPriorityError,
            }}
            isResetRunLoading={isResetRunLoadingRef.current}
            isRunCurrent={isRunCurrent}
          />
        ) : null}
        {mostRecentRunId === runId && showDropTipBanner && areTipsAttached ? (
          <ProtocolDropTipBanner
            onLaunchWizardClick={toggleDTWiz}
            onCloseClick={() => {
              resetTipStatus()
              setShowDropTipBanner(false)
              closeCurrentRun()
            }}
          />
        ) : null}
        <Box display="grid" gridTemplateColumns="4fr 3fr 3fr 4fr">
          <LabeledValue label={t('run')} value={createdAtTimestamp} />
          <LabeledValue
            label={t('status')}
            value={<DisplayRunStatus runStatus={runStatus} />}
          />
          <LabeledValue
            label={t('run_time')}
            value={
              <RunTimer {...{ runStatus, startedAt, stoppedAt, completedAt }} />
            }
          />
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <ActionButton
              runId={runId}
              robotName={robotName}
              runStatus={runStatus}
              isProtocolAnalyzing={
                protocolData == null || !!isProtocolAnalyzing
              }
              isDoorOpen={isDoorOpen}
              isFixtureMismatch={isFixtureMismatch}
              isResetRunLoadingRef={isResetRunLoadingRef}
            />
          </Flex>
        </Box>
        {runStatus != null ? (
          <Box
            backgroundColor={COLORS.grey10}
            display="grid"
            gridTemplateColumns="4fr 6fr 4fr"
            padding={SPACING.spacing8}
            borderRadius={BORDERS.borderRadius4}
          >
            <LabeledValue
              label={t('protocol_start')}
              value={startedAtTimestamp}
            />
            <LabeledValue
              label={t('protocol_end')}
              value={completedAtTimestamp}
            />
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              {CANCELLABLE_STATUSES.includes(runStatus) && (
                <SecondaryButton
                  isDangerous
                  onClick={handleCancelClick}
                  disabled={isClosingCurrentRun}
                >
                  {t('cancel_run')}
                </SecondaryButton>
              )}
            </Flex>
          </Box>
        ) : null}
        <RunProgressMeter
          {...{
            makeHandleJumpToStep,
            runId,
            robotName,
            resumeRunHandler: play,
          }}
        />
        {showConfirmCancelModal ? (
          <ConfirmCancelModal
            onClose={() => {
              setShowConfirmCancelModal(false)
            }}
            runId={runId}
            robotName={robotName}
          />
        ) : null}
        {showDTWiz && mostRecentRunId === runId ? (
          <DropTipWizardFlows
            robotType={isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE}
            mount={pipettesWithTip[0].mount}
            instrumentModelSpecs={pipettesWithTip[0].specs}
            closeFlow={() => setTipStatusResolved().then(toggleDTWiz)}
          />
        ) : null}
      </Flex>
    </>
  )
}

interface LabeledValueProps {
  label: string
  value: React.ReactNode
}

function LabeledValue(props: LabeledValueProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <LegacyStyledText as="h6" color={COLORS.grey60}>
        {props.label}
      </LegacyStyledText>
      {typeof props.value === 'string' ? (
        <LegacyStyledText as="p">{props.value}</LegacyStyledText>
      ) : (
        props.value
      )}
    </Flex>
  )
}

interface DisplayRunStatusProps {
  runStatus: RunStatus | null
}

function DisplayRunStatus(props: DisplayRunStatusProps): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex alignItems={ALIGN_CENTER}>
      {props.runStatus === RUN_STATUS_RUNNING ? (
        <Icon
          name="circle"
          color={COLORS.blue50}
          size={SPACING.spacing4}
          marginRight={SPACING.spacing4}
          data-testid="running_circle"
        >
          <animate
            attributeName="fill"
            values={`${COLORS.blue50}; transparent`}
            dur="1s"
            calcMode="discrete"
            repeatCount="indefinite"
          />
        </Icon>
      ) : null}
      <LegacyStyledText as="p">
        {props.runStatus != null ? t(`status_${String(props.runStatus)}`) : ''}
      </LegacyStyledText>
    </Flex>
  )
}

const START_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
]
const RUN_AGAIN_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
]
const DISABLED_STATUSES: RunStatus[] = [
  RUN_STATUS_FINISHING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
]
interface ActionButtonProps {
  runId: string
  robotName: string
  runStatus: RunStatus | null
  isProtocolAnalyzing: boolean
  isDoorOpen: boolean
  isFixtureMismatch: boolean
  isResetRunLoadingRef: React.MutableRefObject<boolean>
}

// TODO(jh, 04-22-2024): Refactor switch cases into separate factories to increase readability and testability.
function ActionButton(props: ActionButtonProps): JSX.Element {
  const {
    runId,
    robotName,
    runStatus,
    isProtocolAnalyzing,
    isDoorOpen,
    isFixtureMismatch,
    isResetRunLoadingRef,
  } = props
  const history = useHistory()
  const { t } = useTranslation(['run_details', 'shared'])
  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: runStatus != null && START_RUN_STATUSES.includes(runStatus),
    })?.data?.data ?? []
  const trackEvent = useTrackEvent()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const {
    play,
    pause,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
  } = useRunControls(runId, (createRunResponse: Run): void =>
    // redirect to new run after successful reset
    {
      history.push(
        `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
      )
    }
  )
  isResetRunLoadingRef.current = isResetRunLoading
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const { complete: isModuleCalibrationComplete } = useModuleCalibrationStatus(
    robotName,
    runId
  )
  const [showIsShakingModal, setShowIsShakingModal] = React.useState(false)
  const isSetupComplete =
    isCalibrationComplete &&
    isModuleCalibrationComplete &&
    missingModuleIds.length === 0
  const isRobotOnWrongVersionOfSoftware = ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => {
      return getRobotUpdateDisplayInfo(state, robotName)
    })?.autoUpdateAction
  )
  const currentRunId = useCurrentRunId()
  const isCurrentRun = currentRunId === runId
  const isOtherRunCurrent = currentRunId != null && currentRunId !== runId
  const isRunControlButtonDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isPlayRunActionLoading ||
    isPauseRunActionLoading ||
    isResetRunLoading ||
    isOtherRunCurrent ||
    isProtocolAnalyzing ||
    isFixtureMismatch ||
    (runStatus != null && DISABLED_STATUSES.includes(runStatus)) ||
    isRobotOnWrongVersionOfSoftware ||
    (isDoorOpen &&
      runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
      runStatus != null &&
      CANCELLABLE_STATUSES.includes(runStatus))
  const robot = useRobot(robotName)
  const robotSerialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null ?? ''
  const handleProceedToRunClick = (): void => {
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { robotSerialNumber },
    })
    play()
  }
  const configBypassHeaterShakerAttachmentConfirmation = useSelector(
    getIsHeaterShakerAttached
  )
  const {
    confirm: confirmAttachment,
    showConfirmation: showConfirmationModal,
    cancel: cancelExit,
  } = useConditionalConfirm(
    handleProceedToRunClick,
    !configBypassHeaterShakerAttachmentConfirmation
  )
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const activeHeaterShaker = attachedModules.find(
    (module): module is HeaterShakerModule =>
      module.moduleType === 'heaterShakerModuleType' &&
      module?.data != null &&
      module.data.speedStatus !== 'idle'
  )
  const isHeaterShakerShaking = attachedModules
    .filter((module): module is HeaterShakerModule => {
      return module.moduleType === 'heaterShakerModuleType'
    })
    .some(module => module?.data != null && module.data.speedStatus !== 'idle')

  let buttonText: string = ''
  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null
  let disableReason = null

  if (currentRunId === runId && (!isSetupComplete || isFixtureMismatch)) {
    disableReason = t('setup_incomplete')
  } else if (isOtherRunCurrent) {
    disableReason = t('shared:robot_is_busy')
  } else if (isRobotOnWrongVersionOfSoftware) {
    disableReason = t('shared:a_software_update_is_available')
  } else if (
    isDoorOpen &&
    runStatus != null &&
    START_RUN_STATUSES.includes(runStatus)
  ) {
    disableReason = t('close_door')
  }

  if (isProtocolAnalyzing) {
    buttonIconName = 'ot-spinner'
    buttonText = t('analyzing_on_robot')
  } else if (runStatus === RUN_STATUS_RUNNING) {
    buttonIconName = 'pause'
    buttonText = t('pause_run')
    handleButtonClick = (): void => {
      pause()
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.PAUSE })
    }
  } else if (runStatus === RUN_STATUS_STOP_REQUESTED) {
    buttonIconName = 'ot-spinner'
    buttonText = t('canceling_run')
  } else if (runStatus != null && START_RUN_STATUSES.includes(runStatus)) {
    buttonIconName = 'play'
    buttonText =
      runStatus === RUN_STATUS_IDLE ? t('start_run') : t('resume_run')
    handleButtonClick = () => {
      if (isHeaterShakerShaking && isHeaterShakerInProtocol) {
        setShowIsShakingModal(true)
      } else if (
        isHeaterShakerInProtocol &&
        !isHeaterShakerShaking &&
        (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_STOPPED)
      ) {
        confirmAttachment()
      } else {
        play()
        history.push(`/devices/${robotName}/protocol-runs/${runId}/run-preview`)
        trackProtocolRunEvent({
          name:
            runStatus === RUN_STATUS_IDLE
              ? ANALYTICS_PROTOCOL_RUN_ACTION.START
              : ANALYTICS_PROTOCOL_RUN_ACTION.RESUME,
          properties:
            runStatus === RUN_STATUS_IDLE && robotAnalyticsData != null
              ? robotAnalyticsData
              : {},
        })
      }
    }
  } else if (runStatus != null && RUN_AGAIN_STATUSES.includes(runStatus)) {
    buttonIconName = 'play'
    buttonText = t('run_again')
    handleButtonClick = () => {
      reset()
      trackEvent({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'RunRecordDetail', robotSerialNumber },
      })
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN,
      })
    }
  }

  return (
    <>
      <PrimaryButton
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="none"
        display={DISPLAY_FLEX}
        padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
        disabled={isRunControlButtonDisabled}
        onClick={handleButtonClick}
        id="ProtocolRunHeader_runControlButton"
        {...targetProps}
      >
        {buttonIconName != null ? (
          <Icon
            name={buttonIconName}
            size={SIZE_1}
            marginRight={SPACING.spacing8}
            spin={
              isProtocolAnalyzing || runStatus === RUN_STATUS_STOP_REQUESTED
            }
          />
        ) : null}
        <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
          {buttonText}
        </LegacyStyledText>
      </PrimaryButton>
      {disableReason != null && (
        <Tooltip tooltipProps={tooltipProps} width="auto" maxWidth="8rem">
          {disableReason}
        </Tooltip>
      )}
      {showIsShakingModal &&
        activeHeaterShaker != null &&
        isHeaterShakerInProtocol &&
        runId != null && (
          <HeaterShakerIsRunningModal
            closeModal={() => {
              setShowIsShakingModal(false)
            }}
            module={activeHeaterShaker}
            startRun={play}
          />
        )}
      {showConfirmationModal && (
        <ConfirmAttachmentModal
          onCloseClick={cancelExit}
          isProceedToRunModal={true}
          onConfirmClick={handleProceedToRunClick}
        />
      )}
    </>
  )
}

// TODO(jh 04-24-2024): Split TerminalRunBanner into a RunSuccessBanner and RunFailedBanner.
interface TerminalRunProps {
  runStatus: RunStatus | null
  handleClearClick: () => void
  isClosingCurrentRun: boolean
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  isResetRunLoading: boolean
  isRunCurrent: boolean
  highestPriorityError?: RunError | null
}
function TerminalRunBanner(props: TerminalRunProps): JSX.Element | null {
  const {
    runStatus,
    handleClearClick,
    isClosingCurrentRun,
    setShowRunFailedModal,
    highestPriorityError,
    isResetRunLoading,
    isRunCurrent,
  } = props
  const { t } = useTranslation('run_details')

  const handleRunSuccessClick = (): void => {
    handleClearClick()
  }

  const handleFailedRunClick = (): void => {
    handleClearClick()
    setShowRunFailedModal(true)
  }

  const buildSuccessBanner = (): JSX.Element => {
    return (
      <Banner
        type="success"
        onCloseClick={handleRunSuccessClick}
        isCloseActionLoading={isClosingCurrentRun}
        iconMarginLeft={SPACING.spacing4}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
          {t('run_completed')}
        </Flex>
      </Banner>
    )
  }

  const buildErrorBanner = (): JSX.Element => {
    return (
      <Banner type="error" iconMarginLeft={SPACING.spacing4}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
          <LegacyStyledText>
            {t('error_info', {
              errorType: highestPriorityError?.errorType,
              errorCode: highestPriorityError?.errorCode,
            })}
          </LegacyStyledText>

          <LinkButton
            onClick={handleFailedRunClick}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {t('view_error')}
          </LinkButton>
        </Flex>
      </Banner>
    )
  }

  if (
    runStatus === RUN_STATUS_SUCCEEDED &&
    isRunCurrent &&
    !isResetRunLoading
  ) {
    return buildSuccessBanner()
  } else if (runStatus === RUN_STATUS_FAILED && !isResetRunLoading) {
    return buildErrorBanner()
  } else {
    return null
  }
}
