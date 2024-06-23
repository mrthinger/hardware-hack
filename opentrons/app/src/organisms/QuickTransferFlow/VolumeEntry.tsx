import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'

import { ChildNavigation } from '../ChildNavigation'
import { InputField } from '../../atoms/InputField'
import { NumericalKeyboard } from '../../atoms/SoftwareKeyboard'
import { getVolumeRange } from './utils'
import { CONSOLIDATE, DISTRIBUTE } from './constants'

import type { SmallButton } from '../../atoms/buttons'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
} from './types'

interface VolumeEntryProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function VolumeEntry(props: VolumeEntryProps): JSX.Element {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const keyboardRef = React.useRef(null)

  const [volume, setVolume] = React.useState<string>(
    state.volume ? state.volume.toString() : ''
  )
  const volumeRange = getVolumeRange(state)
  let headerCopy = t('set_transfer_volume')
  let textEntryCopy = t('volume_per_well_µL')
  if (state.transferType === CONSOLIDATE) {
    headerCopy = t('set_aspirate_volume')
    textEntryCopy = t('aspirate_volume_µL')
  } else if (state.transferType === DISTRIBUTE) {
    headerCopy = t('set_dispense_volume')
    textEntryCopy = t('dispense_volume_µL')
  }

  const volumeAsNumber = Number(volume)

  const handleClickNext = (): void => {
    // the button will be disabled if this values is null
    if (volumeAsNumber != null) {
      dispatch({
        type: 'SET_VOLUME',
        volume: volumeAsNumber,
      })
      onNext()
    }
  }

  const error =
    volume !== '' &&
    (volumeAsNumber < volumeRange.min || volumeAsNumber > volumeRange.max)
      ? t(`value_out_of_range`, {
          min: volumeRange.min,
          max: volumeRange.max,
        })
      : null

  return (
    <Flex>
      <ChildNavigation
        header={headerCopy}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={error != null || volume === ''}
      />
      <Flex
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing48}
        paddingX={SPACING.spacing40}
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
        marginTop="7.75rem" // using margin rather than justify due to content moving with error message
        alignItems={ALIGN_CENTER}
        height="22rem"
      >
        <Flex
          width="30.5rem"
          height="100%"
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing68}
        >
          <InputField
            type="text"
            value={volume}
            title={textEntryCopy}
            error={error}
            readOnly
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
          borderRadius="0"
        >
          <NumericalKeyboard
            keyboardRef={keyboardRef}
            onChange={e => {
              setVolume(e)
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
