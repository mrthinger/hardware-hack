import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StatusLabel } from '../../atoms/StatusLabel'
import { LegacyModal } from '../../molecules/LegacyModal'
import { TaskList } from '../TaskList'

import {
  useAttachedPipettes,
  useCalibrationTaskList,
  useRunHasStarted,
} from '../Devices/hooks'
import { useCurrentRunId } from '../ProtocolUpload/hooks'

import type { DashboardCalOffsetInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibratePipOffset'
import type { DashboardCalTipLengthInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import type { DashboardCalDeckInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateDeck'

interface CalibrationTaskListProps {
  robotName: string
  pipOffsetCalLauncher: DashboardCalOffsetInvoker
  tipLengthCalLauncher: DashboardCalTipLengthInvoker
  deckCalLauncher: DashboardCalDeckInvoker
  exitBeforeDeckConfigCompletion: boolean
}

export function CalibrationTaskList({
  robotName,
  pipOffsetCalLauncher,
  tipLengthCalLauncher,
  deckCalLauncher,
  exitBeforeDeckConfigCompletion,
}: CalibrationTaskListProps): JSX.Element {
  const prevActiveIndex = React.useRef<[number, number] | null>(null)
  const [hasLaunchedWizard, setHasLaunchedWizard] = React.useState<boolean>(
    false
  )
  const [
    showCompletionScreen,
    setShowCompletionScreen,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation(['robot_calibration', 'device_settings'])
  const history = useHistory()
  const { activeIndex, taskList, taskListStatus } = useCalibrationTaskList(
    pipOffsetCalLauncher,
    tipLengthCalLauncher,
    deckCalLauncher
  )
  const runId = useCurrentRunId()

  let generalTaskDisabledReason = null

  const attachedPipettes = useAttachedPipettes()
  if (attachedPipettes.left == null && attachedPipettes.right == null) {
    generalTaskDisabledReason = t(
      'device_settings:attach_a_pipette_before_calibrating'
    )
  }

  const runHasStarted = useRunHasStarted(runId)
  if (runHasStarted)
    generalTaskDisabledReason = t(
      'device_settings:some_robot_controls_are_not_available'
    )

  React.useEffect(() => {
    if (
      prevActiveIndex.current !== null &&
      activeIndex === null &&
      hasLaunchedWizard
    ) {
      setShowCompletionScreen(true)
    }
    prevActiveIndex.current = activeIndex
  }, [activeIndex, hasLaunchedWizard])

  // start off assuming we are missing calibrations
  let statusLabelBackgroundColor: string = COLORS.red30
  let statusLabelIconColor: string = COLORS.red50
  let statusLabelText = t('missing_calibration_data')

  // if the tasklist is empty, though, all calibrations are good
  if (taskListStatus === 'complete') {
    statusLabelBackgroundColor = COLORS.green30
    statusLabelIconColor = COLORS.green50
    statusLabelText = t('calibration_complete')
    // if we have tasks and they are all marked bad, then we should
    // strongly suggest they re-do those calibrations
  } else if (taskListStatus === 'bad') {
    statusLabelBackgroundColor = COLORS.yellow30
    statusLabelIconColor = COLORS.yellow50
    statusLabelText = t('calibration_recommended')
  }

  return (
    <LegacyModal
      title={`${robotName} ${t('calibration_dashboard')}`}
      onClose={() => {
        history.push(`/devices/${robotName}/robot-settings/calibration`)
      }}
      fullPage
      backgroundColor={COLORS.grey10}
      childrenPadding={`${SPACING.spacing16} ${SPACING.spacing24} ${SPACING.spacing24} ${SPACING.spacing4}`}
      css={css`
        width: 50rem;
        height: 47.5rem;
      `}
    >
      {showCompletionScreen ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding="4.25rem 4.25rem 4.25rem 5.5rem"
        >
          <Flex
            flex="1"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
          >
            {exitBeforeDeckConfigCompletion ? (
              <Icon name="ot-alert" size="3rem" color={COLORS.yellow50} />
            ) : (
              <Icon name="ot-check" size="3rem" color={COLORS.green50} />
            )}
            <LegacyStyledText as="h1" marginTop={SPACING.spacing24}>
              {exitBeforeDeckConfigCompletion
                ? t('using_current_calibrations')
                : t('calibrations_complete')}
            </LegacyStyledText>
            <PrimaryButton
              marginTop={SPACING.spacing24}
              onClick={() => {
                history.push(`/devices/${robotName}/robot-settings/calibration`)
              }}
            >
              {t('device_settings:done')}
            </PrimaryButton>
          </Flex>
        </Flex>
      ) : (
        <>
          <Flex
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing8}
            padding={SPACING.spacing16}
            paddingBottom={SPACING.spacing32}
          >
            <LegacyStyledText css={TYPOGRAPHY.h2SemiBold}>
              {t('calibration_status')}
            </LegacyStyledText>
            <StatusLabel
              status={statusLabelText}
              backgroundColor={statusLabelBackgroundColor}
              iconColor={statusLabelIconColor}
              textColor={COLORS.black90}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              iconSize="0.313rem"
            />
          </Flex>
          <TaskList
            activeIndex={activeIndex}
            taskList={taskList}
            taskListStatus={taskListStatus}
            generalTaskClickHandler={() => {
              setHasLaunchedWizard(true)
            }}
            generalTaskDisabledReason={generalTaskDisabledReason}
          />
        </>
      )}
    </LegacyModal>
  )
}
