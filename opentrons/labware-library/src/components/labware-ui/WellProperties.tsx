import * as React from 'react'
import { Icon } from '@opentrons/components'
import {
  getDisplayVolume,
  getUniqueWellProperties,
} from '@opentrons/shared-data'
import {
  MAX_VOLUME,
  SHAPE,
  WELL_BOTTOM_VALUES,
  VARIOUS,
} from '../../localization'
import { getWellLabel } from './labels'
import { LabelText, Value, LABEL_TOP } from '../ui'
import styles from './styles.module.css'
import type {
  LabwareDefinition,
  LabwareWellGroupProperties,
  LabwareVolumeUnits,
} from '../../types'

export interface AllWellPropertiesProps {
  definition: LabwareDefinition
  className?: string
}

export interface WellPropertiesProps {
  wellProperties: LabwareWellGroupProperties
  wellLabel: string
  displayVolumeUnits: LabwareVolumeUnits
  hideTitle?: boolean
}

export function AllWellProperties(props: AllWellPropertiesProps): JSX.Element {
  const { definition, className } = props
  const { displayVolumeUnits } = definition.metadata
  const uniqueWellProps = getUniqueWellProperties(definition)

  return (
    <div className={className}>
      {uniqueWellProps.map((wellProperties, i) => (
        <WellProperties
          key={i}
          wellLabel={getWellLabel(wellProperties, definition)}
          wellProperties={wellProperties}
          displayVolumeUnits={displayVolumeUnits}
        />
      ))}
    </div>
  )
}

const BOTTOM_SHAPE_TO_ICON = {
  v: 'ot-v-bottom',
  u: 'ot-u-bottom',
  flat: 'ot-flat-bottom',
} as const

export function WellProperties(props: WellPropertiesProps): JSX.Element {
  const {
    hideTitle,
    wellProperties,
    wellLabel,
    displayVolumeUnits: units,
  } = props

  const { totalLiquidVolume: vol, metadata } = wellProperties
  const { displayName, wellBottomShape } = metadata
  const wellBottomValue = wellBottomShape
    ? WELL_BOTTOM_VALUES[wellBottomShape]
    : null

  return (
    <div className={styles.well_properties}>
      {!hideTitle && displayName && (
        <h3 className={styles.well_properties_title}>{displayName}</h3>
      )}
      <div className={styles.well_properties_column}>
        <div>
          <LabelText position={LABEL_TOP}>{MAX_VOLUME}</LabelText>
          <Value>
            {vol ? `${getDisplayVolume(vol, units, 2)} ${units}` : VARIOUS}
          </Value>
        </div>
      </div>
      {wellBottomShape && wellBottomValue && (
        <div className={styles.well_properties_column}>
          <div>
            <LabelText position={LABEL_TOP}>
              {wellLabel} {SHAPE}
            </LabelText>
            <Value>{wellBottomValue}</Value>
          </div>
          <Icon
            className={styles.well_bottom_icon}
            name={BOTTOM_SHAPE_TO_ICON[wellBottomShape]}
          />
        </div>
      )}
    </div>
  )
}
