import * as React from 'react'
import { when } from 'vitest-when'
import { it, describe, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useToaster } from '../../ToasterOven'
import { mockRunTimeParameterData } from '../../../pages/ProtocolDetails/fixtures'
import { ViewOnlyParameters } from '../ViewOnlyParameters'

vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../ToasterOven')
const RUN_ID = 'mockId'
const render = (props: React.ComponentProps<typeof ViewOnlyParameters>) => {
  return renderWithProviders(<ViewOnlyParameters {...props} />, {
    i18nInstance: i18n,
  })
}
const mockMakeSnackBar = vi.fn()
describe('ViewOnlyParameters', () => {
  let props: React.ComponentProps<typeof ViewOnlyParameters>

  beforeEach(() => {
    props = {
      runId: 'mockId',
      setSetupScreen: vi.fn(),
    }
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({
        runTimeParameters: mockRunTimeParameterData,
      } as any)
    when(useToaster)
      .calledWith()
      .thenReturn(({
        makeSnackbar: mockMakeSnackBar,
      } as unknown) as any)
  })
  it('renders the parameters labels and mock data', () => {
    render(props)
    screen.getByText('Parameters')
    screen.getByText('Values are view-only')
    screen.getByText('Name')
    screen.getByText('Value')
    screen.getByText('Dry Run')
    screen.getByText('6.5')
    screen.getByText('Use Gripper')
    screen.getByText('Default Module Offsets')
    screen.getByText('Columns of Samples')
    screen.getByText('4 mL')
  })
  it('renders the snackbar from clicking on an item', () => {
    render(props)
    fireEvent.click(screen.getByText('4 mL'))
    expect(mockMakeSnackBar).toBeCalledWith('Restart setup to edit')
  })
  it('renders the back icon and calls the prop', () => {
    render(props)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(props.setSetupScreen).toHaveBeenCalled()
  })
  it('renders chip for updated values', () => {
    render(props)
    screen.getByTestId('Chip_USE_GRIPPER')
  })
})
