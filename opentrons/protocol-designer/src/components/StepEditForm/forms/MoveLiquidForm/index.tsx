import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { getPipetteEntities } from '../../../../step-forms/selectors'
import {
  VolumeField,
  PipetteField,
  ChangeTipField,
  DisposalVolumeField,
  PathField,
} from '../../fields'
import { TiprackField } from '../../fields/TiprackField'
import { Configure96ChannelField } from '../../fields/Configure96ChannelField'
import { DropTipField } from '../../fields/DropTipField'
import styles from '../../StepEditForm.module.css'
import { SourceDestFields } from './SourceDestFields'
import { SourceDestHeaders } from './SourceDestHeaders'
import type { StepFormProps } from '../../types'

// TODO: BC 2019-01-25 instead of passing path from here, put it in connect fields where needed
// or question if it even needs path

export const MoveLiquidForm = (props: StepFormProps): JSX.Element => {
  const [collapsed, _setCollapsed] = React.useState<boolean>(true)
  const pipettes = useSelector(getPipetteEntities)
  const { t } = useTranslation(['application', 'form'])
  const toggleCollapsed = (): void => {
    _setCollapsed(!collapsed)
  }

  const { propsForFields, formData } = props
  const { stepType, path } = formData
  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('stepType.moveLiquid')}
        </span>
      </div>
      <div className={styles.form_row}>
        <PipetteField {...propsForFields.pipette} />
        <TiprackField
          {...propsForFields.tipRack}
          pipetteId={propsForFields.pipette.value}
        />
        {is96Channel ? (
          <Configure96ChannelField {...propsForFields.nozzles} />
        ) : null}
        <VolumeField
          {...propsForFields.volume}
          label={t('form:step_edit_form.field.volume.label')}
          stepType={stepType}
          className={styles.large_field}
        />
      </div>

      <div className={styles.section_wrapper}>
        <SourceDestHeaders
          className={styles.section_column}
          collapsed={collapsed}
          formData={formData}
          prefix="aspirate"
          propsForFields={propsForFields}
          toggleCollapsed={toggleCollapsed}
        />
        <SourceDestHeaders
          className={styles.section_column}
          collapsed={collapsed}
          formData={formData}
          prefix="dispense"
          propsForFields={propsForFields}
          toggleCollapsed={toggleCollapsed}
        />
      </div>

      {!collapsed && (
        <div
          className={cx(styles.section_wrapper, styles.advanced_settings_panel)}
        >
          <SourceDestFields
            className={styles.section_column}
            prefix="aspirate"
            propsForFields={propsForFields}
            formData={formData}
          />
          <SourceDestFields
            className={styles.section_column}
            prefix="dispense"
            propsForFields={propsForFields}
            formData={formData}
          />
        </div>
      )}

      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('form:step_edit_form.section.sterility&motion')}
        </span>
      </div>
      <div className={styles.section_wrapper}>
        <div className={cx(styles.form_row, styles.section_column)}>
          <ChangeTipField
            {...propsForFields.changeTip}
            aspirateWells={formData.aspirate_wells}
            dispenseWells={formData.dispense_wells}
            path={formData.path}
            stepType={formData.stepType}
          />
          <PathField
            {...propsForFields.path}
            aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
            aspirate_airGap_volume={formData.aspirate_airGap_volume}
            aspirate_wells={formData.aspirate_wells}
            changeTip={formData.changeTip}
            dispense_wells={formData.dispense_wells}
            pipette={formData.pipette}
            volume={formData.volume}
            tipRack={formData.tipRack}
          />
        </div>
        <div className={cx(styles.section_column, styles.disposal_vol_wrapper)}>
          {path === 'multiDispense' && (
            <DisposalVolumeField
              aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
              aspirate_airGap_volume={formData.aspirate_airGap_volume}
              path={formData.path}
              pipette={formData.pipette}
              propsForFields={propsForFields}
              stepType={formData.stepType}
              volume={formData.volume}
            />
          )}
        </div>
      </div>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('form:step_edit_form.section.dropTip')}
        </span>
      </div>
      <div className={cx(styles.form_row, styles.section_column)}>
        <DropTipField {...propsForFields.dropTip_location} />
      </div>
    </div>
  )
}
