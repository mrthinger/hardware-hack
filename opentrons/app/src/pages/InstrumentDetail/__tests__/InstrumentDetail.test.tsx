import React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { useParams } from 'react-router-dom'

import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { InstrumentDetail } from '../../../pages/InstrumentDetail'
import {
  useGripperDisplayName,
  usePipetteModelSpecs,
} from '../../../resources/instruments/hooks'
import { useIsOEMMode } from '../../../resources/robot-settings/hooks'

import type { Instruments } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useHistory: vi.fn(),
}))
vi.mock('../../../resources/instruments/hooks')
vi.mock('../../../resources/robot-settings/hooks')

const render = () => {
  return renderWithProviders(<InstrumentDetail />, {
    i18nInstance: i18n,
  })
}

describe('InstrumentDetail', () => {
  let mockInstrumentsQuery: Instruments

  beforeEach(() => {
    mockInstrumentsQuery = {
      data: [
        {
          mount: 'left',
          instrumentType: 'pipette',
          instrumentModel: 'p1000_single_v3.4',
          serialNumber: 'P1KSV3420230721',
          subsystem: 'pipette_left',
          ok: true,
          firmwareVersion: '40',
          data: {
            channels: 1,
            min_volume: 5.0,
            max_volume: 1000.0,
            calibratedOffset: {
              offset: {
                x: 0.6796875,
                y: -0.0703125,
                z: -0.11325000000002206,
              },
              source: 'user',
              last_modified: '2023-10-11T22:25:44.858359+00:00',
              reasonability_check_failures: [],
            },
          },
          instrumentName: 'p1000_single_flex',
        } as any,
        {
          mount: 'extension',
          instrumentType: 'gripper',
          instrumentModel: 'test',
          serialNumber: 'P1KSV3420230721',
          subsystem: 'gripper',
          ok: true,
          firmwareVersion: '40',
          data: {
            jawState: 'test',
            calibratedOffset: {
              offset: {
                x: 0.6796875,
                y: -0.0703125,
                z: -0.11325000000002206,
              },
              source: 'user',
              last_modified: '2023-10-11T22:25:44.858359+00:00',
              reasonability_check_failures: [],
            },
          },
        },
      ],
      meta: {
        cursor: 0,
        totalLength: 2,
      },
    }
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)
    vi.mocked(usePipetteModelSpecs).mockReturnValue({
      displayName: 'mockPipette',
    } as any)
    vi.mocked(useGripperDisplayName).mockReturnValue('mockGripper')
    vi.mocked(useParams).mockReturnValue({ mount: 'left' })
    vi.mocked(useIsOEMMode).mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('displays header containing the instrument name and an overflow menu button', () => {
    render()

    screen.getByText('mockPipette')
    screen.getByLabelText('overflow menu button')
  })

  it('renders the gripper name if the instrument is a gripper', () => {
    vi.mocked(useParams).mockReturnValue({ mount: 'extension' })
    render()

    screen.getByText('mockGripper')
  })

  it('does not display the overflow menu button when instrument is not ok', () => {
    mockInstrumentsQuery = {
      ...mockInstrumentsQuery,
      data: mockInstrumentsQuery.data.map(item => ({
        ...item,
        ok: false,
      })),
    } as any

    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)

    render()

    expect(screen.queryByText('overflow menu button')).not.toBeInTheDocument()
  })

  it('renders calibration date when present', () => {
    render()

    screen.getByText('last calibrated')
    screen.queryByText('UTC')
  })

  it("renders 'No calibration data' when no calibration data is present", () => {
    mockInstrumentsQuery = {
      ...mockInstrumentsQuery,
      data: mockInstrumentsQuery.data.map((item: any) => ({
        ...item,
        data: { ...item.data, calibratedOffset: null },
      })),
    }
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)
    render()
    screen.getByText('last calibrated')
    screen.getByText('No calibration data')
  })

  it('renders firmware version information', () => {
    render()
    screen.getByText('firmware version')
    screen.getByText('40')
  })

  it('renders serial number information', () => {
    render()
    screen.getByText('serial number')
    screen.getByText('P1KSV3420230721')
  })

  it('renders detach and no recalibrate button if calibration data exists for a pipette', () => {
    render()
    screen.getByText('detach')
    expect(screen.queryByText('recalibrate')).not.toBeInTheDocument()
  })

  it('renders detach and recalibrate button if calibration data exists for a gripper', () => {
    vi.mocked(useParams).mockReturnValue({ mount: 'extension' })
    render()
    screen.getByText('detach')
    screen.getByText('recalibrate')
  })

  it('renders detach and calibration buttons if no calibration data exists', () => {
    mockInstrumentsQuery = {
      ...mockInstrumentsQuery,
      data: mockInstrumentsQuery.data.map((item: any) => ({
        ...item,
        data: { ...item.data, calibratedOffset: null },
      })),
    }
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: mockInstrumentsQuery,
    } as any)

    render()
    screen.getByText('detach')
    screen.getByText('calibrate')
  })
})
