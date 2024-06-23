import * as React from 'react'
import { Flex } from '../primitives'
import { SPACING } from '../ui-style-constants'
import { ICON_DATA_BY_NAME } from './icon-data'
import { Icon as IconComponent } from './Icon'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof IconComponent> = {
  title: 'Library/Atoms/Icon',
  component: IconComponent,
  argTypes: {
    name: {
      options: Object.keys(ICON_DATA_BY_NAME),
      control: {
        type: 'select',
      },
    },
  },
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof IconComponent>

export const Icon: Story = {
  args: {
    name: 'alert',
    spin: false,
    size: '4rem',
  },
}
