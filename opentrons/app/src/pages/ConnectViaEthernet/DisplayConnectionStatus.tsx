import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MediumButton } from '../../atoms/buttons'

interface DisplayConnectionStatusProps {
  isConnected: boolean
  setShowNetworkDetailsModal: (showNetworkDetailsModal: boolean) => void
}

export function DisplayConnectionStatus({
  isConnected,
  setShowNetworkDetailsModal,
}: DisplayConnectionStatusProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={isConnected ? COLORS.green35 : COLORS.grey35}
        borderRadius={BORDERS.borderRadius12}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        justifyContent={JUSTIFY_CENTER}
        padding={
          isConnected
            ? '4.4375rem 3.75rem'
            : `${SPACING.spacing40} ${SPACING.spacing80}`
        }
      >
        <Icon
          name={isConnected ? 'ot-check' : 'ot-alert'}
          size="3rem"
          color={isConnected ? COLORS.green50 : COLORS.grey60}
          data-testid={
            isConnected
              ? 'Ethernet_connected_icon'
              : 'Ethernet_not_connected_icon'
          }
        />
        <Flex
          flexDirection={isConnected ? undefined : DIRECTION_COLUMN}
          gridGap={isConnected ? '0' : SPACING.spacing4}
          alignItems={ALIGN_CENTER}
        >
          <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {isConnected ? t('successfully_connected') : t('no_network_found')}
          </LegacyStyledText>
          {isConnected ? null : (
            <LegacyStyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              textAlign={TYPOGRAPHY.textAlignCenter}
              color={COLORS.grey60}
              margin="0 2rem"
            >
              {t('ethernet_connection_description')}
            </LegacyStyledText>
          )}
        </Flex>
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={isConnected ? SPACING.spacing8 : '0'}
      >
        <MediumButton
          flex="1"
          buttonType={isConnected ? 'secondary' : 'primary'}
          buttonText={t('view_network_details')}
          onClick={() => {
            setShowNetworkDetailsModal(true)
          }}
        />
        {isConnected ? (
          <MediumButton
            flex="1"
            buttonText={i18n.format(t('shared:continue'), 'capitalize')}
            onClick={() => {
              history.push('/robot-settings/update-robot-during-onboarding')
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
