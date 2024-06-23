import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'

import { renderWithProviders } from '../../__testing-utils__'
import { i18n } from '../../i18n'
import { Breadcrumbs } from '../../organisms/Breadcrumbs'
import { CalibrationDashboard } from '../../pages/Devices/CalibrationDashboard'
import { DeviceDetails } from '../../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../../pages/Devices/DevicesLanding'
import { ProtocolsLanding } from '../../pages/Protocols/ProtocolsLanding'
import { ProtocolRunDetails } from '../../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../../pages/Devices/RobotSettings'
import { GeneralSettings } from '../../pages/AppSettings/GeneralSettings'
import { AlertsModal } from '../../organisms/Alerts/AlertsModal'
import { useIsFlex } from '../../organisms/Devices/hooks'
import { useSoftwareUpdatePoll } from '../hooks'
import { DesktopApp } from '../DesktopApp'

vi.mock('../../organisms/Breadcrumbs')
vi.mock('../../organisms/Devices/hooks')
vi.mock('../../pages/AppSettings/GeneralSettings')
vi.mock('../../pages/Devices/CalibrationDashboard')
vi.mock('../../pages/Devices/DeviceDetails')
vi.mock('../../pages/Devices/DevicesLanding')
vi.mock('../../pages/Protocols/ProtocolsLanding')
vi.mock('../../pages/Devices/ProtocolRunDetails')
vi.mock('../../pages/Devices/RobotSettings')
vi.mock('../hooks')
vi.mock('../../organisms/Alerts/AlertsModal')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <DesktopApp />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('DesktopApp', () => {
  beforeEach(() => {
    vi.mocked(CalibrationDashboard).mockReturnValue(
      <div>Mock CalibrationDashboard</div>
    )
    vi.mocked(DeviceDetails).mockReturnValue(<div>Mock DeviceDetails</div>)
    vi.mocked(DevicesLanding).mockReturnValue(<div>Mock DevicesLanding</div>)
    vi.mocked(ProtocolsLanding).mockReturnValue(
      <div>Mock ProtocolsLanding</div>
    )
    vi.mocked(ProtocolRunDetails).mockReturnValue(
      <div>Mock ProtocolRunDetails</div>
    )
    vi.mocked(RobotSettings).mockReturnValue(<div>Mock RobotSettings</div>)
    vi.mocked(GeneralSettings).mockReturnValue(<div>Mock AppSettings</div>)
    vi.mocked(Breadcrumbs).mockReturnValue(<div>Mock Breadcrumbs</div>)
    vi.mocked(AlertsModal).mockReturnValue(<></>)
    vi.mocked(useIsFlex).mockReturnValue(true)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('renders a Breadcrumbs component', () => {
    render('/devices')
    screen.getByText('Mock Breadcrumbs')
  })

  it('renders an AppSettings component', () => {
    render('/app-settings/general')
    screen.getByText('Mock AppSettings')
  })

  it('renders a DevicesLanding component from /devices', () => {
    render('/devices')
    screen.getByText('Mock DevicesLanding')
  })

  it('renders a DeviceDetails component from /devices/:robotName', () => {
    render('/devices/otie')
    screen.getByText('Mock DeviceDetails')
  })

  it('renders a RobotSettings component from /devices/:robotName/robot-settings/:robotSettingsTab', () => {
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('Mock RobotSettings')
  })

  it('renders a CalibrationDashboard component from /devices/:robotName/robot-settings/calibration/dashboard', () => {
    render('/devices/otie/robot-settings/calibration/dashboard')
    screen.getByText('Mock CalibrationDashboard')
  })

  it('renders a ProtocolsLanding component from /protocols', () => {
    render('/protocols')
    screen.getByText('Mock ProtocolsLanding')
  })

  it('renders a ProtocolRunDetails component from /devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab', () => {
    render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )
    screen.getByText('Mock ProtocolRunDetails')
  })

  it('should poll for software updates', () => {
    render()
    expect(vi.mocked(useSoftwareUpdatePoll)).toBeCalled()
  })
})
