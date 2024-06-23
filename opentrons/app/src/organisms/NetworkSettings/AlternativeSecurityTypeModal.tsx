import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface AlternativeSecurityTypeModalProps {
  setShowAlternativeSecurityTypeModal: (
    showAlternativeSecurityTypeModal: boolean
  ) => void
}

export function AlternativeSecurityTypeModal({
  setShowAlternativeSecurityTypeModal,
}: AlternativeSecurityTypeModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'branded'])
  const history = useHistory()
  const modalHeader: ModalHeaderBaseProps = {
    title: t('alternative_security_types'),
    hasExitIcon: true,
  }
  const handleCloseModal = (): void => {
    setShowAlternativeSecurityTypeModal(false)
  }
  const handleClick = (): void => {
    setShowAlternativeSecurityTypeModal(false)
    history.push('/network-setup/usb')
  }

  return (
    <Modal
      modalSize="small"
      header={modalHeader}
      onOutsideClick={handleCloseModal}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <LegacyStyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.grey60}
          >
            {t('branded:alternative_security_types_description')}
          </LegacyStyledText>
        </Flex>
        <SmallButton
          buttonText={t('connect_via', { type: t('usb') })}
          onClick={handleClick}
        />
      </Flex>
    </Modal>
  )
}
