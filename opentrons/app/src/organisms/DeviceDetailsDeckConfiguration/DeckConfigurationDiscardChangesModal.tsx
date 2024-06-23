import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface DeckConfigurationDiscardChangesModalProps {
  setShowConfirmationModal: (showConfirmationModal: boolean) => void
}

export function DeckConfigurationDiscardChangesModal({
  setShowConfirmationModal,
}: DeckConfigurationDiscardChangesModalProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const history = useHistory()
  const modalHeader: ModalHeaderBaseProps = {
    title: t('changes_will_be_lost'),
  }

  const handleDiscard = (): void => {
    setShowConfirmationModal(false)
    history.goBack()
  }

  return (
    <Modal header={modalHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <LegacyStyledText as="p">
          {t('changes_will_be_lost_description')}
        </LegacyStyledText>
        <Flex
          width="100%"
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            width="100%"
            buttonType="alert"
            buttonText={t('discard_changes')}
            onClick={handleDiscard}
          />
          <SmallButton
            width="100%"
            buttonText={t('continue_editing')}
            onClick={() => {
              setShowConfirmationModal(false)
            }}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
