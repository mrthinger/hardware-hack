import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
import { PipetteTypeTile } from '../PipetteTypeTile'
import { EquipmentOption } from '../EquipmentOption'

import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState, WizardTileProps } from '../types'

vi.mock('../EquipmentOption')

const render = (props: React.ComponentProps<typeof PipetteTypeTile>) => {
  return renderWithProviders(<PipetteTypeTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: null, tiprackDefURI: null },
    right: { pipetteName: null, tiprackDefURI: null },
  } as FormPipettesByMount,
  modules: {},
  additionalEquipment: ['gripper'],
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  goBack: vi.fn(),
  proceed: vi.fn(),
  setValue: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
}

describe('PipetteTypeTile', () => {
  let props: React.ComponentProps<typeof PipetteTypeTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
      mount: 'left',
      allowNoPipette: false,
      tileHeader: 'header',
      display96Channel: true,
    }
    vi.mocked(EquipmentOption).mockReturnValue(<div>mock EquipmentOption</div>)
  })
  afterEach(() => {
    cleanup()
  })
  it('renders the correct pipettes for flex with no empty pip allowed and btn ctas work', () => {
    render(props)
    screen.getByText('header')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(5)
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the correct pipettes for flex with empty pip allowed', () => {
    props = {
      ...props,
      allowNoPipette: true,
      display96Channel: false,
    }
    render(props)
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(5)
  })
  it('renders correct pipettes for ot-2 with no empty pip allowed', () => {
    const values = {
      fields: {
        name: 'mockName',
        description: 'mockDescription',
        organizationOrAuthor: 'mockOrganizationOrAuthor',
        robotType: OT2_ROBOT_TYPE,
      },
      pipettesByMount: {
        left: { pipetteName: null, tiprackDefURI: null },
        right: { pipetteName: null, tiprackDefURI: null },
      } as FormPipettesByMount,
      modules: {},
      additionalEquipment: ['gripper'],
    } as FormState

    const mockWizardTileProps: Partial<WizardTileProps> = {
      proceed: vi.fn(),
      setValue: vi.fn(),
      watch: vi.fn((name: keyof typeof values) => values[name]) as any,
    }
    props = {
      ...props,
      ...mockWizardTileProps,
      mount: 'left',
      allowNoPipette: false,
      tileHeader: 'header',
    }
    render(props)
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(12)
  })
})
