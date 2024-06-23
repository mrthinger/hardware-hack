import * as React from 'react'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { NavLink, Redirect, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_SCROLL,
  POSITION_RELATIVE,
  SIZE_6,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { Tooltip } from '../../../atoms/Tooltip'
import {
  useModuleRenderInfoForProtocolById,
  useRobot,
  useRobotType,
  useRunStatuses,
  useSyncRobotClock,
} from '../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { RunPreview } from '../../../organisms/RunPreview'
import { ProtocolRunSetup } from '../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { ProtocolRunModuleControls } from '../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls'
import { ProtocolRunRuntimeParameters } from '../../../organisms/Devices/ProtocolRun/ProtocolRunRunTimeParameters'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { OPENTRONS_USB } from '../../../redux/discovery'
import { fetchProtocols } from '../../../redux/protocol-storage'
import { appShellRequestor } from '../../../redux/shell/remote'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'

import type { ViewportListRef } from 'react-viewport-list'
import type {
  DesktopRouteParams,
  ProtocolRunDetailsTab,
} from '../../../App/types'
import type { Dispatch } from '../../../redux/types'

const baseRoundTabStyling = css`
  ${TYPOGRAPHY.pSemiBold}
  color: ${COLORS.black90};
  background-color: ${COLORS.purple30};
  border: 0px ${BORDERS.styleSolid} ${COLORS.purple30};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  position: ${POSITION_RELATIVE};

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &:focus-visible {
    outline: 2px ${BORDERS.styleSolid} ${COLORS.yellow50};
  }
`

const disabledRoundTabStyling = css`
  ${baseRoundTabStyling}
  color: ${COLORS.grey40};
  background-color: ${COLORS.grey30};

  &:hover {
    background-color: ${COLORS.grey30};
  }
`

const RoundNavLink = styled(NavLink)`
  ${baseRoundTabStyling}
  color: ${COLORS.black90};

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &.active {
    background-color: ${COLORS.purple50};
    color: ${COLORS.white};

    &:hover {
      background-color: ${COLORS.purple55};
    }
  }
`

const JUMP_OFFSET_FROM_TOP_PX = 20

interface RoundTabProps {
  disabled: boolean
  tabDisabledReason?: string
  to: string
  tabName: string
}

function RoundTab({
  disabled,
  tabDisabledReason,
  to,
  tabName,
}: RoundTabProps): JSX.Element {
  const [targetProps, tooltipProps] = useHoverTooltip()
  return disabled ? (
    <>
      <LegacyStyledText css={disabledRoundTabStyling} {...targetProps}>
        {tabName}
      </LegacyStyledText>
      {tabDisabledReason != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tabDisabledReason}</Tooltip>
      ) : null}
    </>
  ) : (
    <RoundNavLink to={to} replace>
      {tabName}
    </RoundNavLink>
  )
}

export function ProtocolRunDetails(): JSX.Element | null {
  const {
    robotName,
    runId,
    protocolRunDetailsTab,
  } = useParams<DesktopRouteParams>()
  const dispatch = useDispatch<Dispatch>()

  const robot = useRobot(robotName)
  useSyncRobotClock(robotName)
  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return robot != null ? (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
      robotName={robot.name}
    >
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING.spacing16}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing16}
          width="100%"
        >
          <PageContents
            runId={runId}
            robotName={robotName}
            protocolRunDetailsTab={protocolRunDetailsTab}
          />
        </Flex>
      </Box>
    </ApiHostProvider>
  ) : null
}

const JUMPED_STEP_HIGHLIGHT_DELAY_MS = 1000
interface PageContentsProps {
  runId: string
  robotName: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}
function PageContents(props: PageContentsProps): JSX.Element {
  const { runId, robotName, protocolRunDetailsTab } = props
  const robotType = useRobotType(robotName)
  const protocolRunHeaderRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<ViewportListRef | null>(null)
  const [jumpedIndex, setJumpedIndex] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (jumpedIndex != null) {
      setTimeout(() => {
        setJumpedIndex(null)
      }, JUMPED_STEP_HIGHLIGHT_DELAY_MS)
    }
  }, [jumpedIndex])

  const makeHandleScrollToStep = (i: number) => () => {
    listRef.current?.scrollToIndex(i, true, -1 * JUMP_OFFSET_FROM_TOP_PX)
  }
  const makeHandleJumpToStep = (i: number) => () => {
    makeHandleScrollToStep(i)()
    setJumpedIndex(i)
  }
  const protocolRunDetailsContentByTab: {
    [K in ProtocolRunDetailsTab]: JSX.Element | null
  } = {
    setup: (
      <ProtocolRunSetup
        protocolRunHeaderRef={protocolRunHeaderRef}
        robotName={robotName}
        runId={runId}
      />
    ),
    'runtime-parameters': <ProtocolRunRuntimeParameters runId={runId} />,
    'module-controls': (
      <ProtocolRunModuleControls robotName={robotName} runId={runId} />
    ),
    'run-preview': (
      <RunPreview
        runId={runId}
        robotType={robotType}
        ref={listRef}
        jumpedIndex={jumpedIndex}
        makeHandleScrollToStep={makeHandleScrollToStep}
      />
    ),
  }

  const protocolRunDetailsContent = protocolRunDetailsContentByTab[
    protocolRunDetailsTab
  ] ?? (
    // default to the setup tab if no tab or nonexistent tab is passed as a param
    <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/setup`} />
  )

  return (
    <>
      <ProtocolRunHeader
        protocolRunHeaderRef={protocolRunHeaderRef}
        robotName={robotName}
        runId={runId}
        makeHandleJumpToStep={makeHandleJumpToStep}
      />
      <Flex gridGap={SPACING.spacing8} marginBottom={SPACING.spacing12}>
        <SetupTab robotName={robotName} runId={runId} />
        <ParametersTab robotName={robotName} runId={runId} />
        <ModuleControlsTab robotName={robotName} runId={runId} />
        <RunPreviewTab robotName={robotName} runId={runId} />
      </Flex>
      <Box
        backgroundColor={COLORS.white}
        // remove left upper corner border radius when first tab is active
        borderRadius={BORDERS.borderRadius8}
      >
        {protocolRunDetailsContent}
      </Box>
    </>
  )
}

interface SetupTabProps {
  robotName: string
  runId: string
}

const SetupTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const currentRunId = useCurrentRunId()

  const disabled = currentRunId !== runId
  const tabDisabledReason = `${t('setup')} ${t(
    'not_available_for_a_completed_run'
  )}`

  return (
    <>
      <RoundTab
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/setup`}
        tabName={t('setup')}
      />
      {currentRunId !== runId ? (
        // redirect to run preview if not current run
        <Redirect
          to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
        />
      ) : null}
    </>
  )
}

interface ParametersTabProps {
  robotName: string
  runId: string
}

const ParametersTab = (props: ParametersTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const disabled = false
  const tabDisabledReason = ''

  return (
    <>
      <RoundTab
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/runtime-parameters`}
        tabName={t('parameters')}
      />
      {disabled ? (
        <Redirect
          to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
        />
      ) : null}
    </>
  )
}

interface ModuleControlsTabProps {
  robotName: string
  runId: string
}

const ModuleControlsTab = (
  props: ModuleControlsTabProps
): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const currentRunId = useCurrentRunId()
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    runId
  )
  const { isRunStill } = useRunStatuses()

  const disabled = currentRunId !== runId || !isRunStill
  const tabDisabledReason = `${t('module_controls')} ${t(
    currentRunId !== runId
      ? 'not_available_for_a_completed_run'
      : 'not_available_for_a_run_in_progress'
  )}`

  return isEmpty(moduleRenderInfoForProtocolById) ? null : (
    <>
      <RoundTab
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/module-controls`}
        tabName={t('module_controls')}
      />
      {disabled ? (
        // redirect to run preview if not current run
        <Redirect
          to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
        />
      ) : null}
    </>
  )
}

const RunPreviewTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')

  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)

  return (
    <RoundTab
      disabled={robotSideAnalysis == null}
      to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
      tabName={t('run_preview')}
    />
  )
}
