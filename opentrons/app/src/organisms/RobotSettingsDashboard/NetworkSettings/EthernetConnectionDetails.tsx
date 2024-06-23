import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ChildNavigation } from '../../../organisms/ChildNavigation'
import { getNetworkInterfaces } from '../../../redux/networking'
import { getLocalRobot } from '../../../redux/discovery'

import type { State } from '../../../redux/types'

const STRETCH_LIST_STYLE = css`
  width: 100%;
  padding: ${SPACING.spacing16};
  background-color: ${COLORS.grey35};
  border-radius: ${BORDERS.borderRadius8};
`

interface EthernetConnectionDetailsProps {
  handleGoBack: () => void
}

export function EthernetConnectionDetails(
  props: EthernetConnectionDetailsProps
): JSX.Element {
  const { handleGoBack } = props
  const { t, i18n } = useTranslation(['device_settings', 'shared'])
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation header={t('ethernet')} onClickBack={handleGoBack} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
        marginTop="7.75rem"
      >
        {/* IP Address */}
        <EthernetDetailsRow
          title={t('ip_address')}
          detail={
            ethernet?.ipAddress != null
              ? ethernet.ipAddress
              : i18n.format(t('shared:no_data'), 'capitalize')
          }
        />
        {/* Subnet Mask */}
        <EthernetDetailsRow
          title={t('subnet_mask')}
          detail={
            ethernet?.subnetMask != null
              ? ethernet.subnetMask
              : i18n.format(t('shared:no_data'), 'capitalize')
          }
        />
        {/* MAC Address */}
        <EthernetDetailsRow
          title={t('mac_address')}
          detail={
            ethernet?.macAddress != null
              ? ethernet.macAddress
              : i18n.format(t('shared:no_data'), 'capitalize')
          }
        />
        {ethernet?.ipAddress === null || ethernet?.macAddress === null ? (
          <Flex marginTop="9rem">
            <LegacyStyledText
              color={COLORS.grey60}
              fontSize={TYPOGRAPHY.fontSize28}
              lineHeight={TYPOGRAPHY.lineHeight36}
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              textAlign={TYPOGRAPHY.textAlignCenter}
            >
              {t('ethernet_connection_description')}
            </LegacyStyledText>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

interface EthernetDetailsRowProps {
  title: string
  detail: string
}

const EthernetDetailsRow = ({
  title,
  detail,
}: EthernetDetailsRowProps): JSX.Element => {
  return (
    <Flex
      css={STRETCH_LIST_STYLE}
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSize22}
        lineHeight={TYPOGRAPHY.lineHeight28}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {title}
      </LegacyStyledText>
      <LegacyStyledText
        color={COLORS.grey60}
        fontSize={TYPOGRAPHY.fontSize22}
        lineHeight={TYPOGRAPHY.lineHeight28}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
      >
        {detail}
      </LegacyStyledText>
    </Flex>
  )
}
