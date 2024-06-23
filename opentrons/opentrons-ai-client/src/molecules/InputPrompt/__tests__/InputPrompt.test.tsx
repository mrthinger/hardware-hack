import React from 'react'
import { describe, it, expect } from 'vitest'
import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { InputPrompt } from '../index'

const WrappingForm = (wrappedComponent: {
  children: React.ReactNode
}): JSX.Element => {
  const methods = useForm({
    defaultValues: {
      userPrompt: '',
    },
  })
  // eslint-disable-next-line testing-library/no-node-access
  return <FormProvider {...methods}>{wrappedComponent.children}</FormProvider>
}

const render = () => {
  return renderWithProviders(
    <WrappingForm>
      <InputPrompt />
    </WrappingForm>,
    { i18nInstance: i18n }
  )
}

describe('InputPrompt', () => {
  it('should render textarea and disabled button', () => {
    render()
    screen.getByRole('textbox')
    screen.queryByPlaceholderText('Type your prompt...')
    screen.getByRole('button')
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should make send button not disabled when a user inputs something in textarea', () => {
    render()
    const textbox = screen.getByRole('textbox')
    fireEvent.change(textbox, { target: { value: ['test'] } })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  // ToDo (kk:04/19/2024) add more test cases
})
