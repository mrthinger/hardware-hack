import omit from 'lodash/omit'
import range from 'lodash/range'
import { describe, it, expect, beforeEach } from 'vitest'
import { createRegularLabware } from '..'
import fixture_regular_example_1 from '../../../labware/fixtures/2/fixture_regular_example_1.json'
import fixture_regular_example_2 from '../../../labware/fixtures/2/fixture_regular_example_2.json'

import type {
  LabwareDefinition2,
  LabwareWellProperties,
  LabwareOffset,
} from '../../types'

import type { RegularLabwareProps } from '..'

// NOTE: loadName needs to be replaced here b/c fixture has a non-default loadName
const exampleLabware1 = {
  ...fixture_regular_example_1,
  parameters: {
    ...fixture_regular_example_1.parameters,
    loadName: 'opentrons_2_wellplate_100ul',
  },
} as LabwareDefinition2

const exampleLabware2 = {
  ...fixture_regular_example_2,
  parameters: {
    ...fixture_regular_example_2.parameters,
    loadName: 'generic_6_wellplate_1ml',
  },
} as LabwareDefinition2

describe('createLabware', () => {
  let labware1: LabwareDefinition2
  let labware2: LabwareDefinition2
  let labware2Args: RegularLabwareProps
  let well1: LabwareWellProperties
  let well2: LabwareWellProperties
  let offset1: LabwareOffset
  let offset2: LabwareOffset

  beforeEach(() => {
    well1 = omit(exampleLabware1.wells.A1, [
      'x',
      'y',
      'z',
    ]) as LabwareWellProperties

    well2 = omit(exampleLabware2.wells.A1, [
      'x',
      'y',
      'z',
    ]) as LabwareWellProperties

    offset1 = { x: 10, y: 10, z: 55 }
    offset2 = { x: 10, y: 10, z: 40 }

    labware1 = createRegularLabware({
      metadata: exampleLabware1.metadata,
      parameters: exampleLabware1.parameters,
      dimensions: exampleLabware1.dimensions,
      offset: offset1,
      grid: { row: 1, column: 2 },
      spacing: { row: 10, column: 10 },
      well: well1,
      brand: exampleLabware1.brand,
      namespace: 'fixture',
    })
    labware2Args = {
      metadata: exampleLabware2.metadata,
      parameters: exampleLabware2.parameters,
      dimensions: exampleLabware2.dimensions,
      offset: offset2,
      grid: {
        row: 3,
        column: 2,
      },
      spacing: {
        row: 10,
        column: 10,
      },
      well: well2,
      namespace: 'fixture',
    }
    labware2 = createRegularLabware(labware2Args)
  })

  it('snapshot tests', () => {
    expect(labware1).toEqual(exampleLabware1)
    expect(labware2).toEqual(exampleLabware2)
  })

  it('ordering generates as expected', () => {
    expect(exampleLabware2.ordering).toEqual(labware2.ordering)
  })

  it('well XYZ generates correctly', () => {
    const spacing = { row: 10, column: 10 }
    const grid = { row: 3, column: 2 }
    const { yDimension } = exampleLabware2.dimensions

    const labware3 = createRegularLabware({
      metadata: exampleLabware2.metadata,
      parameters: exampleLabware2.parameters,
      dimensions: exampleLabware2.dimensions,
      offset: offset2,
      grid,
      spacing,
      well: well2,
    })

    const expectedXByCol = range(
      offset2.x,
      offset2.x + grid.column * spacing.column,
      spacing.column
    )

    const expectedYByRow = range(
      yDimension - offset2.y,
      yDimension - offset2.y - spacing.row * grid.row,
      -spacing.row
    )

    labware3.ordering.forEach((column, cIndex) => {
      column.forEach((wellName, rIndex) => {
        const well = labware3.wells[wellName]

        expect(well.x).toBeCloseTo(expectedXByCol[cIndex], 2)
        expect(well.y).toBeCloseTo(expectedYByRow[rIndex], 2)
        expect(well.z).toBeCloseTo(offset2.z - well.depth, 2)
      })
    })
  })

  it('failing to validate against labware schema throws w/o "strict"', () => {
    const args = {
      ...labware2Args,
      // this spacing should make negative well `y` value and fail schema validation
      spacing: {
        row: 999,
        column: 999,
      },
    }

    expect(() => createRegularLabware(args)).toThrowErrorMatchingSnapshot()
    expect(() => createRegularLabware({ ...args, strict: false })).not.toThrow()
  })
})
