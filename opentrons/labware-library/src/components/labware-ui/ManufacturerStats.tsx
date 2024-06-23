// labware details page title and category
import * as React from 'react'
import {
  MANUFACTURER,
  MANUFACTURER_NO,
  MANUFACTURER_VALUES,
} from '../../localization'
import { ExternalLink, LabelText, Value, LABEL_TOP } from '../ui'
import type { LabwareBrand } from '../../types'
import styles from './styles.module.css'

export interface ManufacturerStatsProps {
  brand: LabwareBrand
}

export function ManufacturerStats(props: ManufacturerStatsProps): JSX.Element {
  const { brand } = props
  const { brand: brandName, brandId, links } = brand
  const manfacturerValue = MANUFACTURER_VALUES[brandName] || brandName

  return (
    <>
      <div className={styles.manufacturer_stats}>
        <LabelText position={LABEL_TOP}>{MANUFACTURER}</LabelText>
        <Value>{manfacturerValue}</Value>
        {links &&
          links.length > 0 &&
          links.map((href, key) => (
            <ExternalLink key={key} href={href}>
              website
            </ExternalLink>
          ))}
      </div>
      {brandId && brandId.length > 0 && (
        <div className={styles.manufacturer_stats}>
          <LabelText position={LABEL_TOP}>{MANUFACTURER_NO}</LabelText>
          <Value>
            <span className={styles.manufacturer_brand_id}>
              {brandId.join(', ')}
            </span>
          </Value>
        </div>
      )}
    </>
  )
}
