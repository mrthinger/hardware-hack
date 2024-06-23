import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { makeBatchEditFieldProps } from './makeBatchEditFieldProps'
import { NoBatchEditSharedSettings } from './NoBatchEditSharedSettings'
import {
  getBatchEditSelectedStepTypes,
  getMultiSelectDisabledFields,
  getMultiSelectFieldValues,
  getMultiSelectItemIds,
} from '../../ui/steps/selectors'
import { getBatchEditFormHasUnsavedChanges } from '../../step-forms/selectors'
import {
  changeBatchEditField,
  resetBatchEditFieldChanges,
  saveStepFormsMulti,
} from '../../step-forms/actions'
import { maskField } from '../../steplist/fieldLevel'
import { BatchEditMoveLiquid } from './BatchEditMoveLiquid'
import { BatchEditMix } from './BatchEditMix'
import type { StepFieldName } from '../../steplist/fieldLevel'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../types'

export const BatchEditForm = (): JSX.Element => {
  const { t } = useTranslation('tooltip')
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const stepTypes = useSelector(getBatchEditSelectedStepTypes)
  const disabledFields = useSelector(getMultiSelectDisabledFields)
  const selectedStepIds = useSelector(getMultiSelectItemIds)
  const batchEditFormHasChanges = useSelector(getBatchEditFormHasUnsavedChanges)

  const handleChangeFormInput = (name: StepFieldName, value: unknown): void => {
    const maskedValue = maskField(name, value)
    dispatch(changeBatchEditField({ [name]: maskedValue }))
  }

  const handleSave = (): void => {
    dispatch(saveStepFormsMulti(selectedStepIds))
  }

  const handleCancel = (): void => {
    dispatch(resetBatchEditFieldChanges())
  }

  const stepType = stepTypes.length === 1 ? stepTypes[0] : null

  if (stepType !== null && fieldValues !== null && disabledFields !== null) {
    // Valid state for using makeBatchEditFieldProps
    const propsForFields = makeBatchEditFieldProps(
      fieldValues,
      disabledFields,
      handleChangeFormInput,
      t
    )
    switch (stepType) {
      case 'moveLiquid':
        return (
          <BatchEditMoveLiquid
            {...{
              propsForFields,
              handleCancel,
              handleSave,
              batchEditFormHasChanges,
            }}
          />
        )
      case 'mix':
        return (
          <BatchEditMix
            {...{
              propsForFields,
              handleCancel,
              handleSave,
              batchEditFormHasChanges,
            }}
          />
        )
    }
  }

  return <NoBatchEditSharedSettings />
}
