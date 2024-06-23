import * as React from 'react'
import { useSelector } from 'react-redux'
import { useParams, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  OVERFLOW_WRAP_ANYWHERE,
  OVERFLOW_WRAP_BREAK_WORD,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  useHost,
  useProtocolQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'

import { LargeButton } from '../../atoms/buttons'
import {
  useRunTimestamps,
  useRunControls,
} from '../../organisms/RunTimeControl/hooks'
import {
  useRunCreatedAtTimestamp,
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
} from '../../organisms/Devices/hooks'
import { useCloseCurrentRun } from '../../organisms/ProtocolUpload/hooks'
import { onDeviceDisplayFormatTimestamp } from '../../organisms/Devices/utils'
import { EMPTY_TIMESTAMP } from '../../organisms/Devices/constants'
import { RunTimer } from '../../organisms/Devices/ProtocolRun/RunTimer'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../redux/analytics'
import { getLocalRobot } from '../../redux/discovery'
import { RunFailedModal } from '../../organisms/OnDeviceDisplay/RunningProtocol'
import { formatTimeWithUtcLabel, useNotifyRunQuery } from '../../resources/runs'
import { handleTipsAttachedModal } from '../../organisms/DropTipWizardFlows/TipsAttachedModal'
import { useMostRecentRunId } from '../../organisms/ProtocolUpload/hooks/useMostRecentRunId'
import { useTipAttachmentStatus } from '../../organisms/DropTipWizardFlows'

import type { OnDeviceRouteParams } from '../../App/types'
import type { PipetteWithTip } from '../../organisms/DropTipWizardFlows'

export function RunSummary(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const { t } = useTranslation('run_details')
  const history = useHistory()
  const host = useHost()
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const isRunCurrent = Boolean(runRecord?.data?.current)
  const mostRecentRunId = useMostRecentRunId()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const runStatus = runRecord?.data.status ?? null
  const didRunSucceed = runStatus === RUN_STATUS_SUCCEEDED
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const startedAtTimestamp =
    startedAt != null
      ? onDeviceDisplayFormatTimestamp(startedAt)
      : EMPTY_TIMESTAMP

  const completedAtTimestamp =
    completedAt != null
      ? onDeviceDisplayFormatTimestamp(completedAt)
      : EMPTY_TIMESTAMP

  const [showSplash, setShowSplash] = React.useState(
    runStatus === RUN_STATUS_FAILED || runStatus === RUN_STATUS_SUCCEEDED
  )
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ?? 'no name'
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const { reset, isResetRunLoading } = useRunControls(runId)
  const trackEvent = useTrackEvent()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const [showRunFailedModal, setShowRunFailedModal] = React.useState<boolean>(
    false
  )
  const [showRunAgainSpinner, setShowRunAgainSpinner] = React.useState<boolean>(
    false
  )
  const robotSerialNumber =
    localRobot?.health?.robot_serial ??
    localRobot?.serverHealth?.serialNumber ??
    null

  let headerText = t('run_complete_splash')
  if (runStatus === RUN_STATUS_FAILED) {
    headerText = t('run_failed_splash')
  } else if (runStatus === RUN_STATUS_STOPPED) {
    headerText = t('run_canceled_splash')
  }

  const {
    determineTipStatus,
    setTipStatusResolved,
    pipettesWithTip,
  } = useTipAttachmentStatus({
    runId,
    runRecord,
    attachedInstruments,
    host,
    isFlex: true,
  })

  // Determine tip status on initial render only.
  React.useEffect(() => {
    determineTipStatus()
  }, [])

  const returnToDash = (): void => {
    closeCurrentRun()
    history.push('/')
  }

  // TODO(jh, 05-30-24): EXEC-487. Refactor reset() so we can redirect to the setup page, showing the shimmer skeleton instead.
  const runAgain = (): void => {
    setShowRunAgainSpinner(true)
    reset()
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'RunSummary', robotSerialNumber },
    })
    trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN })
  }

  // If no pipettes have tips attached, execute the routing callback.
  const setTipStatusResolvedAndRoute = (
    routeCb: (pipettesWithTip: PipetteWithTip[]) => void
  ): (() => Promise<void>) => {
    return () =>
      setTipStatusResolved().then(newPipettesWithTip => {
        routeCb(newPipettesWithTip)
      })
  }

  const handleReturnToDash = (pipettesWithTip: PipetteWithTip[]): void => {
    if (mostRecentRunId === runId && pipettesWithTip.length > 0) {
      void handleTipsAttachedModal({
        setTipStatusResolved: setTipStatusResolvedAndRoute(handleReturnToDash),
        host,
        pipettesWithTip,
      })
    } else {
      returnToDash()
    }
  }

  const handleRunAgain = (pipettesWithTip: PipetteWithTip[]): void => {
    if (isRunCurrent && pipettesWithTip.length > 0) {
      void handleTipsAttachedModal({
        setTipStatusResolved: setTipStatusResolvedAndRoute(handleRunAgain),
        host,
        pipettesWithTip,
      })
    } else {
      if (!isResetRunLoading) {
        runAgain()
      }
    }
  }

  const handleViewErrorDetails = (): void => {
    setShowRunFailedModal(true)
  }

  const handleClickSplash = (): void => {
    trackProtocolRunEvent({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
      properties: robotAnalyticsData ?? undefined,
    })
    setShowSplash(false)
  }

  const RUN_AGAIN_SPINNER_TEXT = (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="25.5rem">
      {t('run_again')}
      <Icon
        name="ot-spinner"
        aria-label="icon_ot-spinner"
        spin={true}
        size="2.5rem"
        color={COLORS.white}
      />
    </Flex>
  )

  return (
    <Btn
      display={DISPLAY_FLEX}
      width="100%"
      height="100vh"
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      overflow={OVERFLOW_HIDDEN}
      disabled={isClosingCurrentRun}
      onClick={handleClickSplash}
    >
      {showSplash ? (
        <Flex
          height="100vh"
          width="100%"
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          position={POSITION_ABSOLUTE}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
          padding={SPACING.spacing40}
          backgroundColor={didRunSucceed ? COLORS.green50 : COLORS.red50}
        >
          <SplashFrame>
            <Flex gridGap={SPACING.spacing32} alignItems={ALIGN_CENTER}>
              <Icon
                name={didRunSucceed ? 'ot-check' : 'ot-alert'}
                size="4.5rem"
                color={COLORS.white}
              />
              <SplashHeader>
                {didRunSucceed
                  ? t('run_complete_splash')
                  : t('run_failed_splash')}
              </SplashHeader>
            </Flex>
            <Flex width="49rem" justifyContent={JUSTIFY_CENTER}>
              <SplashBody>{protocolName}</SplashBody>
            </Flex>
          </SplashFrame>
        </Flex>
      ) : (
        <Flex
          height="100vh"
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing40}
        >
          {showRunFailedModal ? (
            <RunFailedModal
              runId={runId}
              setShowRunFailedModal={setShowRunFailedModal}
              errors={runRecord?.data.errors}
            />
          ) : null}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_FLEX_START}
            gridGap={SPACING.spacing16}
          >
            <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
              <Icon
                name={didRunSucceed ? 'ot-check' : 'ot-alert'}
                size="2rem"
                color={didRunSucceed ? COLORS.green50 : COLORS.red50}
              />
              <SummaryHeader>{headerText}</SummaryHeader>
            </Flex>
            <ProtocolName>{protocolName}</ProtocolName>
            <Flex gridGap={SPACING.spacing8} flexWrap={WRAP}>
              <SummaryDatum>
                {`${t('run')}: ${formatTimeWithUtcLabel(createdAtTimestamp)}`}
              </SummaryDatum>
              <SummaryDatum>
                {`${t('duration')}: `}
                <RunTimer
                  {...{
                    runStatus,
                    startedAt,
                    stoppedAt,
                    completedAt,
                  }}
                  style={DURATION_TEXT_STYLE}
                />
              </SummaryDatum>
              <SummaryDatum>
                {`${t('start')}: ${formatTimeWithUtcLabel(startedAtTimestamp)}`}
              </SummaryDatum>
              <SummaryDatum>
                {`${t('end')}: ${formatTimeWithUtcLabel(completedAtTimestamp)}`}
              </SummaryDatum>
            </Flex>
          </Flex>
          <Flex alignSelf={ALIGN_STRETCH} gridGap={SPACING.spacing16}>
            <LargeButton
              flex="1"
              iconName="arrow-left"
              buttonType="secondary"
              onClick={() => {
                handleReturnToDash(pipettesWithTip)
              }}
              buttonText={t('return_to_dashboard')}
              height="17rem"
            />
            <LargeButton
              flex="1"
              iconName="play-round-corners"
              onClick={() => {
                handleRunAgain(pipettesWithTip)
              }}
              buttonText={
                showRunAgainSpinner ? RUN_AGAIN_SPINNER_TEXT : t('run_again')
              }
              height="17rem"
              css={showRunAgainSpinner ? RUN_AGAIN_CLICKED_STYLE : undefined}
            />
            {!didRunSucceed ? (
              <LargeButton
                flex="1"
                iconName="info"
                buttonType="alert"
                onClick={handleViewErrorDetails}
                buttonText={t('view_error_details')}
                height="17rem"
                disabled={
                  runRecord?.data.errors == null ||
                  runRecord?.data.errors.length === 0
                }
              />
            ) : null}
          </Flex>
        </Flex>
      )}
    </Btn>
  )
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: 80px;
  line-height: 94px;
  color: ${COLORS.white};
`
const SplashBody = styled.h4`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
  color: ${COLORS.white};
`

const SummaryHeader = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
`

const SplashFrame = styled(Flex)`
  width: 100%;
  height: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing40};
  border-radius: ${BORDERS.borderRadius8};
`

const ProtocolName = styled.h4`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  color: ${COLORS.grey60};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};
  height: max-content;
`

const SummaryDatum = styled.div`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_CENTER};
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  grid-gap: ${SPACING.spacing4};
  height: 44px;
  background: #d6d6d6;
  border-radius: ${BORDERS.borderRadius4};
  color: ${COLORS.grey60};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  width: max-content;
`
const DURATION_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
`

const RUN_AGAIN_CLICKED_STYLE = css`
  background-color: ${COLORS.blue60};
  &:focus {
    background-color: ${COLORS.blue60};
  }
  &:hover {
    background-color: ${COLORS.blue60};
  }
  &:focus-visible {
    background-color: ${COLORS.blue60};
  }
  &:active {
    background-color: ${COLORS.blue60};
  }
`
