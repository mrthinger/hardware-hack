import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import noop from 'lodash/noop'
import { useDrop, useDrag } from 'react-dnd'
import cx from 'classnames'
import { Icon, RobotCoordsForeignDiv } from '@opentrons/components'
import { DND_TYPES } from '../../../constants'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import {
  moveDeckItem,
  openAddLabwareModal,
} from '../../../labware-ingred/actions'
import { selectors as labwareDefSelectors } from '../../../labware-defs'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'
import styles from './LabwareOverlays.module.css'

import type { DropTargetMonitor } from 'react-dnd'
import type {
  CoordinateTuple,
  Dimensions,
  ModuleType,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'
import type { TerminalItemId } from '../../../steplist'

interface SlotControlsProps {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  //  NOTE: slotId can be either AddressableAreaName or moduleId
  slotId: string
  moduleType: ModuleType | null
  selectedTerminalItemId?: TerminalItemId | null
  handleDragHover?: () => void
}

interface DroppedItem {
  labwareOnDeck: LabwareOnDeck
}

export const SlotControls = (props: SlotControlsProps): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    selectedTerminalItemId,
    moduleType,
    handleDragHover,
  } = props
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const ref = React.useRef(null)
  const dispatch = useDispatch()

  const { t } = useTranslation('deck')

  const [, drag] = useDrag({
    type: DND_TYPES.LABWARE,
    item: { labwareOnDeck: null },
  })

  const [{ draggedItem, itemType, isOver }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        const draggedDef = item?.labwareOnDeck?.def
        console.assert(
          draggedDef,
          'no labware def of dragged item, expected it on drop'
        )

        if (moduleType != null && draggedDef != null) {
          // this is a module slot, prevent drop if the dragged labware is not compatible
          const isCustomLabware = getLabwareIsCustom(
            customLabwareDefs,
            item.labwareOnDeck
          )

          return (
            getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware
          )
        }
        return true
      },
      drop: (item: DroppedItem) => {
        const droppedLabware = item
        if (droppedLabware.labwareOnDeck != null) {
          const droppedSlot = droppedLabware.labwareOnDeck.slot
          dispatch(moveDeckItem(droppedSlot, slotId))
        }
      },
      hover: () => {
        if (handleDragHover != null) {
          handleDragHover()
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        itemType: monitor.getItemType(),
        isOver: !!monitor.isOver(),
        draggedItem: monitor.getItem() as DroppedItem,
      }),
    }),
    []
  )

  if (
    selectedTerminalItemId !== START_TERMINAL_ITEM_ID ||
    (itemType !== DND_TYPES.LABWARE && itemType !== null) ||
    slotPosition == null
  )
    return null

  const draggedDef = draggedItem?.labwareOnDeck?.def

  const isCustomLabware = draggedItem
    ? getLabwareIsCustom(customLabwareDefs, draggedItem.labwareOnDeck)
    : false

  let slotBlocked: string | null = null
  if (
    isOver &&
    moduleType != null &&
    draggedDef != null &&
    !getLabwareIsCompatible(draggedDef, moduleType) &&
    !isCustomLabware
  ) {
    slotBlocked = 'Labware incompatible with this module'
  }

  const isOnHeaterShaker = moduleType === 'heaterShakerModuleType'
  const isNoAdapterOption =
    moduleType === 'magneticBlockType' ||
    moduleType === 'magneticModuleType' ||
    moduleType === 'thermocyclerModuleType'
  let overlayText: string = 'add_adapter_or_labware'
  if (isOnHeaterShaker) {
    overlayText = 'add_adapter'
  } else if (isNoAdapterOption) {
    overlayText = 'add_labware'
  }

  const addLabware = (): void => {
    dispatch(openAddLabwareModal({ slot: slotId }))
  }

  drag(drop(ref))

  return (
    <g ref={ref}>
      {slotBlocked ? (
        <BlockedSlot
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          message="MODULE_INCOMPATIBLE_SINGLE_LABWARE"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          innerDivProps={{
            className: cx(styles.slot_overlay, styles.appear_on_mouseover, {
              [styles.appear]: isOver,
            }),
            onClick: isOver ? noop : addLabware,
          }}
        >
          <a className={styles.overlay_button} onClick={addLabware}>
            {!isOver && <Icon className={styles.overlay_icon} name="plus" />}
            {t(`overlay.slot.${isOver ? 'place_here' : overlayText}`)}
          </a>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}
