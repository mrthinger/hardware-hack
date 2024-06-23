import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import { RobotSettingsModuleCalibration } from '../RobotSettingsModuleCalibration'
import { ModuleCalibrationItems } from '../CalibrationDetails/ModuleCalibrationItems'

vi.mock('../CalibrationDetails/ModuleCalibrationItems')

const render = (
  props: React.ComponentProps<typeof RobotSettingsModuleCalibration>
) => {
  return renderWithProviders(<RobotSettingsModuleCalibration {...props} />, {
    i18nInstance: i18n,
  })
}

const ROBOT_NAME = 'mockRobot'

describe('RobotSettingsModuleCalibration', () => {
  let props: React.ComponentProps<typeof RobotSettingsModuleCalibration>

  beforeEach(() => {
    props = {
      attachedModules: mockFetchModulesSuccessActionPayloadModules,
      updateRobotStatus: vi.fn(),
      formattedPipetteOffsetCalibrations: [],
      robotName: ROBOT_NAME,
    }
    vi.mocked(ModuleCalibrationItems).mockReturnValue(
      <div>mock ModuleCalibrationItems</div>
    )
  })

  it('should render text and ModuleCalibrationItems when a module is attached', () => {
    render(props)
    screen.getByText('Module Calibration')
    screen.getByText(
      "Module calibration uses a pipette and attached probe to determine the module's exact position relative to the deck."
    )
    screen.getByText('mock ModuleCalibrationItems')
  })

  it('should render no modules attached when there is no module', () => {
    props = { ...props, attachedModules: [] }
    render(props)
    screen.getByText('Module Calibration')
    screen.getByText(
      "Module calibration uses a pipette and attached probe to determine the module's exact position relative to the deck."
    )
    screen.getByText('No modules attached')
  })
})
