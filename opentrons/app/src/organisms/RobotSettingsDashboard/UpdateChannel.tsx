import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ChildNavigation } from '../../organisms/ChildNavigation'
import {
  getDevtoolsEnabled,
  getUpdateChannel,
  getUpdateChannelOptions,
  updateConfigValue,
} from '../../redux/config'

import type { Dispatch } from '../../redux/types'

interface LabelProps {
  isSelected?: boolean
}

const SettingButton = styled.input`
  display: none;
`

const SettingButtonLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadius16};
  cursor: pointer;
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blue50 : COLORS.blue35};
  color: ${({ isSelected }) => isSelected === true && COLORS.white};
`

interface UpdateChannelProps {
  handleBackPress: () => void
}

export function UpdateChannel({
  handleBackPress,
}: UpdateChannelProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'app_settings'])
  const dispatch = useDispatch<Dispatch>()

  const channel = useSelector(getUpdateChannel)
  const channelOptions = useSelector(getUpdateChannelOptions)
  const devToolsOn = useSelector(getDevtoolsEnabled)

  const modifiedChannelOptions = !Boolean(devToolsOn)
    ? channelOptions.filter(option => option.value !== 'alpha')
    : channelOptions

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(updateConfigValue('update.channel', event.target.value))
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('app_settings:update_channel')}
        onClickBack={handleBackPress}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing40}
        marginTop="7.75rem"
      >
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {t('update_channel_description')}
        </LegacyStyledText>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          marginTop={SPACING.spacing24}
        >
          {modifiedChannelOptions.map(radio => (
            <React.Fragment key={`channel_setting_${radio.label}`}>
              <SettingButton
                id={radio.label}
                type="radio"
                value={radio.value}
                checked={radio.value === channel}
                onChange={handleChange}
              />
              <SettingButtonLabel
                htmlFor={radio.label}
                isSelected={radio.value === channel}
              >
                <LegacyStyledText
                  fontSize={TYPOGRAPHY.fontSize28}
                  lineHeight="1.875rem"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {radio.label}
                </LegacyStyledText>
                {radio.label === 'Alpha' ? (
                  <LegacyStyledText
                    marginTop={SPACING.spacing4}
                    fontSize={TYPOGRAPHY.fontSize28}
                    lineHeight={TYPOGRAPHY.lineHeight36}
                    fontWeight={TYPOGRAPHY.fontWeightRegular}
                    color={
                      radio.value === channel ? COLORS.white : COLORS.grey60
                    }
                  >
                    {t('alpha_description')}
                  </LegacyStyledText>
                ) : null}
              </SettingButtonLabel>
            </React.Fragment>
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
