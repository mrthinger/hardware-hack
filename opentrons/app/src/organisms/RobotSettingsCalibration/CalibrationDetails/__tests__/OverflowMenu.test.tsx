import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OT3_PIPETTES } from '@opentrons/shared-data'
import {
  useDeleteCalibrationMutation,
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
} from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { PipetteWizardFlows } from '../../../PipetteWizardFlows'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  useDeckCalibrationData,
  useRunStatuses,
  useAttachedPipettesFromInstrumentsQuery,
} from '../../../Devices/hooks'
import { mockAttachedPipetteInformation } from '../../../../redux/pipettes/__fixtures__'
import {
  mockPipetteOffsetCalibrationsResponse,
  mockTipLengthCalibrationResponse,
} from '../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { useIsEstopNotDisengaged } from '../../../../resources/devices/hooks/useIsEstopNotDisengaged'
import { OverflowMenu } from '../OverflowMenu'
import type { Mount } from '@opentrons/components'

const render = (
  props: React.ComponentProps<typeof OverflowMenu>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const ROBOT_NAME = 'otie'
const CAL_TYPE = 'pipetteOffset'
const PIPETTE_NAME = 'pipetteName'
const OT3_PIPETTE_NAME = OT3_PIPETTES[0]

const startCalibration = vi.fn()
// file-saver has circular dep, need to mock with factory to prevent error
vi.mock('file-saver', async importOriginal => {
  const actual = await importOriginal<typeof saveAs>()
  return {
    ...actual,
    saveAs: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../../../../redux/sessions/selectors')
vi.mock('../../../../redux/discovery')
vi.mock('../../../../redux/robot-api/selectors')
vi.mock(
  '../../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
)
vi.mock('../../../../organisms/ProtocolUpload/hooks')
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../PipetteWizardFlows')
vi.mock('../../../../resources/devices/hooks/useIsEstopNotDisengaged')

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

const mockUpdateRobotStatus = vi.fn()

describe('OverflowMenu', () => {
  let props: React.ComponentProps<typeof OverflowMenu>
  const mockDeleteCalibration = vi.fn()

  beforeEach(() => {
    props = {
      calType: CAL_TYPE,
      robotName: ROBOT_NAME,
      mount: 'left' as Mount,
      serialNumber: 'serialNumber',
      updateRobotStatus: mockUpdateRobotStatus,
      pipetteName: PIPETTE_NAME,
      tiprackDefURI: 'mock/tiprack/uri',
    }
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: null,
      right: null,
    })
    vi.mocked(useCalibratePipetteOffset).mockReturnValue([
      startCalibration,
      null,
    ])
    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
    vi.mocked(useDeckCalibrationData).mockReturnValue({
      isDeckCalibrated: true,
      deckCalibrationData: mockDeckCalData,
    })
    vi.mocked(useDeleteCalibrationMutation).mockReturnValue({
      deleteCalibration: mockDeleteCalibration,
    } as any)
    vi.mocked(useAllPipetteOffsetCalibrationsQuery).mockReturnValue({
      data: {
        data: [mockPipetteOffsetCalibrationsResponse],
      },
    } as any)
    vi.mocked(useAllTipLengthCalibrationsQuery).mockReturnValue({
      data: {
        data: [mockTipLengthCalibrationResponse],
      },
    } as any)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
  })

  it('should render Overflow menu buttons - pipette offset calibrations', () => {
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    screen.getByText('Download calibration logs')
    screen.getByText('Delete calibration data')
  })

  it('download pipette offset calibrations data', async () => {
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const downloadButton = screen.getByText('Download calibration logs')
    fireEvent.click(downloadButton)
  })

  it('should close the overflow menu when clicking it again', () => {
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    fireEvent.click(button)
    expect(
      screen.queryByText('Download calibration logs')
    ).not.toBeInTheDocument()
  })

  it('should render Overflow menu buttons - tip length calibrations', () => {
    props = {
      ...props,
      calType: 'tipLength',
    }
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_tipLength'
    )
    fireEvent.click(button)
    screen.getByText('Download calibration logs')
    screen.getByText('Delete calibration data')
  })

  it('call a function when clicking download tip length calibrations data', async () => {
    render({
      ...props,
      calType: 'tipLength',
    })
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_tipLength'
    )
    fireEvent.click(button)
    const downloadButton = screen.getByText('Download calibration logs')
    fireEvent.click(downloadButton)
  })

  it('recalibration button should open up the pipette wizard flow for flex pipettes', () => {
    vi.mocked(useAttachedPipettesFromInstrumentsQuery).mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    vi.mocked(PipetteWizardFlows).mockReturnValue(
      <div>mock pipette wizard flows</div>
    )
    props = {
      ...props,
      pipetteName: OT3_PIPETTE_NAME,
    }
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const cal = screen.getByText('Recalibrate pipette')
    expect(
      screen.queryByText('Download calibration logs')
    ).not.toBeInTheDocument()
    fireEvent.click(cal)
    screen.getByText('mock pipette wizard flows')
  })

  it('calibration button should open up the pipette wizard flow for flex pipettes', () => {
    vi.mocked(PipetteWizardFlows).mockReturnValue(
      <div>mock pipette wizard flows</div>
    )
    vi.mocked(useAllPipetteOffsetCalibrationsQuery).mockReturnValue({
      data: {
        data: [],
      },
    } as any)
    props = {
      ...props,
      pipetteName: OT3_PIPETTE_NAME,
    }
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const cal = screen.getByText('Calibrate pipette')
    fireEvent.click(cal)
    screen.getByText('mock pipette wizard flows')
  })

  it('deletes calibration data when delete button is clicked - pipette offset', () => {
    const expectedCallParams = {
      calType: CAL_TYPE,
      mount: 'left',
      pipette_id: mockPipetteOffsetCalibrationsResponse.pipette,
    }
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const deleteBtn = screen.getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalledWith(expectedCallParams)
  })

  it('deletes calibration data when delete button is clicked - tip length', () => {
    props = {
      ...props,
      calType: 'tipLength',
      tiprackDefURI: mockTipLengthCalibrationResponse.uri,
    }
    const expectedCallParams = {
      calType: 'tipLength',
      tiprack_uri: mockTipLengthCalibrationResponse.uri,
      pipette_id: mockTipLengthCalibrationResponse.pipette,
    }
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_tipLength'
    )
    fireEvent.click(button)
    const deleteBtn = screen.getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalledWith(expectedCallParams)
  })

  it('does nothing when delete is clicked and there is no matching calibration data to delete - pipette offset', () => {
    vi.mocked(useAllPipetteOffsetCalibrationsQuery).mockReturnValue({
      data: {
        data: [],
      },
    } as any)
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const deleteBtn = screen.getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalled()
  })

  it('does nothing when delete is clicked and there is no matching calibration data to delete - tip length', () => {
    vi.mocked(useAllTipLengthCalibrationsQuery).mockReturnValue({
      data: {
        data: [],
      },
    } as any)
    props = {
      ...props,
      calType: 'tipLength',
    }
    render(props)
    const button = screen.getByLabelText(
      'CalibrationOverflowMenu_button_tipLength'
    )
    fireEvent.click(button)
    const deleteBtn = screen.getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalled()
  })

  it('should make overflow menu disabled when e-stop is pressed', () => {
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(true)
    render(props)
    expect(
      screen.getByLabelText('CalibrationOverflowMenu_button_pipetteOffset')
    ).toBeDisabled()
  })
})
