import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { usePrevious } from '@opentrons/components'
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
} from 'react-hook-form'
import type { ConnectFormValues, ConnectFormFieldProps } from '../types'

export const useResetFormOnSecurityChange = (): void => {
  const {
    control,
    formState: { errors, touchedFields },
    setValue,
    getValues,
    trigger,
    clearErrors,
  } = useForm<ConnectFormValues>()

  const ssid = getValues('ssid')
  const ssidTouched = touchedFields.ssid
  const ssidError = errors.ssid
  const securityType = getValues('securityType')
  const prevSecurityType = usePrevious(securityType)

  useEffect(() => {
    if (prevSecurityType && securityType !== prevSecurityType) {
      clearErrors('ssid')
      clearErrors('securityType')
      setValue('ssid', ssid)
      setValue('securityType', securityType)
      trigger(['ssid', 'securityType'])
    }
  }, [
    ssid,
    ssidTouched,
    ssidError,
    securityType,
    prevSecurityType,
    control,
    setValue,
    trigger,
  ])
}

export const useConnectFormField = (
  field: ControllerRenderProps<FieldValues, any>,
  fieldState: ControllerFieldState
): ConnectFormFieldProps => {
  const error = fieldState.error?.message

  return {
    value: field.value,
    error: error ?? null,
    onChange: field.onChange,
    onBlur: field.onBlur,
    setValue: field.onChange,
    setTouched: field.onBlur,
  }
}
