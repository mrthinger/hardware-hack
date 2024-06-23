import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Link,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import { UploadInput } from '../../molecules/UploadInput'
import { addProtocol } from '../../redux/protocol-storage'
import {
  useTrackEvent,
  ANALYTICS_IMPORT_PROTOCOL_TO_APP,
} from '../../redux/analytics'
import { useLogger } from '../../logger'

import type { Dispatch } from '../../redux/types'

export interface UploadInputProps {
  onUpload?: () => void
}

export function ProtocolUploadInput(
  props: UploadInputProps
): JSX.Element | null {
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const logger = useLogger(new URL('', import.meta.url).pathname)
  const trackEvent = useTrackEvent()

  const handleUpload = (file: File): void => {
    if (file.path === null) {
      logger.warn('Failed to upload file, path not found')
    }
    dispatch(addProtocol(file.path))
    trackEvent({
      name: ANALYTICS_IMPORT_PROTOCOL_TO_APP,
      properties: { protocolFileName: file.name },
    })
    props.onUpload?.()
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      marginY={SPACING.spacing20}
    >
      <UploadInput
        onUpload={(file: File) => {
          handleUpload(file)
        }}
        uploadText={t('valid_file_types')}
        dragAndDropText={
          <LegacyStyledText as="p">
            <Trans
              t={t}
              i18nKey="shared:drag_and_drop"
              components={{
                a: <Link color={COLORS.blue55} role="button" />,
              }}
            />
          </LegacyStyledText>
        }
      />
    </Flex>
  )
}
