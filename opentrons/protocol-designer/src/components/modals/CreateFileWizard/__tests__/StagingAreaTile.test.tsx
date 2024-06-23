import * as React from 'react'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { vi, describe, beforeEach, expect, it } from 'vitest'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
import { StagingAreaTile } from '../StagingAreaTile'

import type * as Components from '@opentrons/components'
import type { FormState, WizardTileProps } from '../types'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckConfigurator: () => <div>mock deck configurator</div>,
  }
})

const render = (props: React.ComponentProps<typeof StagingAreaTile>) => {
  return renderWithProviders(<StagingAreaTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    robotType: OT2_ROBOT_TYPE,
  },
  additionalEquipment: ['gripper'],
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  goBack: vi.fn(),
  proceed: vi.fn(),
  setValue: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
  getValues: vi.fn(() => values) as any,
}

describe('StagingAreaTile', () => {
  let props: React.ComponentProps<typeof StagingAreaTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
  })
  it('renders null when robot type is ot-2', () => {
    render(props)
    expect(screen.queryByText('Staging area slots')).not.toBeInTheDocument()
  })
  it('renders header and deck configurator', () => {
    const values = {
      fields: {
        robotType: FLEX_ROBOT_TYPE,
      },
      additionalEquipment: ['gripper'],
    } as FormState

    const mockWizardTileProps: Partial<WizardTileProps> = {
      goBack: vi.fn(),
      proceed: vi.fn(),
      setValue: vi.fn(),
      watch: vi.fn((name: keyof typeof values) => values[name]) as any,
      getValues: vi.fn(() => values) as any,
    }

    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    render(props)
    screen.getByText('Staging area slots')
    screen.getByText('mock deck configurator')
  })
})
