import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DeprecatedPrimaryButton,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { getSelectedTerminalItemId } from '../ui/steps'
import { OffDeckLabwareSlideout } from './OffDeckLabwareSlideout'

export const OffDeckLabwareButton = (): JSX.Element => {
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const { t } = useTranslation('button')
  const [showSlideout, setShowSlideout] = React.useState<boolean>(false)

  return (
    <Flex position={POSITION_ABSOLUTE} right={SPACING.spacing16} zIndex={2}>
      <Flex position={POSITION_RELATIVE} padding={SPACING.spacing16}>
        <DeprecatedPrimaryButton
          onClick={() => {
            setShowSlideout(true)
          }}
        >
          {t('edit_off_deck')}
        </DeprecatedPrimaryButton>
      </Flex>
      {showSlideout ? (
        <OffDeckLabwareSlideout
          isExpanded={showSlideout}
          onCloseClick={() => {
            setShowSlideout(false)
          }}
          initialSetupTerminalItemId={
            selectedTerminalItemId === '__initial_setup__'
          }
        />
      ) : null}
    </Flex>
  )
}
