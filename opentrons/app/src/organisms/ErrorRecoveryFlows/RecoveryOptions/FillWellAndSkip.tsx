import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { CancelRun } from './CancelRun'
import {
  RecoveryFooterButtons,
  RecoverySingleColumnContent,
  LeftColumnLabwareInfo,
  RecoveryMap,
  TwoColTextAndFailedStepNextStep,
} from '../shared'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function FillWellAndSkip(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { FILL_MANUALLY_AND_SKIP, CANCEL_RUN } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL:
        return <FillWell {...props} />
      case FILL_MANUALLY_AND_SKIP.STEPS.SKIP:
        return <SkipToNextStep {...props} />
      case CANCEL_RUN.STEPS.CONFIRM_CANCEL:
        return <CancelRun {...props} />
      default:
        console.warn(`${step} in ${route} not explicitly handled. Rerouting.`)
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

export function FillWell(props: RecoveryContentProps): JSX.Element | null {
  const { isOnDevice, routeUpdateActions, failedLabwareUtils } = props
  const { t } = useTranslation('error_recovery')
  const { goBackPrevStep, proceedNextStep } = routeUpdateActions

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <LeftColumnLabwareInfo
              {...props}
              title={t('manually_fill_liquid_in_well', {
                well: failedLabwareUtils.relevantWellName,
              })}
              moveType="refill"
            />
          </Flex>
          <Flex marginTop="1.742rem">
            <RecoveryMap {...props} />
          </Flex>
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={proceedNextStep}
          secondaryBtnOnClick={goBackPrevStep}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

export function SkipToNextStep(
  props: RecoveryContentProps
): JSX.Element | null {
  const {
    routeUpdateActions,
    recoveryCommands,
    currentRecoveryOptionUtils,
  } = props
  const {
    setRobotInMotion,
    goBackPrevStep,
    proceedToRouteAndStep,
  } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { skipFailedCommand, resumeRun } = recoveryCommands
  const { ROBOT_SKIPPING_STEP, IGNORE_AND_SKIP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  // TODO(jh, 06-18-24): EXEC-569
  const secondaryBtnOnClick = (): void => {
    if (selectedRecoveryOption === IGNORE_AND_SKIP.ROUTE) {
      void proceedToRouteAndStep(IGNORE_AND_SKIP.ROUTE)
    } else {
      void goBackPrevStep()
    }
  }

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_SKIPPING_STEP.ROUTE)
      .then(() => skipFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="robot_will_not_check_for_liquid"
        components={{
          block: <LegacyStyledText as="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('skip_to_next_step')}
      leftColBodyText={buildBodyText()}
      primaryBtnCopy={t('continue_run_now')}
      primaryBtnOnClick={primaryBtnOnClick}
      secondaryBtnOnClickOverride={secondaryBtnOnClick}
    />
  )
}
