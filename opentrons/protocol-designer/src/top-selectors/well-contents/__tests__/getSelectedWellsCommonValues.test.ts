import { describe, it, expect, beforeEach } from 'vitest'
import { getSelectedWellsCommonValues } from '../'
import type { LabwareLiquidState } from '@opentrons/step-generation'

let ingredLocations: LabwareLiquidState
let selectedLabwareId: string

beforeEach(() => {
  selectedLabwareId = 'labwareId'

  ingredLocations = {
    labwareId: {
      A1: { ingred1: { volume: 115 } },
      A2: { ingred1: { volume: 111 } },
      A3: { ingred2: { volume: 155 } },
      A4: { ingred2: { volume: 105 }, ingred1: { volume: 10 } },
      // rest empty
    },
  }
})

describe('getSelectedWellsCommonValues', () => {
  it('labware id not in ingredientLocations', () => {
    const selectedWells = { A1: null }
    const selectedLabwareId = 'badLabwareId'
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  it('no selected labware', () => {
    const selectedWells = { A1: null }
    const selectedLabwareId = null
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  it('all selected wells same ingred: return ingred group id', () => {
    const selectedWells = { A1: null, A2: null }
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe('ingred1')
  })

  it('2 well different ingreds: return null', () => {
    const selectedWells = { A2: null, A3: null }
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  it('2 well one empty: return null', () => {
    const selectedWells = { A2: null, A6: null }
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })

  it('1 well mixed ingreds: return null', () => {
    const selectedWells = { A4: null }
    // @ts-expect-error(sa, 2021-6-22): resultFunc not part of Selector type
    const result = getSelectedWellsCommonValues.resultFunc(
      selectedWells,
      selectedLabwareId,
      ingredLocations
    )

    expect(result.ingredientId).toBe(null)
  })
})
