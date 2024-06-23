import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export interface ClearDeckModalProps {
  onContinueClick: () => void
}

export function ClearDeckModal(props: ClearDeckModalProps): JSX.Element {
  const { onContinueClick } = props
  const { t } = useTranslation('change_pipette')

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing32}
        paddingTop={SPACING.spacing32}
        marginBottom="13.375rem"
      >
        <Trans
          t={t}
          i18nKey="remove_labware_before_start"
          components={{
            h1: (
              <LegacyStyledText
                css={TYPOGRAPHY.h1Default}
                marginBottom={SPACING.spacing16}
              />
            ),
            block: <LegacyStyledText as="p" />,
          }}
        />
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END} marginBottom={SPACING.spacing32}>
        <PrimaryButton marginX={SPACING.spacing32} onClick={onContinueClick}>
          {t('get_started')}
        </PrimaryButton>
      </Flex>
    </>
  )
}
