import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SecondaryButton,
  AlertPrimaryButton,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import type { PipetteWizardFlow } from './types'

interface ExitModalProps {
  isRobotMoving?: boolean
  proceed: () => void
  goBack: () => void
  flowType: PipetteWizardFlow
  isOnDevice: boolean
}

export function ExitModal(props: ExitModalProps): JSX.Element {
  const { goBack, proceed, flowType, isOnDevice, isRobotMoving } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  let flowTitle: string = t('pipette_calibration')
  switch (flowType) {
    case FLOWS.ATTACH: {
      flowTitle = t('attach')
      break
    }
    case FLOWS.DETACH: {
      flowTitle = t('detach')
      break
    }
  }
  if (Boolean(isRobotMoving))
    return <InProgressModal description={t('stand_back')} />

  return (
    <SimpleWizardBody
      iconColor={COLORS.yellow50}
      header={t('progress_will_be_lost', { flow: flowTitle })}
      subHeader={t('are_you_sure_exit', { flow: flowTitle })}
      isSuccess={false}
      justifyContentForOddButton={JUSTIFY_FLEX_END}
    >
      {isOnDevice ? (
        <>
          <SmallButton
            marginRight={SPACING.spacing8}
            onClick={proceed}
            buttonText={capitalize(t('shared:exit') as string)}
            buttonType="alert"
          />

          <SmallButton buttonText={t('shared:go_back')} onClick={goBack} />
        </>
      ) : (
        <>
          <SecondaryButton onClick={goBack} marginRight={SPACING.spacing4}>
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={proceed}
          >
            {t('shared:exit')}
          </AlertPrimaryButton>
        </>
      )}
    </SimpleWizardBody>
  )
}
