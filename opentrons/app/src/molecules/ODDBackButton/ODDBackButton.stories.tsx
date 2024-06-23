import * as React from 'react'
import { VIEWPORT } from '@opentrons/components'
import { ODDBackButton } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/ODDBackButton',
  argTypes: {
    onClick: { action: 'clicked' },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const ODDBackButtonTemplate: Story<
  React.ComponentProps<typeof ODDBackButton>
> = args => <ODDBackButton {...args} />
export const ODDBackButtonComponent = ODDBackButtonTemplate.bind({})
ODDBackButtonComponent.args = {
  label: 'Previous location',
}
