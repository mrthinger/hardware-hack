import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../App/portal'
import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface TakeoverModalProps {
  showConfirmTerminateModal: boolean
  setShowConfirmTerminateModal: React.Dispatch<React.SetStateAction<boolean>>
  confirmTerminate: () => void
  terminateInProgress: boolean
}

export function TakeoverModal(props: TakeoverModalProps): JSX.Element {
  const {
    showConfirmTerminateModal,
    setShowConfirmTerminateModal,
    confirmTerminate,
    terminateInProgress,
  } = props
  const { i18n, t } = useTranslation(['shared', 'branded'])

  const terminateHeader: ModalHeaderBaseProps = {
    title: t('terminate') + '?',
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  return createPortal(
    showConfirmTerminateModal ? (
      //    confirm terminate modal
      <Modal header={terminateHeader}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText as="p" marginBottom={SPACING.spacing32}>
            {t('branded:confirm_terminate')}
          </LegacyStyledText>
          <Flex flex="1" gridGap={SPACING.spacing8}>
            <SmallButton
              onClick={() => {
                setShowConfirmTerminateModal(false)
              }}
              buttonText={t('continue_activity')}
              width="50%"
            />
            <SmallButton
              iconName={terminateInProgress ? 'ot-spinner' : undefined}
              iconPlacement="startIcon"
              buttonType="alert"
              onClick={confirmTerminate}
              buttonText={t('terminate_activity')}
              width="50%"
              disabled={terminateInProgress}
            />
          </Flex>
        </Flex>
      </Modal>
    ) : (
      <Modal>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
          alignItems={ALIGN_CENTER}
          justifyContent={ALIGN_CENTER}
        >
          <Flex
            height="12.5rem"
            backgroundColor={COLORS.grey35}
            borderRadius={BORDERS.borderRadius12}
            flexDirection={DIRECTION_COLUMN}
            color={COLORS.grey60}
            padding={SPACING.spacing24}
            alignItems={ALIGN_CENTER}
          >
            <Icon
              name="ot-alert"
              size="2.5rem"
              marginBottom={SPACING.spacing16}
            />
            <LegacyStyledText
              as="h4"
              marginBottom={SPACING.spacing4}
              fontWeight={TYPOGRAPHY.fontWeightBold}
            >
              {i18n.format(t('robot_is_busy'), 'capitalize')}
            </LegacyStyledText>
            <LegacyStyledText as="p" textAlign={TYPOGRAPHY.textAlignCenter}>
              {t('branded:computer_in_app_is_controlling_robot')}
            </LegacyStyledText>
          </Flex>
          <LegacyStyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            onClick={() => {
              setShowConfirmTerminateModal(true)
            }}
          >
            {t('terminate')}
          </LegacyStyledText>
        </Flex>
      </Modal>
    ),
    getTopPortalEl()
  )
}
