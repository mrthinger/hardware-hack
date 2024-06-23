import * as React from 'react'
import cx from 'classnames'
import get from 'lodash/get'
import { MoreOptionsModal } from '../modals/MoreOptionsModal'
import {
  MixForm,
  MoveLabwareForm,
  MoveLiquidForm,
  PauseForm,
  MagnetForm,
  TemperatureForm,
  ThermocyclerForm,
  HeaterShakerForm,
} from './forms'
import { Alerts } from '../alerts/Alerts'
import { ButtonRow } from './ButtonRow'
import formStyles from '../forms/forms.module.css'
import styles from './StepEditForm.module.css'
import type { StepFieldName } from '../../steplist/fieldLevel'
import type { FormData, StepType } from '../../form-types'
import type { FieldPropsByName, FocusHandlers, StepFormProps } from './types'

type StepFormMap = {
  [K in StepType]?: React.ComponentType<StepFormProps> | null
}

const STEP_FORM_MAP: StepFormMap = {
  mix: MixForm,
  pause: PauseForm,
  moveLabware: MoveLabwareForm,
  moveLiquid: MoveLiquidForm,
  magnet: MagnetForm,
  temperature: TemperatureForm,
  thermocycler: ThermocyclerForm,
  heaterShaker: HeaterShakerForm,
}

interface Props {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: StepFieldName | null
  formData: FormData
  propsForFields: FieldPropsByName
  handleClose: () => unknown
  handleDelete: () => unknown
  handleSave: () => unknown
  showMoreOptionsModal: boolean
  toggleMoreOptionsModal: () => unknown
}

export const StepEditFormComponent = (props: Props): JSX.Element => {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleDelete,
    dirtyFields,
    handleSave,
    propsForFields,
    showMoreOptionsModal,
    toggleMoreOptionsModal,
    focusedField,
  } = props

  const FormComponent: typeof STEP_FORM_MAP[keyof typeof STEP_FORM_MAP] = get(
    STEP_FORM_MAP,
    formData.stepType
  )
  if (!FormComponent) {
    // early-exit if step form doesn't exist
    return (
      <div className={formStyles.form}>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }

  return (
    <>
      {showMoreOptionsModal && (
        <MoreOptionsModal formData={formData} close={toggleMoreOptionsModal} />
      )}
      <Alerts
        focusedField={focusedField}
        dirtyFields={dirtyFields}
        componentType="Form"
      />
      <div className={cx(formStyles.form, styles[formData.stepType])}>
        <FormComponent {...{ formData, propsForFields, focusHandlers }} />
        <ButtonRow
          handleClickMoreOptions={toggleMoreOptionsModal}
          handleClose={handleClose}
          handleSave={handleSave}
          handleDelete={handleDelete}
          canSave={canSave}
        />
      </div>
    </>
  )
}
