import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { formatDistance } from 'date-fns'
import last from 'lodash/last'

import {
  BORDERS,
  COLORS,
  Chip,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_WRAP_BREAK_WORD,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { ODD_FOCUS_VISIBLE } from '../../../atoms/buttons//constants'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../redux/analytics'
import { Skeleton } from '../../../atoms/Skeleton'
import { useMissingProtocolHardware } from '../../../pages/Protocols/hooks'
import { useCloneRun } from '../../ProtocolUpload/hooks'
import { useRerunnableStatusText } from './hooks'
import {
  useRobotInitializationStatus,
  INIT_STATUS,
} from '../../../resources/health/hooks'

import type { Run, RunData, RunStatus } from '@opentrons/api-client'
import type { ProtocolResource } from '@opentrons/shared-data'

interface RecentRunProtocolCardProps {
  runData: RunData
}

export function RecentRunProtocolCard({
  runData,
}: RecentRunProtocolCardProps): JSX.Element | null {
  const { data, isLoading } = useProtocolQuery(runData.protocolId ?? null)
  const protocolData = data?.data ?? null
  const isProtocolFetching = isLoading
  return protocolData == null ? null : (
    <ProtocolWithLastRun
      protocolData={protocolData}
      runData={runData}
      isProtocolFetching={isProtocolFetching}
    />
  )
}

interface ProtocolWithLastRunProps {
  runData: RunData
  protocolData: ProtocolResource
  isProtocolFetching: boolean
}

export function ProtocolWithLastRun({
  runData,
  protocolData,
  isProtocolFetching,
}: ProtocolWithLastRunProps): JSX.Element {
  const { t, i18n } = useTranslation('device_details')
  const {
    missingProtocolHardware,
    isLoading: isLookingForHardware,
    conflictedSlots,
  } = useMissingProtocolHardware(protocolData.id)
  const history = useHistory()
  const isOk = 'ok' in runData ? !(runData?.ok === false) : true
  const isReadyToBeReRun = isOk && missingProtocolHardware.length === 0
  const chipText = useRerunnableStatusText(
    isOk,
    missingProtocolHardware,
    conflictedSlots
  )
  const trackEvent = useTrackEvent()
  // TODO(BC, 08/29/23): reintroduce this analytics event when we refactor the hook to fetch data lazily (performance concern)
  // const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runData.id)
  const onResetSuccess = (createRunResponse: Run): void => {
    history.push(`runs/${createRunResponse.data.id}/setup`)
  }
  const { cloneRun } = useCloneRun(runData.id, onResetSuccess)
  const robotInitStatus = useRobotInitializationStatus()
  const isRobotInitializing =
    robotInitStatus === INIT_STATUS.INITIALIZING || robotInitStatus == null
  const [showSpinner, setShowSpinner] = React.useState<boolean>(false)

  const protocolName =
    protocolData.metadata.protocolName ?? protocolData.files[0].name

  const protocolId = protocolData.id

  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )

  const PROTOCOL_CARD_STYLE = css`
    flex: 1 0 0;
    &:active {
      background-color: ${isReadyToBeReRun ? COLORS.green40 : COLORS.yellow40};
    }
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
    }
  `

  const PROTOCOL_CARD_CLICKED_STYLE = css`
    flex: 1 0 0;
    background-color: ${isReadyToBeReRun ? COLORS.green40 : COLORS.yellow40};
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
    }
  `

  const PROTOCOL_TEXT_STYLE = css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    overflow: hidden;
    overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
    height: max-content;
  `

  const hasRunTimeParameters =
    analysis?.runTimeParameters != null
      ? analysis?.runTimeParameters.length > 0
      : false

  const handleCardClick = (): void => {
    setShowSpinner(true)
    if (hasRunTimeParameters) {
      history.push(`/protocols/${protocolId}`)
    } else {
      cloneRun()
      trackEvent({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'RecentRunProtocolCard' },
      })
    }
    // TODO(BC, 08/29/23): reintroduce this analytics event when we refactor the hook to fetch data lazily (performance concern)
    // trackProtocolRunEvent({ name: 'runAgain' })
  }

  const terminationTypeMap: { [runStatus in RunStatus]?: string } = {
    [RUN_STATUS_STOPPED]: t('canceled'),
    [RUN_STATUS_SUCCEEDED]: t('completed'),
    [RUN_STATUS_FAILED]: t('failed'),
  }
  // TODO(BC, 2023-06-05): see if addSuffix false allow can remove usage of .replace here
  const formattedLastRunTime = formatDistance(
    new Date(runData.createdAt),
    new Date(),
    {
      addSuffix: true,
    }
  ).replace('about ', '')

  return isProtocolFetching || isLookingForHardware || isRobotInitializing ? (
    <Skeleton
      height="24.5rem"
      width="25.8125rem"
      backgroundSize="64rem"
      borderRadius={BORDERS.borderRadius12}
    />
  ) : (
    <Flex
      aria-label="RecentRunProtocolCard"
      css={!showSpinner ? PROTOCOL_CARD_STYLE : PROTOCOL_CARD_CLICKED_STYLE}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing24}
      gridGap={SPACING.spacing24}
      backgroundColor={
        isOk
          ? isReadyToBeReRun
            ? COLORS.green35
            : COLORS.yellow35
          : COLORS.red35
      }
      width="25.8125rem"
      height="24.5rem"
      borderRadius={BORDERS.borderRadius16}
      onClick={handleCardClick}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Chip
          paddingLeft="0"
          type={isOk ? (isReadyToBeReRun ? 'success' : 'warning') : 'error'}
          background={false}
          text={i18n.format(chipText, 'capitalize')}
        />
        {showSpinner && (
          <Icon
            name="ot-spinner"
            aria-label="icon_ot-spinner"
            spin={true}
            size="2.5rem"
            color={COLORS.black90}
          />
        )}
      </Flex>
      <Flex width="100%" height="14rem">
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize32}
          fontWeight={TYPOGRAPHY.fontWeightBold}
          lineHeight={TYPOGRAPHY.lineHeight42}
          css={PROTOCOL_TEXT_STYLE}
        >
          {protocolName}
        </LegacyStyledText>
      </Flex>
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight={TYPOGRAPHY.lineHeight28}
        color={COLORS.grey60}
      >
        {i18n.format(
          `${terminationTypeMap[runData.status] ?? ''} ${formattedLastRunTime}`,
          'capitalize'
        )}
      </LegacyStyledText>
    </Flex>
  )
}
