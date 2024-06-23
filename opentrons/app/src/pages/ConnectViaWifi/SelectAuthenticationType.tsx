import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN } from '@opentrons/components'

import { SelectAuthenticationType as SelectAuthenticationTypeComponent } from '../../organisms/NetworkSettings'
import { RobotSetupHeader } from '../../organisms/RobotSetupHeader'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { WifiScreenOption } from '../../pages/ConnectViaWifi'

interface SelectAuthenticationTypeProps {
  handleWifiConnect: () => void
  selectedAuthType: WifiSecurityType
  setCurrentOption: (option: WifiScreenOption) => void
  setSelectedAuthType: (authType: WifiSecurityType) => void
}

export function SelectAuthenticationType({
  handleWifiConnect,
  selectedAuthType,
  setCurrentOption,
  setSelectedAuthType,
}: SelectAuthenticationTypeProps): JSX.Element {
  const { i18n, t } = useTranslation('device_settings')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotSetupHeader
        buttonText={i18n.format(t('continue'), 'capitalize')}
        header={t('select_a_security_type')}
        onClickBack={() => {
          setCurrentOption('WifiList')
        }}
        onClickButton={() => {
          selectedAuthType !== 'none'
            ? setCurrentOption('SetWifiCred')
            : handleWifiConnect()
        }}
      />
      <SelectAuthenticationTypeComponent
        selectedAuthType={selectedAuthType}
        setSelectedAuthType={setSelectedAuthType}
      />
    </Flex>
  )
}
