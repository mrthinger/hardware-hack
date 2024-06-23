import * as React from 'react'
import { Route, MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { vi, describe, it, afterEach, beforeEach, expect } from 'vitest'

import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { ChoosePipette } from '../../../organisms/PipetteWizardFlows/ChoosePipette'
import { GripperWizardFlows } from '../../../organisms/GripperWizardFlows'
import { InstrumentsDashboard } from '..'
import { formatTimeWithUtcLabel } from '../../../resources/runs'
import { InstrumentDetail } from '../../../pages/InstrumentDetail'
import type * as ReactApiClient from '@opentrons/react-api-client'

const mockGripperData = {
  instrumentModel: 'gripperV1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: 'ghi789',
  ok: true,
  subsystem: 'gripper',
  data: {
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2023-05-04T13:38:26.649Z',
    },
  },
}
const mockRightPipetteData = {
  instrumentModel: 'p50_single_v3.0',
  instrumentType: 'p50',
  mount: 'right',
  serialNumber: 'abc123',
  ok: true,
  subsystem: 'pipette_right',
  data: {
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2022-05-04T13:38:26.649Z',
    },
  },
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_single_v3.0',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
  ok: true,
  subsystem: 'pipette_left',
  data: {
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2023-05-04T13:38:26.649Z',
    },
  },
}
const mock96ChannelData = {
  instrumentModel: 'p1000_96_v3.0',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
  ok: true,
  subsystem: 'pipette_left',
  data: {
    channels: 96,
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2023-05-04T13:38:26.649Z',
    },
  },
}
vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useInstrumentsQuery: vi.fn(
      () =>
        ({
          data: {
            data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
          },
        } as any)
    ),
  }
})
vi.mock('../../../organisms/GripperWizardFlows')
vi.mock('../../../organisms/PipetteWizardFlows')
vi.mock('../../../organisms/PipetteWizardFlows/ChoosePipette')
vi.mock('../../../organisms/Navigation')

const render = () => {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/instruments', '/instruments/:mount']}>
      <Route path="/instruments">
        <InstrumentsDashboard />
      </Route>
      <Route path="/instruments/:mount">
        <InstrumentDetail />
      </Route>
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('InstrumentsDashboard', () => {
  beforeEach(() => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
      },
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should render mount info for all attached mounts', () => {
    render()
    screen.getByText('left Mount')
    screen.getByText('Flex 1-Channel 1000 μL')
    screen.getByText('right Mount')
    screen.getByText('Flex 1-Channel 50 μL')
    screen.getByText('extension Mount')
    screen.getByText('Flex Gripper')
  })
  it('should route to left mount detail when instrument attached and clicked', () => {
    render()
    fireEvent.click(screen.getByText('left Mount'))
    screen.getByText('serial number')
    screen.getByText(mockLeftPipetteData.serialNumber)
    screen.getByText(
      formatTimeWithUtcLabel(
        mockLeftPipetteData.data.calibratedOffset.last_modified
      )
    )
  })
  it('should route to right mount detail when instrument attached and clicked', () => {
    render()
    fireEvent.click(screen.getByText('right Mount'))
    screen.getByText('serial number')
    screen.getByText(mockRightPipetteData.serialNumber)
    screen.getByText(
      formatTimeWithUtcLabel(
        mockRightPipetteData.data.calibratedOffset.last_modified
      )
    )
  })
  it('should route to extension mount detail when instrument attached and clicked', () => {
    render()
    fireEvent.click(screen.getByText('extension Mount'))
    screen.getByText('serial number')
    screen.getByText(mockGripperData.serialNumber)
  })
  it('should open choose pipette to attach to left mount when empty and clicked', () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    render()
    fireEvent.click(screen.getByText('left Mount'))
    expect(vi.mocked(ChoosePipette)).toHaveBeenCalled()
  })
  it('should open choose pipette to attach to right mount when empty and clicked', () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    render()
    fireEvent.click(screen.getByText('right Mount'))
    expect(vi.mocked(ChoosePipette)).toHaveBeenCalled()
  })
  it('should open attach gripper wizard when extension mount item empty and clicked', () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    render()
    fireEvent.click(screen.getByText('extension Mount'))
    expect(vi.mocked(GripperWizardFlows)).toHaveBeenCalled()
  })
  it('should render the correct info for 96 channel attached', async () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [mock96ChannelData, mockGripperData],
      },
    } as any)
    render()
    screen.getByText('Left+Right Mounts')
    screen.getByText('extension Mount')
  })
})
