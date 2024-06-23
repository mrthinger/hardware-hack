import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import clamp from 'lodash/clamp'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'

import { ChildNavigation } from '../../organisms/ChildNavigation'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../redux/config'

import type { Dispatch } from '../../redux/types'
import type { SetSettingOption } from '../../pages/RobotSettingsDashboard'
import { IconButton } from '../../atoms/buttons/IconButton'

interface BrightnessTileProps {
  isActive: boolean
}

const BrightnessTile = styled(Box)`
  width: 100%;
  height: 8.75rem;
  border-radius: ${BORDERS.borderRadius8};
  background: ${(props: BrightnessTileProps) =>
    props.isActive ? COLORS.blue50 : COLORS.blue35};
`

// Note The actual brightness is Bright 1 <---> 6 Dark which is opposite to the UI
// For UI Bright 6 <--> 1 Dark
// If the brightness 7 or more | 0, the display will be blackout
const LOWEST_BRIGHTNESS = 6
const HIGHEST_BRIGHTNESS = 1

interface TouchscreenBrightnessProps {
  setCurrentOption: SetSettingOption
}

export function TouchscreenBrightness({
  setCurrentOption,
}: TouchscreenBrightnessProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  const dispatch = useDispatch<Dispatch>()
  const initialBrightness = useSelector(getOnDeviceDisplaySettings).brightness
  const [brightness, setBrightness] = React.useState<number>(initialBrightness)
  const brightnessLevel = [6, 5, 4, 3, 2, 1]

  const handleClick = (changeType: 'up' | 'down'): void => {
    const step = changeType === 'up' ? -1 : 1
    const nextBrightness = clamp(
      brightness + step,
      HIGHEST_BRIGHTNESS,
      LOWEST_BRIGHTNESS
    )
    dispatch(
      updateConfigValue('onDeviceDisplaySettings.brightness', nextBrightness)
    )
    setBrightness(nextBrightness)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('touchscreen_brightness')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing24}
        paddingX={SPACING.spacing60}
        paddingY={SPACING.spacing120}
        marginTop="7.75rem"
      >
        <IconButton
          disabled={brightness === LOWEST_BRIGHTNESS}
          onClick={() => {
            handleClick('down')
          }}
          data-testid="TouchscreenBrightness_decrease"
          iconName="minus"
        />
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          width="43.5rem"
        >
          {brightnessLevel.map(level => (
            <BrightnessTile
              key={`brightness_level_${level}`}
              isActive={brightness <= level}
            />
          ))}
        </Flex>

        <IconButton
          disabled={brightness === HIGHEST_BRIGHTNESS}
          onClick={() => {
            handleClick('up')
          }}
          data-testid="TouchscreenBrightness_increase"
          iconName="plus"
        />
      </Flex>
    </Flex>
  )
}
