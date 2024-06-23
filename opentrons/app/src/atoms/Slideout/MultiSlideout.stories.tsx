import * as React from 'react'
import {
  COLORS,
  PrimaryBtn,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { MultiSlideout } from './MultiSlideout'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/MultiSlideout',
  component: MultiSlideout,
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const Template: Story<React.ComponentProps<typeof MultiSlideout>> = args => {
  const [firstPage, setFirstPage] = React.useState<boolean>(false)

  const togglePage = (): void => {
    setFirstPage(prevState => !prevState)
  }

  const children = (
    <>
      <LegacyStyledText as="p">
        {firstPage ? 'first page body' : 'second page body'}
      </LegacyStyledText>

      <PrimaryBtn
        marginTop="28rem"
        onClick={togglePage}
        backgroundColor={COLORS.blue50}
        textTransform={TYPOGRAPHY.textTransformNone}
      >
        <LegacyStyledText as="p">
          {firstPage ? 'Go to Second Page' : 'Go to First Page'}
        </LegacyStyledText>
      </PrimaryBtn>
    </>
  )

  return (
    <MultiSlideout {...args} currentStep={firstPage ? 1 : 2}>
      {children}
    </MultiSlideout>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  title: 'This is the slideout title with the max width',
  isExpanded: 'true',
  maxSteps: 2,
}
