import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { FillWellAndSkip, FillWell, SkipToNextStep } from '../FillWellAndSkip'
import { RECOVERY_MAP } from '../../constants'
import { CancelRun } from '../CancelRun'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { Mock } from 'vitest'

vi.mock('../../shared', async () => {
  const actual = await vi.importActual('../../shared')
  return {
    ...actual,
    LeftColumnLabwareInfo: vi.fn(props => (
      <div>
        MOCK_LEFT_COLUMN_LABWARE_INFO
        <span data-testid="labware-info-title">{props.title}</span>
      </div>
    )),
    RecoveryMap: vi.fn(() => <div>MOCK_RECOVERY_MAP</div>),
  }
})
vi.mock('../CancelRun')
vi.mock('../SelectRecoveryOption')
vi.mock('../../../../molecules/Command')

const render = (props: React.ComponentProps<typeof FillWellAndSkip>) => {
  return renderWithProviders(<FillWellAndSkip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderFillWell = (props: React.ComponentProps<typeof FillWell>) => {
  return renderWithProviders(<FillWell {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderSkipToNextStep = (
  props: React.ComponentProps<typeof SkipToNextStep>
) => {
  return renderWithProviders(<SkipToNextStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FillWellAndSkip', () => {
  let props: React.ComponentProps<typeof FillWellAndSkip>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(CancelRun).mockReturnValue(<div>MOCK_CANCEL_RUN</div>)
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  it(`renders FillWell when step is ${RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL,
      },
    }
    render(props)
    expect(screen.getByTestId('labware-info-title').textContent).toContain(
      'Manually fill liquid in well'
    )
  })

  it(`renders SkipToNextStep when step is ${RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.SKIP}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.SKIP,
      },
    }
    render(props)
    screen.getByText('Skip to next step')
  })

  it(`renders CancelRun when step is ${RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL,
      },
    }
    render(props)
    screen.getByText('MOCK_CANCEL_RUN')
  })

  it('renders SelectRecoveryOption as a fallback', () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: 'UNKNOWN_STEP',
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})

describe('FillWell', () => {
  let props: React.ComponentProps<typeof FillWell>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }
  })

  it('renders expected components', () => {
    renderFillWell(props)
    expect(screen.getByTestId('labware-info-title').textContent).toContain(
      'Manually fill liquid in well'
    )
    screen.getByText('MOCK_RECOVERY_MAP')
  })
})

describe('SkipToNextStep', () => {
  let props: React.ComponentProps<typeof SkipToNextStep>
  let mockSetRobotInMotion: Mock
  let mockGoBackPrevStep: Mock
  let mockProceedToRouteAndStep: Mock
  let mockSkipFailedCommand: Mock
  let mockResumeRun: Mock

  beforeEach(() => {
    mockSetRobotInMotion = vi.fn(() => Promise.resolve())
    mockGoBackPrevStep = vi.fn()
    mockProceedToRouteAndStep = vi.fn()
    mockSkipFailedCommand = vi.fn(() => Promise.resolve())
    mockResumeRun = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        setRobotInMotion: mockSetRobotInMotion,
        goBackPrevStep: mockGoBackPrevStep,
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
      recoveryCommands: {
        skipFailedCommand: mockSkipFailedCommand,
        resumeRun: mockResumeRun,
      } as any,
    }
  })

  it(`calls proceedToRouteAndStep when selectedRecoveryOption is ${RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE} and secondary button is clicked`, () => {
    props = {
      ...props,
      currentRecoveryOptionUtils: {
        ...props.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
      },
    }
    renderSkipToNextStep(props)
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE
    )
  })

  it('calls goBackPrevStep when selectedRecoveryOption is not IGNORE_AND_SKIP and secondary button is clicked', () => {
    renderSkipToNextStep(props)
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(mockGoBackPrevStep).toHaveBeenCalled()
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    renderSkipToNextStep(props)
    fireEvent.click(screen.getByRole('button', { name: 'Continue run now' }))

    await waitFor(() => {
      expect(mockSetRobotInMotion).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE
      )
    })
    await waitFor(() => {
      expect(mockSkipFailedCommand).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockResumeRun).toHaveBeenCalled()
    })

    expect(mockSetRobotInMotion.mock.invocationCallOrder[0]).toBeLessThan(
      mockSkipFailedCommand.mock.invocationCallOrder[0]
    )
    expect(mockSkipFailedCommand.mock.invocationCallOrder[0]).toBeLessThan(
      mockResumeRun.mock.invocationCallOrder[0]
    )
  })
})
