import * as React from 'react'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '../../../atoms/buttons'
import { updateSetting } from '../../../redux/robot-settings'
import type { Dispatch } from '../../../redux/types'
import type { RobotSettingsField } from '../../../redux/robot-settings/types'

interface SettingToggleProps extends RobotSettingsField {
  robotName: string
  /**
   * invert the meaning of the setting sent over from the robot
   * this is helpful when a value the robot exposes "disables" something
   * and the user experience of the app prefers "enabling"
   */
  invert?: boolean
}

export function SettingToggle({
  value,
  id,
  title,
  description,
  robotName,
  invert = false,
}: SettingToggleProps): JSX.Element | null {
  const dispatch = useDispatch<Dispatch>()

  if (id == null) return null

  const handleClick: React.MouseEventHandler<Element> = () => {
    dispatch(updateSetting(robotName, id, !value))
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing16}
    >
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
        >
          {title}
        </LegacyStyledText>
        <LegacyStyledText as="p">{description}</LegacyStyledText>
      </Box>
      <ToggleButton
        label={title}
        toggledOn={invert ? value === false : value === true}
        onClick={handleClick}
      />
    </Flex>
  )
}
