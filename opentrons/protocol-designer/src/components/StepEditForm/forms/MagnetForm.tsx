import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'
import { selectors as uiModuleSelectors } from '../../../ui/modules'
import { getModuleEntities } from '../../../step-forms/selectors'
import {
  MAX_ENGAGE_HEIGHT_V1,
  MAX_ENGAGE_HEIGHT_V2,
  MIN_ENGAGE_HEIGHT_V1,
  MIN_ENGAGE_HEIGHT_V2,
} from '../../../constants'
import { TextField, RadioGroupField } from '../fields'
import type { StepFormProps } from '../types'

import styles from '../StepEditForm.module.css'

export function MagnetForm(props: StepFormProps): JSX.Element {
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getMagneticLabwareOptions
  )
  const moduleEntities = useSelector(getModuleEntities)
  const { t } = useTranslation(['application', 'form'])
  const { propsForFields, formData } = props
  const { magnetAction, moduleId } = formData

  const moduleModel = moduleEntities[moduleId].model
  const moduleOption: string | null | undefined = moduleLabwareOptions[0]
    ? moduleLabwareOptions[0].name
    : 'No magnetic module'

  const defaultEngageHeight = useSelector(
    uiModuleSelectors.getMagnetLabwareEngageHeight
  )
  const engageHeightMinMax =
    moduleModel === MAGNETIC_MODULE_V1
      ? t('magnet_height_caption', {
          low: MIN_ENGAGE_HEIGHT_V1,
          high: MAX_ENGAGE_HEIGHT_V1,
        })
      : t('magnet_height_caption', {
          low: MIN_ENGAGE_HEIGHT_V2,
          high: MAX_ENGAGE_HEIGHT_V2,
        })
  const engageHeightDefault =
    defaultEngageHeight != null
      ? t('magnet_recommended', { default: defaultEngageHeight })
      : ''
  const engageHeightCaption = `${engageHeightMinMax} ${engageHeightDefault}`

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('stepType.magnet')}
        </span>
      </div>

      <div className={styles.magnet_section_wrapper}>
        <FormGroup
          label={t('form:step_edit_form.field.moduleActionLabware.label')}
          className={styles.magnet_form_group}
        >
          <p className={styles.module_labware_text}>{moduleOption}</p>
        </FormGroup>
        <FormGroup
          label={t('form:step_edit_form.field.magnetAction.label')}
          className={styles.magnet_form_group}
        >
          <RadioGroupField
            {...propsForFields.magnetAction}
            options={[
              {
                name: t(
                  'form:step_edit_form.field.magnetAction.options.engage'
                ),
                value: 'engage',
              },
            ]}
          />
          <RadioGroupField
            {...propsForFields.magnetAction}
            options={[
              {
                name: t(
                  'form:step_edit_form.field.magnetAction.options.disengage'
                ),
                value: 'disengage',
              },
            ]}
          />
        </FormGroup>
        {magnetAction === 'engage' && (
          <FormGroup
            label={t('form:step_edit_form.field.engageHeight.label')}
            className={styles.magnet_form_group}
          >
            <TextField
              {...propsForFields.engageHeight}
              caption={engageHeightCaption}
              className={styles.small_field}
            />
          </FormGroup>
        )}
      </div>
    </div>
  )
}
