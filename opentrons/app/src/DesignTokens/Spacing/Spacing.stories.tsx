import * as React from 'react'
import {
  ALIGN_FLEX_START,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Design Tokens/Spacing',
} as Meta

interface SpacingsStorybookProps {
  spacings: string[]
}

const Template: Story<SpacingsStorybookProps> = args => {
  const targetSpacings = args.spacings.filter(s => !s[1].includes('auto'))

  const convertToPx = (remFormat: string): string => {
    const pxVal = Number(remFormat.replace('rem', '')) * 16
    return `${pxVal}px`
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing24}
    >
      {targetSpacings.map((spacing, index) => (
        <Flex
          key={`spacing_${index}`}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_FLEX_START}
          padding={SPACING.spacing16}
          gridGap={SPACING.spacing8}
          width="100%"
          height="6rem"
        >
          <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {`${spacing[0]} - ${spacing[1]}: ${convertToPx(spacing[1])}`}
          </LegacyStyledText>
          <Box
            width={spacing[1]}
            height="2rem"
            backgroundColor={COLORS.blue50}
          />
        </Flex>
      ))}
    </Flex>
  )
}

export const AllSpacing = Template.bind({})
const allSpacings = Object.entries(SPACING)
AllSpacing.args = {
  spacings: allSpacings,
}
