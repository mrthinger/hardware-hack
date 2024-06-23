import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Tooltip, useHoverTooltip, TOOLTIP_FIXED } from '@opentrons/components'
import {
  getLabwareDisplayName,
  getModuleDisplayName,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getModuleEntities,
} from '../../step-forms/selectors'
import { getHasWasteChute } from '../labware'
import { PDListItem } from '../lists'
import { LabwareTooltipContents } from './LabwareTooltipContents'

import styles from './StepItem.module.css'

interface MoveLabwareHeaderProps {
  sourceLabwareNickname?: string | null
  destinationSlot?: string | null
  useGripper: boolean
}

export function MoveLabwareHeader(props: MoveLabwareHeaderProps): JSX.Element {
  const { sourceLabwareNickname, destinationSlot, useGripper } = props
  const { t } = useTranslation('application')
  const moduleEntities = useSelector(getModuleEntities)
  const labwareEntities = useSelector(getLabwareEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )

  const [sourceTargetProps, sourceTooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })

  const [destTargetProps, destTooltipProps] = useHoverTooltip({
    placement: 'bottom',
    strategy: TOOLTIP_FIXED,
  })

  let destSlot: string | null | undefined = null
  if (destinationSlot === 'offDeck') {
    destSlot = 'off-deck'
  } else if (
    destinationSlot != null &&
    moduleEntities[destinationSlot] != null
  ) {
    destSlot = `${getModuleDisplayName(moduleEntities[destinationSlot].model)}`
  } else if (
    destinationSlot != null &&
    labwareEntities[destinationSlot] != null
  ) {
    destSlot = getLabwareDisplayName(labwareEntities[destinationSlot].def)
  } else if (
    getHasWasteChute(additionalEquipmentEntities) &&
    destinationSlot === WASTE_CHUTE_CUTOUT
  ) {
    destSlot = t('waste_chute_slot')
  } else {
    destSlot = destinationSlot
  }
  return (
    <>
      <li className={styles.substep_header}>
        <span>{useGripper ? t('with_gripper') : t('manually')}</span>
      </li>
      <li className={styles.substep_header}>
        <span>{t('labware')}</span>
        <span className={styles.spacer} />
        <span>{t('new_location')}</span>
      </li>

      <Tooltip {...sourceTooltipProps}>
        <LabwareTooltipContents labwareNickname={sourceLabwareNickname} />
      </Tooltip>

      <Tooltip {...destTooltipProps}>
        <LabwareTooltipContents labwareNickname={destSlot} />
      </Tooltip>

      <PDListItem
        className={cx(
          styles.step_subitem_column_header,
          styles.emphasized_cell
        )}
      >
        <span {...sourceTargetProps} className={styles.labware_display_name}>
          {sourceLabwareNickname}
        </span>

        <div className={styles.spacer} />
        <span {...destTargetProps} className={styles.labware_display_name}>
          {destSlot}
        </span>
      </PDListItem>
    </>
  )
}
