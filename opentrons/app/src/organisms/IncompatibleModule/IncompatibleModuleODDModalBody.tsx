import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  OVERFLOW_SCROLL,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import type { AttachedModule } from '@opentrons/api-client'
import { Modal } from '../../molecules/Modal'
import { ListItem } from '../../atoms/ListItem'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
export interface IncompatibleModuleODDModalBodyProps {
  modules: AttachedModule[]
}

export function IncompatibleModuleODDModalBody({
  modules,
}: IncompatibleModuleODDModalBodyProps): JSX.Element {
  const { t } = useTranslation('incompatible_modules')
  const incompatibleModuleHeader: ModalHeaderBaseProps = {
    title: capitalize(t('incompatible_modules_attached') as string),
  }
  return (
    <Modal header={incompatibleModuleHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} width="100%">
        <LegacyStyledText as="p" marginBottom={SPACING.spacing32}>
          <Trans t={t} i18nKey="remove_before_running_protocol" />
        </LegacyStyledText>
        <Flex
          overflowY={OVERFLOW_SCROLL}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          maxHeight="196px"
        >
          {modules.map(module => (
            <ListItem key={module.id} type="noActive">
              <LegacyStyledText
                as="p"
                key={module.id}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {getModuleDisplayName(module.moduleModel)}
              </LegacyStyledText>
            </ListItem>
          ))}
        </Flex>
      </Flex>
    </Modal>
  )
}
