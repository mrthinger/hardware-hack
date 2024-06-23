import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { OT3_PIPETTES } from '@opentrons/shared-data'
import { PipetteSelect } from '../../molecules/PipetteSelect'

export type PipetteSelectionProps = React.ComponentProps<typeof PipetteSelect>

export function PipetteSelection(props: PipetteSelectionProps): JSX.Element {
  const { t } = useTranslation('change_pipette')
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <LegacyStyledText
        css={TYPOGRAPHY.h1Default}
        marginBottom={SPACING.spacing24}
      >
        {t('choose_pipette')}
      </LegacyStyledText>
      <Flex marginBottom="1.2rem">
        <PipetteSelect
          pipetteName={props.pipetteName}
          onPipetteChange={props.onPipetteChange}
          nameBlocklist={OT3_PIPETTES}
        />
      </Flex>
    </Flex>
  )
}
