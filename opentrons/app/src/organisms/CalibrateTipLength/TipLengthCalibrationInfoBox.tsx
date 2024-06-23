import * as React from 'react'
import {
  Box,
  Text,
  BORDER_SOLID_LIGHT,
  FONT_WEIGHT_SEMIBOLD,
  SPACING,
} from '@opentrons/components'

export interface TipLengthCalibrationInfoBoxProps {
  title: string
  children: React.ReactNode
}

export function TipLengthCalibrationInfoBox(
  props: TipLengthCalibrationInfoBoxProps
): JSX.Element {
  const { title, children } = props

  return (
    <Box
      border={BORDER_SOLID_LIGHT}
      margin={SPACING.spacing16}
      paddingY={SPACING.spacing16}
    >
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        paddingLeft={SPACING.spacing16}
        paddingBottom={SPACING.spacing8}
      >
        {title}
      </Text>
      {children}
    </Box>
  )
}
