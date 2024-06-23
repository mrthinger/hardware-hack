import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { FormGroup, Tooltip, useHoverTooltip } from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import SINGLE_IMAGE from '../../../../images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../images/path_multi_aspirate.svg'
import { getDisabledPathMap } from './getDisabledPathMap'
import styles from '../../StepEditForm.module.css'
import type { PathOption } from '../../../../form-types'
import type { FieldProps } from '../../types'
import type { DisabledPathMap, ValuesForPath } from './getDisabledPathMap'

const PATH_ANIMATION_IMAGES = {
  single: new URL('../../../../images/path_single.gif', import.meta.url).href,
  multiAspirate: new URL(
    '../../../../images/path_multiAspirate.gif',
    import.meta.url
  ).href,
  multiDispense: new URL(
    '../../../../images/path_multiDispense.gif',
    import.meta.url
  ).href,
}

const ALL_PATH_OPTIONS: Array<{ name: PathOption; image: string }> = [
  {
    name: 'single',
    image: SINGLE_IMAGE,
  },
  {
    name: 'multiAspirate',
    image: MULTI_ASPIRATE_IMAGE,
  },
  {
    name: 'multiDispense',
    image: MULTI_DISPENSE_IMAGE,
  },
]

type PathFieldProps = FieldProps & ValuesForPath

interface ButtonProps {
  children?: React.ReactNode
  disabled: boolean
  id?: string
  selected: boolean
  subtitle: string
  onClick: (e: React.MouseEvent) => unknown
  path: PathOption
}

const PathButton = (buttonProps: ButtonProps): JSX.Element => {
  const {
    children,
    disabled,
    onClick,
    id,
    path,
    selected,
    subtitle,
  } = buttonProps
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation('form')
  const tooltip = (
    <Tooltip {...tooltipProps}>
      <div className={styles.path_tooltip_title}>
        {t(`step_edit_form.field.path.title.${path}`)}
      </div>
      <img
        className={styles.path_tooltip_image}
        src={PATH_ANIMATION_IMAGES[path]}
      />
      <div className={styles.path_tooltip_subtitle}>{subtitle}</div>
    </Tooltip>
  )

  const pathButtonData = `PathButton_${selected ? 'selected' : 'deselected'}_${
    disabled ? 'disabled' : 'enabled'
  }`

  return (
    <>
      {tooltip}
      <li
        {...targetProps}
        className={cx(styles.path_option, {
          [styles.selected]: selected,
          [styles.disabled]: disabled,
        })}
        // @ts-expect-error(sa, 2021-6-22): null is not a valid onClick handler
        onClick={disabled ? null : onClick}
        id={id}
        data-test={pathButtonData}
      >
        {children}
      </li>
    </>
  )
}

const getSubtitle = (
  path: PathOption,
  disabledPathMap: DisabledPathMap
): string => {
  const reasonForDisabled = disabledPathMap && disabledPathMap[path]
  return reasonForDisabled || ''
}

export const PathField = (props: PathFieldProps): JSX.Element => {
  const {
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    aspirate_wells,
    changeTip,
    dispense_wells,
    pipette,
    volume,
    value,
    updateValue,
    tipRack,
  } = props
  const { t } = useTranslation('form')
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const disabledPathMap = getDisabledPathMap(
    {
      aspirate_airGap_checkbox,
      aspirate_airGap_volume,
      aspirate_wells,
      changeTip,
      dispense_wells,
      pipette,
      volume,
      tipRack,
    },
    pipetteEntities,
    labwareEntities,
    t
  )
  return (
    <FormGroup label="Path">
      <ul className={styles.path_options}>
        {ALL_PATH_OPTIONS.map(option => (
          <PathButton
            id={`PathButton_${option.name}`}
            key={option.name}
            selected={option.name === value}
            path={option.name}
            disabled={
              disabledPathMap !== null && option.name in disabledPathMap
            }
            subtitle={getSubtitle(option.name, disabledPathMap)}
            onClick={() => {
              updateValue(option.name)
            }}
          >
            <img src={option.image} className={styles.path_image} />
          </PathButton>
        ))}
      </ul>
    </FormGroup>
  )
}
