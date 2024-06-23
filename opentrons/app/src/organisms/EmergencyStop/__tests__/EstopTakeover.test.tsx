import * as React from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { useEstopQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { EstopMissingModal } from '../EstopMissingModal'
import { EstopPressedModal } from '../EstopPressedModal'
import { useIsUnboxingFlowOngoing } from '../../RobotSettingsDashboard/NetworkSettings/hooks'
import {
  ENGAGED,
  LOGICALLY_ENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
} from '../constants'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { EstopTakeover } from '../EstopTakeover'

vi.mock('@opentrons/react-api-client')
vi.mock('../EstopMissingModal')
vi.mock('../EstopPressedModal')
vi.mock('../../RobotSettingsDashboard/NetworkSettings/hooks')
vi.mock('../../../redux/discovery')

const mockPressed = {
  data: {
    status: PHYSICALLY_ENGAGED,
    leftEstopPhysicalStatus: ENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}

const render = (props: React.ComponentProps<typeof EstopTakeover>) => {
  return renderWithProviders(<EstopTakeover {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopTakeover', () => {
  let props: React.ComponentProps<typeof EstopTakeover>

  beforeEach(() => {
    props = {
      robotName: 'Flex',
    }
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockPressed } as any)
    vi.mocked(EstopMissingModal).mockReturnValue(
      <div>mock EstopMissingModal</div>
    )
    vi.mocked(EstopPressedModal).mockReturnValue(
      <div>mock EstopPressedModal</div>
    )
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(false)
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
  })

  it('should render EstopPressedModal - PHYSICALLY_ENGAGED', () => {
    render(props)
    screen.getByText('mock EstopPressedModal')
  })

  it('should render EstopPressedModal - LOGICALLY_ENGAGED', () => {
    mockPressed.data.status = LOGICALLY_ENGAGED
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockPressed } as any)
    render(props)
    screen.getByText('mock EstopPressedModal')
  })

  it('should render EstopMissingModal on Desktop app - NOT_PRESENT', () => {
    mockPressed.data.status = NOT_PRESENT
    mockPressed.data.leftEstopPhysicalStatus = NOT_PRESENT
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockPressed } as any)
    render(props)
    screen.getByText('mock EstopMissingModal')
  })

  it('should render EstopMissingModal on Touchscreen app - NOT_PRESENT', () => {
    mockPressed.data.status = NOT_PRESENT
    mockPressed.data.leftEstopPhysicalStatus = NOT_PRESENT
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockPressed } as any)
    props = {
      robotName: undefined,
    }
    render(props)
    screen.getByText('mock EstopMissingModal')
  })

  it('should not render EstopPressedModal if a user does not finish unboxing', () => {
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(true)
    render(props)
    expect(screen.queryByText('mock EstopPressedModal')).not.toBeInTheDocument()
  })

  it('should not render EstopMissingModal if a user does not finish unboxing', () => {
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(true)
    mockPressed.data.status = NOT_PRESENT
    render(props)
    expect(screen.queryByText('mock EstopMissingModal')).not.toBeInTheDocument()
  })
})
