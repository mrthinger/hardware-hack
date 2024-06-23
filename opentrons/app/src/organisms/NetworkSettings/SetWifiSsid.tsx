import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  SPACING,
  TYPOGRAPHY,
  LegacyStyledText,
} from '@opentrons/components'

import { InputField } from '../../atoms/InputField'
import { FullKeyboard } from '../../atoms/SoftwareKeyboard'
import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'

interface SetWifiSsidProps {
  errorMessage?: string | null
  inputSsid: string
  setInputSsid: React.Dispatch<React.SetStateAction<string>>
}

export function SetWifiSsid({
  errorMessage,
  inputSsid,
  setInputSsid,
}: SetWifiSsidProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const keyboardRef = React.useRef(null)
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX="6.34375rem"
        gridGap={SPACING.spacing8}
        marginTop={isUnboxingFlowOngoing ? undefined : '7.75rem'}
      >
        <LegacyStyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={errorMessage != null ? COLORS.red50 : COLORS.black90}
        >
          {t('enter_network_name')}
        </LegacyStyledText>
        <InputField
          aria-label="wifi_ssid"
          value={inputSsid}
          id="wifiSsid"
          onChange={e => {
            setInputSsid(e.target.value)
          }}
          type="text"
          error={errorMessage}
          onBlur={e => {
            e.target.focus()
          }}
          autoFocus
        />
      </Flex>
      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <FullKeyboard
          onChange={e => {
            e != null && setInputSsid(e)
          }}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </>
  )
}
