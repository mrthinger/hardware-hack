import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { GripperWizardFlows } from '../../../organisms/GripperWizardFlows'
import { formatLastCalibrated } from '../CalibrationDetails/utils'
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'
import { RobotSettingsGripperCalibration } from '../RobotSettingsGripperCalibration'

import type { GripperData } from '@opentrons/api-client'

vi.mock('../../../organisms/GripperWizardFlows')
vi.mock('../CalibrationDetails/utils')
vi.mock('../../../resources/devices/hooks/useIsEstopNotDisengaged')

const mockGripperData = {
  serialNumber: 'mockSerial123',
  data: {
    calibratedOffset: {
      last_modified: '12345',
    },
  },
} as GripperData
const mockNotCalibratedGripper = {
  serialNumber: 'mockSerial123',
  data: {
    calibratedOffset: {
      last_modified: undefined,
    },
  },
} as GripperData
const ROBOT_NAME = 'mockRobot'

const render = (
  props: React.ComponentProps<typeof RobotSettingsGripperCalibration>
) => {
  return renderWithProviders(<RobotSettingsGripperCalibration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsGripperCalibration', () => {
  let props: React.ComponentProps<typeof RobotSettingsGripperCalibration>
  beforeEach(() => {
    vi.mocked(formatLastCalibrated).mockReturnValue('last calibrated 1/2/3')
    vi.mocked(GripperWizardFlows).mockReturnValue(<>Mock Wizard Flow</>)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
    props = {
      gripper: mockGripperData,
      robotName: ROBOT_NAME,
    }
  })

  it('renders a title and description - Gripper Calibration section', () => {
    render(props)
    screen.getByText('Gripper Calibration')
    screen.getByText(
      `Gripper calibration uses a metal pin to determine the gripper's exact position relative to precision-cut squares on deck slots.`
    )
    screen.getByText('Gripper Serial')
    screen.getByText('Last Calibrated')
  })
  it('renders last calibrated date and recalibrate button if calibration data exists', () => {
    render(props)
    screen.getByText('mockSerial123')
    screen.getByText('last calibrated 1/2/3')
    const overflowButton = screen.getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    fireEvent.click(overflowButton)
    screen.getByText('Recalibrate gripper')
  })
  it('renders not calibrated and calibrate button if calibration data does not exist', () => {
    props = { ...props, gripper: mockNotCalibratedGripper }

    render(props)
    screen.getByText('mockSerial123')
    screen.getByText('Not calibrated')
    const overflowButton = screen.getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    fireEvent.click(overflowButton)
    screen.getByText('Calibrate gripper')
  })
  it('renders gripper wizard flows when calibrate is pressed', () => {
    props = { ...props, gripper: mockNotCalibratedGripper }
    render(props)
    const overflowButton = screen.getByRole('button', {
      name: 'CalibrationOverflowMenu_button_gripperCalibration',
    })
    fireEvent.click(overflowButton)
    const calibrateButton = screen.getByText('Calibrate gripper')
    fireEvent.click(calibrateButton)
    screen.getByText('Mock Wizard Flow')
  })

  it('render text when gripper is not attached instead calibration data', () => {
    props = {
      ...props,
      gripper: null as any,
    }
    render(props)
    screen.getByText('No gripper attached')
  })

  it('overflow menu is disabled when e-stop button is pressed', () => {
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(true)
    render(props)
    expect(
      screen.getByRole('button', {
        name: 'CalibrationOverflowMenu_button_gripperCalibration',
      })
    ).toBeDisabled()
  })
})
