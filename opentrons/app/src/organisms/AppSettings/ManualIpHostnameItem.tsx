import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Divider } from '../../atoms/structure'

const IpItem = styled.div`
  flex: 1 1 auto;
  border: 0;
  border-radius: 0;
  outline: 0;
  line-height: 2rem;
`

const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: ${COLORS.grey30};
  }
  &:active {
    background: ${COLORS.grey35};
  }
`
interface IpHostnameItemProps {
  candidate: string
  discovered: boolean
  removeIp: (ip: string) => unknown
  isLast: boolean
  mostRecentAddition: string | null
  setMostRecentAddition: (ip: string | null) => void
  setMostRecentDiscovered: (discovered: boolean) => void
}

export function ManualIpHostnameItem({
  candidate,
  discovered,
  removeIp,
  isLast,
  mostRecentAddition,
  setMostRecentAddition,
  setMostRecentDiscovered,
}: IpHostnameItemProps): JSX.Element {
  const remove = (): void => {
    removeIp(candidate)
  }
  const { t } = useTranslation('app_settings')
  const justAdded = candidate === mostRecentAddition
  const getDiscoveryText = (): string | null => {
    if (discovered) {
      return t('ip_available')
    } else if (justAdded) {
      return null
    } else {
      return t('not_found')
    }
  }

  React.useEffect(() => {
    if (justAdded) {
      setMostRecentDiscovered(discovered)
      // Note this is to avoid the case that not found but not display the message
      setMostRecentAddition('searching')
    }
  }, [justAdded, discovered, setMostRecentDiscovered, setMostRecentAddition])

  return (
    <>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={JUSTIFY_CENTER}>
        <IpItem>
          <LegacyStyledText
            as="p"
            data-testid="ip-hostname"
            color={discovered ? COLORS.black90 : COLORS.grey40}
          >
            {candidate}
          </LegacyStyledText>
        </IpItem>
        <LegacyStyledText
          as="label"
          color={COLORS.grey50}
          css={{
            'white-space': 'nowrap',
          }}
        >
          {getDiscoveryText()}
        </LegacyStyledText>
        <Btn
          size={TYPOGRAPHY.lineHeight20}
          color={COLORS.black90}
          onClick={remove}
          marginLeft={SPACING.spacing16}
          data-testid="close-button"
        >
          <Icon name="close" css={CLOSE_ICON_STYLE} />
        </Btn>
      </Flex>
      {!isLast && <Divider width="100%" />}
    </>
  )
}
