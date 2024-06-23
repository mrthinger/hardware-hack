import * as React from 'react'
import { when } from 'vitest-when'
import { it, describe, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { useToaster } from '../../../organisms/ToasterOven'
import { renderWithProviders } from '../../../__testing-utils__'
import { useRunTimeParameters } from '../../Protocols/hooks'
import { Parameters } from '../Parameters'
import { mockRunTimeParameterData } from '../fixtures'

vi.mock('../../../organisms/ToasterOven')
vi.mock('../../Protocols/hooks')

const render = (props: React.ComponentProps<typeof Parameters>) => {
  return renderWithProviders(<Parameters {...props} />, {
    i18nInstance: i18n,
  })
}
const MOCK_MAKE_SNACK_BAR = vi.fn()
describe('Parameters', () => {
  let props: React.ComponentProps<typeof Parameters>

  beforeEach(() => {
    props = {
      protocolId: 'mockId',
    }
    when(useToaster)
      .calledWith()
      .thenReturn({
        makeSnackBar: MOCK_MAKE_SNACK_BAR,
      } as any)
    vi.mocked(useRunTimeParameters).mockReturnValue(mockRunTimeParameterData)
  })
  it('renders the parameters labels and mock data', () => {
    render(props)
    screen.getByText('Name')
    screen.getByText('Default value')
    screen.getByText('Range')
    screen.getByText('Dry Run')
    screen.getByText('6.5')
    screen.getByText('Use Gripper')
    screen.getByText('Default Module Offsets')
    screen.getByText('3 choices')
    screen.getByText('EtoH Volume')
    screen.getByText('one choice, the second')
  })
})
