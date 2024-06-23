import * as React from 'react'

import { StackedLabeledControl } from './StackedLabeledControl'
import { RadioGroup } from '../forms'

import type { RadioGroupProps } from '../forms'

export interface LabeledRadioGroupProps extends RadioGroupProps {
  label: string
  children: React.ReactNode
  'data-test'?: string
}

export function LabeledRadioGroup(props: LabeledRadioGroupProps): JSX.Element {
  const { label, value, options, onChange } = props

  return (
    <StackedLabeledControl
      label={label}
      control={
        <RadioGroup value={value} options={options} onChange={onChange} />
      }
    >
      {props.children}
    </StackedLabeledControl>
  )
}
