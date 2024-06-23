import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { MemoryRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { CalibrationStatusBanner } from '../CalibrationStatusBanner'
import { useCalibrationTaskList } from '../hooks'

vi.mock('../hooks')

const render = (
  props: React.ComponentProps<typeof CalibrationStatusBanner>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <CalibrationStatusBanner {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('CalibrationStatusBanner', () => {
  let props: React.ComponentProps<typeof CalibrationStatusBanner>
  beforeEach(() => {
    props = { robotName: 'otie' }
  })

  it('should render null if status is complete', () => {
    vi.mocked(useCalibrationTaskList).mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'complete',
      isLoading: false,
    })
    render(props)
    expect(screen.queryByText('Recalibration recommended')).toBeNull()
    expect(screen.queryByText('Robot is missing calibration data')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Go to calibration' })).toBeNull()
  })
  it('should render null if loading', () => {
    vi.mocked(useCalibrationTaskList).mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'complete',
      isLoading: true,
    })
    render(props)
    expect(screen.queryByText('Recalibration recommended')).toBeNull()
    expect(screen.queryByText('Robot is missing calibration data')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Go to calibration' })).toBeNull()
  })
  it('should render recalibration recommended if status bad', () => {
    vi.mocked(useCalibrationTaskList).mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'bad',
      isLoading: false,
    })
    render(props)
    expect(screen.getByText('Recalibration recommended')).toBeInTheDocument()
    expect(screen.queryByText('Robot is missing calibration data')).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Go to calibration' })
    ).toBeInTheDocument()
  })
  it('should render calibration required if status bad', () => {
    vi.mocked(useCalibrationTaskList).mockReturnValue({
      activeIndex: null,
      taskList: [],
      taskListStatus: 'incomplete',
      isLoading: false,
    })
    render(props)
    expect(
      screen.getByText('Robot is missing calibration data')
    ).toBeInTheDocument()
    expect(screen.queryByText('Recalibration recommended')).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Go to calibration' })
    ).toBeInTheDocument()
  })
})
