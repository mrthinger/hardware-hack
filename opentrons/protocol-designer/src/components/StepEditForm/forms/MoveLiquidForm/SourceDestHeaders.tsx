import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { getAdditionalEquipmentEntities } from '../../../../step-forms/selectors'
import { LabwareField, WellSelectionField } from '../../fields'
import { AspDispSection } from '../AspDispSection'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData } from '../../../../form-types'
import type { FieldPropsByName } from '../../types'

import styles from '../../StepEditForm.module.css'

interface Props {
  className?: string | null
  collapsed?: boolean | null
  formData: FormData
  prefix: 'aspirate' | 'dispense'
  propsForFields: FieldPropsByName
  toggleCollapsed: () => void
}

const makeAddFieldNamePrefix = (prefix: string) => (
  fieldName: string
): StepFieldName => `${prefix}_${fieldName}`

export const SourceDestHeaders = (props: Props): JSX.Element => {
  const {
    className,
    collapsed,
    toggleCollapsed,
    prefix,
    propsForFields,
    formData,
  } = props
  const { t } = useTranslation('form')
  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const labwareLabel = t(`step_edit_form.labwareLabel.${prefix}`)
  const trashOrLabwareId = formData[addFieldNamePrefix('labware')]
  const isDisposalLocation =
    additionalEquipmentEntities[trashOrLabwareId]?.name === 'wasteChute' ||
    additionalEquipmentEntities[trashOrLabwareId]?.name === 'trashBin'

  return (
    <AspDispSection {...{ className, collapsed, toggleCollapsed, prefix }}>
      <div className={styles.form_row}>
        <FormGroup label={labwareLabel}>
          <LabwareField {...propsForFields[addFieldNamePrefix('labware')]} />
        </FormGroup>
        {isDisposalLocation ? null : (
          <WellSelectionField
            {...propsForFields[addFieldNamePrefix('wells')]}
            labwareId={trashOrLabwareId}
            pipetteId={formData.pipette}
            nozzles={String(propsForFields.nozzles.value) ?? null}
          />
        )}
      </div>
    </AspDispSection>
  )
}
