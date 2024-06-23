import { useSelector } from 'react-redux'
import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  PrimaryButton,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_FLEX_END,
  Flex,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SmallButton } from '../../atoms/buttons'
import {
  SUCCESSFULLY_ATTACHED,
  SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
  SUCCESSFULLY_CALIBRATED,
  SUCCESSFULLY_DETACHED,
} from './constants'
import type { GripperWizardStepProps, SuccessStep } from './types'

const HEADER_STYLE = css`
  p {
    text-transform: lowercase;
  }

  p::first-letter {
    text-transform: uppercase;
  }
`
export const Success = (
  props: Pick<GripperWizardStepProps, 'proceed'> &
    Pick<GripperWizardStepProps, 'isRobotMoving'> &
    SuccessStep
): JSX.Element => {
  const { proceed, successfulAction, isRobotMoving } = props
  const { t, i18n } = useTranslation([
    'gripper_wizard_flows',
    'shared',
    'branded',
  ])
  const isOnDevice = useSelector(getIsOnDevice)

  const infoByAction: {
    [action in SuccessStep['successfulAction']]: {
      header: string
      buttonText: string
    }
  } = {
    [SUCCESSFULLY_ATTACHED_AND_CALIBRATED]: {
      header: t('branded:gripper_successfully_attached_and_calibrated'),
      buttonText: i18n.format(t('shared:exit'), 'capitalize'),
    },
    [SUCCESSFULLY_CALIBRATED]: {
      header: t('branded:gripper_successfully_calibrated'),
      buttonText: i18n.format(t('shared:exit'), 'capitalize'),
    },
    [SUCCESSFULLY_ATTACHED]: {
      header: t('gripper_successfully_attached'),
      buttonText: t('calibrate_gripper'),
    },
    [SUCCESSFULLY_DETACHED]: {
      header: t('branded:gripper_successfully_detached'),
      buttonText: i18n.format(t('shared:exit'), 'capitalize'),
    },
  }
  const { header, buttonText } = infoByAction[successfulAction]

  if (isRobotMoving)
    return (
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )

  return (
    <SimpleWizardBody
      iconColor={COLORS.green50}
      header={header}
      isSuccess
      css={HEADER_STYLE}
    >
      {isOnDevice ? (
        <Flex justifyContent={JUSTIFY_FLEX_END} width="100%">
          <SmallButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            buttonText={buttonText}
            onClick={proceed}
          />
        </Flex>
      ) : (
        <PrimaryButton onClick={proceed}>{buttonText}</PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
