import * as React from 'react'
import { COUNT } from '../../localization'
import { LabelText, Value, LABEL_LEFT } from '../ui'
import styles from './styles.module.css'

export interface WellCountProps {
  count: number
  wellLabel: string
  className?: string
}

export function WellCount(props: WellCountProps): JSX.Element {
  const { count, wellLabel, className } = props

  return (
    <div className={className}>
      <div className={styles.well_count_data}>
        <LabelText position={LABEL_LEFT}>
          {wellLabel} {COUNT}
        </LabelText>
        <Value>{count}</Value>
      </div>
    </div>
  )
}
