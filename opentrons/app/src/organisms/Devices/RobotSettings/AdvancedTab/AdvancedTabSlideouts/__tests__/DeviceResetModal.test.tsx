import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../../../__testing-utils__'
import { i18n } from '../../../../../../i18n'
import { resetConfig } from '../../../../../../redux/robot-admin'
import { useDispatchApiRequest } from '../../../../../../redux/robot-api'
import { DeviceResetModal } from '../DeviceResetModal'

import type { DispatchApiRequestType } from '../../../../../../redux/robot-api'

vi.mock('../../../../hooks')
vi.mock('../../../../../../redux/robot-admin')
vi.mock('../../../../../../redux/robot-api')

const mockResetOptions = {}
const mockCloseModal = vi.fn()
const ROBOT_NAME = 'otie'
const render = (props: React.ComponentProps<typeof DeviceResetModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceResetModal {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceResetModal', () => {
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    dispatchApiRequest = vi.fn()
    vi.mocked(useDispatchApiRequest).mockReturnValue([dispatchApiRequest, []])
  })

  it('should render title, description, and buttons', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    screen.getByText('Reset to factory settings?')
    screen.getByText('This data cannot be retrieved later.')
    screen.getByRole('button', { name: 'cancel' })
    screen.getByRole('button', { name: 'Yes, clear data and restart robot' })
  })

  it('should close the modal when the user clicks the Yes button', () => {
    const clearMockResetOptions = {
      bootScript: true,
      deckCalibration: true,
    }
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: clearMockResetOptions,
    })
    const clearDataAndRestartRobotButton = screen.getByRole('button', {
      name: 'Yes, clear data and restart robot',
    })
    fireEvent.click(clearDataAndRestartRobotButton)
    expect(dispatchApiRequest).toBeCalledWith(
      resetConfig(ROBOT_NAME, clearMockResetOptions)
    )
  })

  it('should close the modal when clicking the Cancel button', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const cancelButton = screen.getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const closeIconButton = screen.getByTestId(
      'ModalHeader_icon_close_Reset to factory settings?'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  // UNREACHABLE ROBOT
  it('should render title, description, and button-UNREACHABLE', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })
    screen.getByText('Connection to robot lost')
    screen.getByText(
      'The Opentrons App is unable to communicate with this robot right now. Double check the USB or Wi-Fi connection to the robot, then try to reconnect.'
    )
    screen.getByRole('button', { name: 'close' })
  })

  it('should close the modal when clicking the Close button-UNREACHABLE', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })

    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button-UNREACHABLE', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {},
    })
    const closeIconButton = screen.getByTestId(
      'ModalHeader_icon_close_Connection to robot lost'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })
})
