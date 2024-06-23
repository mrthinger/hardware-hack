import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { mockLabwareDef } from '../../../../LabwarePositionCheck/__fixtures__/mockLabwareDef'
import { LabwareListItem } from '../LabwareListItem'
import { OffDeckLabwareList } from '../OffDeckLabwareList'

vi.mock('../LabwareListItem')

const render = (props: React.ComponentProps<typeof OffDeckLabwareList>) => {
  return renderWithProviders(
    <StaticRouter>
      <OffDeckLabwareList {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('OffDeckLabwareList', () => {
  beforeEach(() => {
    vi.mocked(LabwareListItem).mockReturnValue(
      <div>mock labware list item</div>
    )
  })
  it('renders null if labware items is null', () => {
    render({
      labwareItems: [],
      isFlex: false,
      commands: [],
    })
    expect(screen.queryAllByText('Additional Off-Deck Labware')).toHaveLength(0)
  })
  it('renders additional offdeck labware info if there is an offdeck labware', () => {
    render({
      labwareItems: [
        {
          nickName: 'nickName',
          definition: mockLabwareDef,
          initialLocation: 'offDeck',
          moduleModel: null,
          moduleLocation: null,
        },
      ],
      isFlex: false,
      commands: [],
    })
    screen.getByText('Additional Off-Deck Labware')
    screen.getByText('mock labware list item')
  })
})
