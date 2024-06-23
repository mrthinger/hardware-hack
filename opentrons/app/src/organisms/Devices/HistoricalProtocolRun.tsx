import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import { useAllCsvFilesQuery } from '@opentrons/react-api-client'
import { useFeatureFlag } from '../../redux/config'
import { formatInterval } from '../RunTimeControl/utils'
import { formatTimestamp } from './utils'
import { EMPTY_TIMESTAMP } from './constants'
import { HistoricalProtocolRunOverflowMenu as OverflowMenu } from './HistoricalProtocolRunOverflowMenu'
import { HistoricalProtocolRunDrawer as Drawer } from './HistoricalProtocolRunDrawer'
import type { RunData } from '@opentrons/api-client'

const PROTOCOL_NAME_STYLE = css`
  overflow: ${OVERFLOW_HIDDEN};
  white-space: nowrap;
  text-overflow: ellipsis;
`

interface HistoricalProtocolRunProps {
  run: RunData
  protocolName: string
  robotName: string
  robotIsBusy: boolean
  protocolKey?: string
}

export function HistoricalProtocolRun(
  props: HistoricalProtocolRunProps
): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { run, protocolName, robotIsBusy, robotName, protocolKey } = props
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const { data: protocolFileData } = useAllCsvFilesQuery(run.protocolId ?? '')
  const allProtocolDataFiles =
    protocolFileData != null ? protocolFileData.data.files : []
  const runStatus = run.status
  const runDisplayName = formatTimestamp(run.createdAt)
  let duration = EMPTY_TIMESTAMP
  if (runStatus !== 'idle') {
    if (run.completedAt != null && run.startedAt != null) {
      duration = formatInterval(run.startedAt, run.completedAt)
    } else if (run.startedAt != null) {
      duration = formatInterval(run.startedAt, new Date().toString())
    }
  }
  const enableCsvFile = useFeatureFlag('enableCsvFile')

  return (
    <>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        padding={SPACING.spacing8}
        borderTop={BORDERS.lineBorder}
        backgroundColor={
          run.status === 'running' ? COLORS.blue10 : COLORS.white
        }
        width="100%"
        onClick={() => {
          setDrawerOpen(!drawerOpen)
        }}
        cursor="pointer"
      >
        <Flex width="88%" gridGap={SPACING.spacing20}>
          <LegacyStyledText
            as="p"
            width="25%"
            data-testid={`RecentProtocolRuns_Run_${protocolKey}`}
          >
            {runDisplayName}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            width="27%"
            data-testid={`RecentProtocolRuns_Protocol_${protocolKey}`}
            css={PROTOCOL_NAME_STYLE}
          >
            {protocolName}
          </LegacyStyledText>
          {enableCsvFile ? (
            <LegacyStyledText
              as="p"
              width="5%"
              data-testid={`RecentProtocolRuns_Files_${protocolKey}`}
            >
              {allProtocolDataFiles.length}
            </LegacyStyledText>
          ) : null}
          <LegacyStyledText
            as="p"
            width="14%"
            data-testid={`RecentProtocolRuns_Status_${protocolKey}`}
          >
            {runStatus === 'running' ? (
              <Icon
                name="circle"
                color={COLORS.blue50}
                size={SPACING.spacing4}
                marginX={SPACING.spacing4}
                marginBottom={SPACING.spacing4}
              />
            ) : null}
            {runStatus != null ? t(`status_${runStatus}`) : ''}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            width="14%"
            data-testid="RecentProtocolRuns_Duration"
          >
            {duration}
          </LegacyStyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <Box>
            <Icon
              name={drawerOpen ? 'chevron-up' : 'chevron-down'}
              size="1.25rem"
              css={{ cursor: 'pointer' }}
            />
          </Box>
          <OverflowMenu
            runId={run.id}
            robotName={robotName}
            robotIsBusy={robotIsBusy}
          />
        </Flex>
      </Flex>
      {drawerOpen ? <Drawer run={run} robotName={robotName} /> : null}
    </>
  )
}
