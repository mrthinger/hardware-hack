// reset all filters button
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@opentrons/components'
import { buildFiltersUrl, FILTER_OFF } from '../../filters'
import { CLEAR_FILTERS } from '../../localization'
import styles from './styles.module.css'
import type { FilterParams } from '../../types'

export interface FilterResetProps {
  filters: FilterParams
}

export function FilterReset(props: FilterResetProps): JSX.Element | null {
  const { filters } = props
  // TODO (ka 2019-3-09):Should this be moved to Sidebar?
  const { manufacturer, category } = filters
  const filtersCleared = manufacturer === FILTER_OFF && category === FILTER_OFF
  if (filtersCleared) return null

  return (
    <Link
      to={buildFiltersUrl({ ...filters, category: 'all', manufacturer: 'all' })}
      className={styles.filter_reset_link}
    >
      <Icon name="close" className={styles.filter_reset_icon} />
      {CLEAR_FILTERS}
    </Link>
  )
}
