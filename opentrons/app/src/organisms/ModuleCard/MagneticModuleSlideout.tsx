import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT,
  MAGNETIC_MODULES_MAX_ENGAGE_HEIGHT,
  MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
  MM,
} from '@opentrons/shared-data'

import { Slideout } from '../../atoms/Slideout'
import { InputField } from '../../atoms/InputField'
import { SubmitPrimaryButton } from '../../atoms/buttons'

import type { MagneticModule } from '../../redux/modules/types'
import type {
  MagneticModuleEngageMagnetCreateCommand,
  MagneticModuleModel,
} from '@opentrons/shared-data'

interface ModelContents {
  version: string
  units: string
  maxHeight: number
  labwareBottomHeight: number
  disengagedHeight: number
}

const getInfoByModel = (model: MagneticModuleModel): ModelContents => {
  if (model === MAGNETIC_MODULE_V1) {
    return {
      version: 'GEN 1',
      units: MM,
      maxHeight: MAGNETIC_MODULES_MAX_ENGAGE_HEIGHT,
      labwareBottomHeight: MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
      disengagedHeight: MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT,
    }
  } else {
    return {
      version: 'GEN 2',
      units: MM,
      maxHeight: MAGNETIC_MODULES_MAX_ENGAGE_HEIGHT,
      labwareBottomHeight: MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
      disengagedHeight: MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
    }
  }
}
interface MagneticModuleSlideoutProps {
  module: MagneticModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const MagneticModuleSlideout = (
  props: MagneticModuleSlideoutProps
): JSX.Element | null => {
  const { module, isExpanded, onCloseClick } = props
  const { t } = useTranslation('device_details')
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const [engageHeightValue, setEngageHeightValue] = React.useState<
    string | null
  >(null)

  const moduleName = getModuleDisplayName(module.moduleModel)
  const info = getInfoByModel(module.moduleModel)

  let max: string = '0'
  let labwareBottom: string = '0'
  let disengageHeight: string = '0'

  switch (info.version) {
    case 'GEN 1': {
      max = t('num_units', { num: info.maxHeight })
      labwareBottom = t('num_units', { num: info.labwareBottomHeight })
      disengageHeight = t('num_units', { num: info.disengagedHeight })
      break
    }
    case 'GEN 2': {
      max = t('num_units', { num: info.maxHeight })
      labwareBottom = t('num_units', { num: info.labwareBottomHeight })
      disengageHeight = t('num_units', { num: info.disengagedHeight })
    }
  }

  const errorMessage =
    engageHeightValue != null &&
    (parseInt(engageHeightValue) < info.disengagedHeight ||
      parseInt(engageHeightValue) > info.maxHeight)
      ? t('input_out_of_range')
      : null

  const handleSubmitHeight = (): void => {
    if (engageHeightValue != null) {
      const setEngageCommand: MagneticModuleEngageMagnetCreateCommand = {
        commandType: 'magneticModule/engage',
        params: {
          moduleId: module.id,
          height: parseInt(engageHeightValue),
        },
      }
      createLiveCommand({ command: setEngageCommand }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${setEngageCommand.commandType}: ${e.message}`
        )
      })
    }
    setEngageHeightValue(null)
    onCloseClick()
  }

  return (
    <Slideout
      title={t('set_engage_height_for_module', { name: moduleName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <SubmitPrimaryButton
          form="MagneticModuleSlideout_submitValue"
          value={t('confirm')}
          onClick={handleSubmitHeight}
          disabled={engageHeightValue == null || errorMessage !== null}
          data-testid={`MagneticModuleSlideout_btn_${module.serialNumber}`}
        />
      }
    >
      <LegacyStyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing4}
        data-testid={`MagneticModuleSlideout_body_text_${module.serialNumber}`}
      >
        {t('set_engage_height_and_enter_integer', {
          lower:
            module.moduleModel === MAGNETIC_MODULE_V1
              ? MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT
              : MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
          higher: MAGNETIC_MODULES_MAX_ENGAGE_HEIGHT,
        })}
      </LegacyStyledText>
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSizeH6}
        color={COLORS.grey50}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        paddingTop={SPACING.spacing16}
        textTransform={TYPOGRAPHY.textTransformUppercase}
        paddingBottom={SPACING.spacing8}
        data-testid={`MagneticModuleSlideout_body_subtitle_${module.serialNumber}`}
      >
        {t('height_ranges', { gen: info.version })}
      </LegacyStyledText>
      <Flex
        backgroundColor={COLORS.grey20}
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        padding={SPACING.spacing16}
        borderRadius={BORDERS.borderRadius4}
        data-testid={`MagneticModuleSlideout_body_data_${module.serialNumber}`}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          data-testid={`MagneticModuleSlideout_body_data_text_${module.serialNumber}`}
        >
          <LegacyStyledText paddingBottom={SPACING.spacing8}>
            {t('max_engage_height')}
          </LegacyStyledText>
          <LegacyStyledText paddingBottom={SPACING.spacing8}>
            {t('labware_bottom')}
          </LegacyStyledText>
          <LegacyStyledText>{t('disengaged')}</LegacyStyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_END}
          data-testid={`MagneticModuleSlideout_body_data_num_${module.serialNumber}`}
        >
          <LegacyStyledText
            paddingLeft={SPACING.spacing8}
            paddingBottom={SPACING.spacing8}
          >
            {max}
          </LegacyStyledText>
          <LegacyStyledText
            paddingLeft={SPACING.spacing16}
            paddingBottom={SPACING.spacing8}
          >
            {labwareBottom}
          </LegacyStyledText>
          <LegacyStyledText>{disengageHeight}</LegacyStyledText>
        </Flex>
      </Flex>
      <Flex
        marginTop={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`MagneticModuleSlideout_input_field_${module.serialNumber}`}
      >
        <LegacyStyledText
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.grey50}
          paddingBottom={SPACING.spacing8}
        >
          {t('set_engage_height')}
        </LegacyStyledText>
        <form id="MagneticModuleSlideout_submitValue">
          <InputField
            data-testid={`${String(module.moduleModel)}`}
            id={`${String(module.moduleModel)}`}
            units={info.units}
            value={engageHeightValue}
            autoFocus
            onChange={e => {
              setEngageHeightValue(e.target.value)
            }}
            type="number"
            caption={t('module_status_range', {
              min: info.disengagedHeight,
              max: info.maxHeight,
              unit: info.units,
            })}
            error={errorMessage}
          />
        </form>
      </Flex>
    </Slideout>
  )
}
