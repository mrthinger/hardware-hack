import * as React from 'react'
import { createPortal } from 'react-dom'
import round from 'lodash/round'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  FormGroup,
  RadioGroup,
  InputField,
  Flex,
  useHoverTooltip,
  Tooltip,
} from '@opentrons/components'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import type { FieldProps } from '../../types'

import modalStyles from '../../../modals/modal.module.css'
import stepFormStyles from '../../StepEditForm.module.css'
import styles from './FlowRateInput.module.css'

const DECIMALS_ALLOWED = 1

/** When flow rate is falsey (including 0), it means 'use default' */
export interface FlowRateInputProps extends FieldProps {
  defaultFlowRate?: number | null
  flowRateType: 'aspirate' | 'dispense' | 'blowout'
  label?: string | null
  minFlowRate: number
  maxFlowRate: number
  pipetteDisplayName?: string | null
  className?: string
}

interface State {
  isPristine: boolean
  modalFlowRate?: string | null
  modalUseDefault: boolean
  showModal: boolean
}

export const FlowRateInput = (props: FlowRateInputProps): JSX.Element => {
  const {
    className,
    defaultFlowRate,
    disabled,
    flowRateType,
    isIndeterminate,
    label,
    maxFlowRate,
    minFlowRate,
    name,
    pipetteDisplayName,
    tooltipContent,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation(['form', 'application', 'shared'])
  const DEFAULT_LABEL = t('step_edit_form.field.flow_rate.label')

  const initialState: State = {
    isPristine: true,
    modalFlowRate: props.value ? String(props.value) : null,
    modalUseDefault: !props.value && !isIndeterminate,
    showModal: false,
  }

  const [isPristine, setIsPristine] = React.useState<State['isPristine']>(
    initialState.isPristine
  )

  const [modalFlowRate, setModalFlowRate] = React.useState<
    State['modalFlowRate']
  >(initialState.modalFlowRate)

  const [modalUseDefault, setModalUseDefault] = React.useState<
    State['modalUseDefault']
  >(initialState.modalUseDefault)

  const [showModal, setShowModal] = React.useState<State['showModal']>(
    initialState.showModal
  )

  const resetModalState = (): void => {
    setShowModal(initialState.showModal)
    setModalFlowRate(initialState.modalFlowRate)
    setModalUseDefault(initialState.modalUseDefault)
    setIsPristine(initialState.isPristine)
  }

  const cancelModal = resetModalState

  const openModal = (): void => {
    setShowModal(true)
  }

  const makeSaveModal = (allowSave: boolean) => (): void => {
    setIsPristine(false)

    if (allowSave) {
      const newFlowRate = modalUseDefault ? null : Number(modalFlowRate)
      props.updateValue(newFlowRate)
      resetModalState()
    }
  }

  const handleChangeRadio = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setModalUseDefault(e.target.value !== 'custom')
  }

  const handleChangeNumber = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    if (value === '' || value === '.' || !Number.isNaN(Number(value))) {
      setModalFlowRate(value)
      setModalUseDefault(false)
    }
  }

  const modalFlowRateNum = Number(modalFlowRate)

  // show 0.1 not 0 as minimum, since bottom of range is non-inclusive
  const displayMinFlowRate = minFlowRate || Math.pow(10, -DECIMALS_ALLOWED)
  const rangeDescription = t('step_edit_form.field.flow_rate.range', {
    min: displayMinFlowRate,
    max: maxFlowRate,
  })
  const outOfBounds =
    modalFlowRateNum === 0 ||
    minFlowRate > modalFlowRateNum ||
    modalFlowRateNum > maxFlowRate
  const correctDecimals =
    round(modalFlowRateNum, DECIMALS_ALLOWED) === modalFlowRateNum
  const allowSave = modalUseDefault || (!outOfBounds && correctDecimals)

  let errorMessage = null
  // validation only happens when "Custom" is selected, not "Default"
  // and pristinity only masks the outOfBounds error, not the correctDecimals error
  if (!modalUseDefault) {
    if (!Number.isNaN(modalFlowRateNum) && !correctDecimals) {
      errorMessage = t('step_edit_form.field.flow_rate.error_decimals', {
        decimals: `${DECIMALS_ALLOWED}`,
      })
    } else if (!isPristine && outOfBounds) {
      errorMessage = t('step_edit_form.field.flow_rate.error_out_of_bounds', {
        min: displayMinFlowRate,
        max: maxFlowRate,
      })
    }
  }

  const FlowRateInputField = (
    <InputField
      disabled={disabled}
      caption={rangeDescription}
      error={errorMessage}
      isIndeterminate={isIndeterminate && modalFlowRate === null}
      name={`${name}_customFlowRate`}
      onChange={handleChangeNumber}
      units={t('application:units.microliterPerSec')}
      value={`${modalFlowRate || ''}`}
    />
  )

  const FlowRateModal =
    pipetteDisplayName &&
    createPortal(
      <AlertModal
        alertOverlay
        className={modalStyles.modal}
        buttons={[
          {
            children: t('shared:cancel'),
            onClick: cancelModal,
          },
          {
            children: t('shared:done'),
            onClick: makeSaveModal(allowSave),
            disabled: isPristine ? false : !allowSave,
          },
        ]}
      >
        <h3 className={styles.header}>{DEFAULT_LABEL}</h3>

        <div className={styles.description}>
          {t('step_edit_form.field.flow_rate.default_text', {
            displayName: pipetteDisplayName,
          })}
        </div>

        <div className={styles.flow_rate_type_label}>
          {`${flowRateType} speed`}
        </div>

        <RadioGroup
          inline
          value={modalUseDefault ? 'default' : 'custom'}
          onChange={handleChangeRadio}
          options={[
            {
              name: `${defaultFlowRate || '?'} ${t(
                'application:units.microliterPerSec'
              )} (default)`,
              value: 'default',
            },
            {
              name: 'Custom',
              value: 'custom',
              children: FlowRateInputField,
            },
          ]}
        />
      </AlertModal>,
      getMainPagePortalEl()
    )

  return (
    <>
      {flowRateType === 'blowout' ? (
        <Flex {...targetProps}>
          <InputField
            className={className || stepFormStyles.small_field}
            disabled={disabled}
            isIndeterminate={isIndeterminate}
            name={name}
            onClick={openModal}
            readOnly
            units={t('application:units.microliterPerSec')}
            value={props.value ? String(props.value) : 'default'}
          />
          <Tooltip {...tooltipProps}>{tooltipContent}</Tooltip>
        </Flex>
      ) : (
        <FormGroup label={label || DEFAULT_LABEL} disabled={disabled}>
          <InputField
            className={className || stepFormStyles.small_field}
            disabled={disabled}
            isIndeterminate={isIndeterminate}
            name={name}
            onClick={openModal}
            readOnly
            units={t('application:units.microliterPerSec')}
            value={props.value ? String(props.value) : 'default'}
          />
        </FormGroup>
      )}

      {showModal && FlowRateModal}
    </>
  )
}
