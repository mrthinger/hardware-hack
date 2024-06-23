import * as React from 'react'
import cx from 'classnames'
import { RobotCoordsForeignDiv } from '@opentrons/components'

import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'
import { BrowseLabware } from './BrowseLabware'
import { EditLabware } from './EditLabware'
import { LabwareName } from './LabwareName'
import { LabwareHighlight } from './LabwareHighlight'
import styles from './LabwareOverlays.module.css'

import type { CoordinateTuple } from '@opentrons/shared-data'
import type { TerminalItemId } from '../../../steplist'
import type { LabwareOnDeck } from '../../../step-forms'

interface LabwareControlsProps {
  labwareOnDeck: LabwareOnDeck
  slotPosition: CoordinateTuple
  setHoveredLabware: (labware?: LabwareOnDeck | null) => void
  setDraggedLabware: (labware?: LabwareOnDeck | null) => void
  swapBlocked: boolean
  selectedTerminalItemId?: TerminalItemId | null
}

export const LabwareControls = (props: LabwareControlsProps): JSX.Element => {
  const {
    labwareOnDeck,
    slotPosition,
    selectedTerminalItemId,
    setHoveredLabware,
    setDraggedLabware,
    swapBlocked,
  } = props

  const canEdit = selectedTerminalItemId === START_TERMINAL_ITEM_ID
  const [x, y] = slotPosition
  const width = labwareOnDeck.def.dimensions.xDimension
  const height = labwareOnDeck.def.dimensions.yDimension
  return (
    <>
      <RobotCoordsForeignDiv
        {...{ x, y, width, height }}
        innerDivProps={{
          className: cx(styles.labware_controls, {
            [styles.can_edit]: canEdit,
          }),
        }}
      >
        <LabwareHighlight labwareOnDeck={labwareOnDeck} />
        {canEdit ? (
          <EditLabware
            labwareOnDeck={labwareOnDeck}
            setHoveredLabware={setHoveredLabware}
            setDraggedLabware={setDraggedLabware}
            swapBlocked={swapBlocked}
          />
        ) : (
          <BrowseLabware labwareOnDeck={labwareOnDeck} />
        )}
        <LabwareName labwareOnDeck={labwareOnDeck} />
      </RobotCoordsForeignDiv>
      {swapBlocked && (
        <BlockedSlot
          {...{ x, y, width, height }}
          message="MODULE_INCOMPATIBLE_LABWARE_SWAP"
        />
      )}
    </>
  )
}
