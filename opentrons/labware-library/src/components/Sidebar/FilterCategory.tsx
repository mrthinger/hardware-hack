// filter labware by category
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'
import { getAllCategories, buildFiltersUrl } from '../../filters'
import {
  PLURAL_CATEGORY_LABELS_BY_CATEGORY,
  CATEGORY,
} from '../../localization'
import styles from './styles.module.css'
import type { FilterParams } from '../../types'

export interface FilterCategoryProps {
  filters: FilterParams
}

export function FilterCategory(props: FilterCategoryProps): JSX.Element {
  const { filters } = props
  const categories = getAllCategories()

  return (
    <>
      <p className={styles.filter_label}>{CATEGORY}</p>
      <ul className={styles.filter_category}>
        {categories.map(c => (
          <li key={c} className={styles.filter_category_item}>
            <Link
              to={buildFiltersUrl({ ...filters, category: c })}
              className={cx(styles.filter_category_link, {
                [styles.selected]: c === filters.category,
              })}
            >
              {/* @ts-expect-error(IL, 2021-03-24): lookup unsafe */}
              {PLURAL_CATEGORY_LABELS_BY_CATEGORY[c]}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
