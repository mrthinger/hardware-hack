import * as React from 'react'
import reduce from 'lodash/reduce'

import { COLUMN } from '@opentrons/shared-data'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from '../../utils'
import { SingleLabware } from './SingleLabware'
import { SelectionRect } from '../SelectionRect'
import { WellTooltip } from './WellTooltip'

import type { WellMouseEvent, WellGroup } from '@opentrons/components'
import type { ContentsByWell } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import type { GenericRect } from '../../collision-types'
import type { NozzleType } from '../../types'

export interface Props {
  labwareProps: Omit<
    React.ComponentProps<typeof SingleLabware>,
    'selectedWells'
  >
  /** array of primary wells. Overrides labwareProps.selectedWells */
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  deselectWells: (wellGroup: WellGroup) => unknown
  updateHighlightedWells: (wellGroup: WellGroup) => unknown
  nozzleType: NozzleType | null
  ingredNames: WellIngredientNames
  wellContents: ContentsByWell
}

type ChannelType = 8 | 96

const getChannelsFromNozleType = (nozzleType: NozzleType): ChannelType => {
  if (nozzleType === '8-channel' || nozzleType === COLUMN) {
    return 8
  } else {
    return 96
  }
}

export const SelectableLabware = (props: Props): JSX.Element => {
  const {
    labwareProps,
    selectedPrimaryWells,
    selectWells,
    deselectWells,
    updateHighlightedWells,
    nozzleType,
    ingredNames,
    wellContents,
  } = props
  const labwareDef = labwareProps.definition

  const _wellsFromSelected: (
    selectedWells: WellGroup
  ) => WellGroup = selectedWells => {
    // Returns PRIMARY WELLS from the selection.
    if (nozzleType != null) {
      const channels = getChannelsFromNozleType(nozzleType)
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: WellGroup = reduce(
        selectedWells,
        (acc: WellGroup, _, wellName: string): WellGroup => {
          const wellSet = getWellSetForMultichannel(
            labwareDef,
            wellName,
            channels
          )
          if (!wellSet) return acc
          return { ...acc, [wellSet[0]]: null }
        },
        {}
      )
      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  const _getWellsFromRect: (rect: GenericRect) => WellGroup = rect => {
    const selectedWells = getCollidingWells(rect)
    return _wellsFromSelected(selectedWells)
  }

  const handleSelectionMove: (e: MouseEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    if (!e.shiftKey) {
      if (nozzleType != null) {
        const channels = getChannelsFromNozleType(nozzleType)
        const selectedWells = _getWellsFromRect(rect)
        const allWellsForMulti: WellGroup = reduce(
          selectedWells,
          (acc: WellGroup, _, wellName: string): WellGroup => {
            const wellSetForMulti =
              getWellSetForMultichannel(labwareDef, wellName, channels) || []
            const channelWells = arrayToWellGroup(wellSetForMulti)
            return {
              ...acc,
              ...channelWells,
            }
          },
          {}
        )
        updateHighlightedWells(allWellsForMulti)
      } else {
        updateHighlightedWells(_getWellsFromRect(rect))
      }
    }
  }

  const handleSelectionDone: (e: MouseEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    const wells = _wellsFromSelected(_getWellsFromRect(rect))
    if (e.shiftKey) {
      deselectWells(wells)
    } else {
      selectWells(wells)
    }
  }

  const handleMouseEnterWell: (args: WellMouseEvent) => void = args => {
    if (nozzleType != null) {
      const channels = getChannelsFromNozleType(nozzleType)
      const wellSet = getWellSetForMultichannel(
        labwareDef,
        args.wellName,
        channels
      )
      const nextHighlightedWells = arrayToWellGroup(wellSet || [])
      nextHighlightedWells && updateHighlightedWells(nextHighlightedWells)
    } else {
      updateHighlightedWells({ [args.wellName]: null })
    }
  }

  // For rendering, show all wells not just primary wells
  const allSelectedWells =
    nozzleType != null
      ? reduce<WellGroup, WellGroup>(
          selectedPrimaryWells,
          (acc, _, wellName): WellGroup => {
            const channels = getChannelsFromNozleType(nozzleType)
            const wellSet = getWellSetForMultichannel(
              labwareDef,
              wellName,
              channels
            )
            if (!wellSet) return acc
            return { ...acc, ...arrayToWellGroup(wellSet) }
          },
          {}
        )
      : selectedPrimaryWells

  return (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      <WellTooltip ingredNames={ingredNames}>
        {({
          makeHandleMouseEnterWell,
          handleMouseLeaveWell,
          tooltipWellName,
        }) => (
          <SingleLabware
            {...labwareProps}
            selectedWells={allSelectedWells}
            onMouseLeaveWell={mouseEventArgs => {
              handleMouseLeaveWell(mouseEventArgs)
              updateHighlightedWells({})
              handleMouseLeaveWell(mouseEventArgs.event)
            }}
            onMouseEnterWell={({ wellName, event }) => {
              if (wellContents !== null) {
                handleMouseEnterWell({ wellName, event })
                makeHandleMouseEnterWell(
                  wellName,
                  wellContents[wellName]?.ingreds
                )(event)
              }
            }}
          />
        )}
      </WellTooltip>
    </SelectionRect>
  )
}
