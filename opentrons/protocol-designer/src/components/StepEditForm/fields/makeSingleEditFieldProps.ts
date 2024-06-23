import { getFieldErrors } from '../../../steplist/fieldLevel'
import {
  getDisabledFields,
  getDefaultsForStepType,
} from '../../../steplist/formLevel'
import {
  getFieldDefaultTooltip,
  getSingleSelectDisabledTooltip,
} from '../utils'
import type { StepFieldName, FormData } from '../../../form-types'
import type { FieldProps, FieldPropsByName, FocusHandlers } from '../types'
interface ShowFieldErrorParams {
  name: StepFieldName
  focusedField: StepFieldName | null
  dirtyFields?: StepFieldName[]
}
export const showFieldErrors = ({
  name,
  focusedField,
  dirtyFields,
}: ShowFieldErrorParams): boolean | undefined | StepFieldName[] =>
  !(name === focusedField) && dirtyFields && dirtyFields.includes(name)
export const makeSingleEditFieldProps = (
  focusHandlers: FocusHandlers,
  formData: FormData,
  handleChangeFormInput: (name: string, value: unknown) => void,
  hydratedForm: { [key: string]: any }, //  TODO: create real HydratedFormData type
  t: any
): FieldPropsByName => {
  const { dirtyFields, blur, focusedField, focus } = focusHandlers
  const fieldNames: string[] = Object.keys(
    getDefaultsForStepType(formData.stepType)
  )
  return fieldNames.reduce<FieldPropsByName>((acc, name) => {
    const disabled = hydratedForm
      ? getDisabledFields(hydratedForm).has(name)
      : false
    const value = formData ? formData[name] : null
    const showErrors = showFieldErrors({
      name,
      focusedField,
      dirtyFields,
    })
    const errors = getFieldErrors(name, value)
    const errorToShow =
      showErrors && errors.length > 0 ? errors.join(', ') : null

    const updateValue = (value: unknown): void => {
      handleChangeFormInput(name, value)
    }

    const onFieldBlur = (): void => {
      blur(name)
    }

    const onFieldFocus = (): void => {
      focus(name)
    }

    const defaultTooltip = getFieldDefaultTooltip(name, t)
    const disabledTooltip = getSingleSelectDisabledTooltip(
      name,
      formData.stepType,
      t
    )
    const fieldProps: FieldProps = {
      disabled,
      errorToShow,
      name,
      updateValue,
      value,
      onFieldBlur,
      onFieldFocus,
      tooltipContent: disabled ? disabledTooltip : defaultTooltip,
    }
    return { ...acc, [name]: fieldProps }
  }, {})
}
