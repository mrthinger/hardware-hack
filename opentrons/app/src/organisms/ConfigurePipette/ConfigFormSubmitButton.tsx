import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  TEXT_TRANSFORM_UPPERCASE,
  PrimaryButton,
} from '@opentrons/components'
export interface ConfigFormSubmitButtonProps {
  disabled: boolean
  formId: string
}

export function ConfigFormSubmitButton(
  props: ConfigFormSubmitButtonProps
): JSX.Element {
  const { disabled, formId } = props
  const { t } = useTranslation('shared')

  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      boxShadow="0px -4px 12px rgba(0, 0, 0, 0.15)"
    >
      <PrimaryButton type="submit" form={formId} disabled={disabled}>
        {t('confirm')}
      </PrimaryButton>
    </Flex>
  )
}
