import * as React from 'react'
import cx from 'classnames'
import { Icon } from '../icons'
import styles from './styles.module.css'

// TODO(bc, 2021-03-29): this component is only used in PD
// reconsider whether it belongs in components library

export interface SlotMapProps {
  /** Slot(s) to highlight */
  occupiedSlots: string[]
  /** Optional collision warning */
  collisionSlots?: string[]
  /** Optional error styling */
  isError?: boolean
}

const OT2_SLOT_MAP_SLOTS = [
  ['10', '11'],
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
]

const slotWidth = 33
const slotHeight = 23
const iconSize = 20
const numRows = 4
const numCols = 3

export function OT2SlotMap(props: SlotMapProps): JSX.Element {
  const { collisionSlots, occupiedSlots, isError } = props
  const slots = OT2_SLOT_MAP_SLOTS
  return (
    <svg
      viewBox={`-1,-1,${slotWidth * numCols + 2}, ${slotHeight * numRows + 2}`}
    >
      {slots.flatMap((row, rowIndex) =>
        row.map((slot, colIndex) => {
          const isCollisionSlot =
            collisionSlots && collisionSlots.includes(slot)
          const isOccupiedSlot = occupiedSlots.includes(slot)
          return (
            <g
              key={slot}
              transform={`translate(${colIndex * slotWidth} ${
                rowIndex * slotHeight
              })`}
            >
              <rect
                className={cx(styles.slot_rect, {
                  [styles.slot_occupied]: isOccupiedSlot,
                  [styles.slot_error]: isError,
                })}
                width={slotWidth}
                height={slotHeight}
              />
              {isCollisionSlot && (
                <Icon
                  className={styles.collision_icon}
                  name="information"
                  svgWidth={iconSize}
                  svgHeight={iconSize}
                  x={slotWidth / 2 - iconSize / 2}
                  y={slotHeight / 2 - iconSize / 2}
                />
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}
