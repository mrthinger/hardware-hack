import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, TYPOGRAPHY, LegacyStyledText } from '@opentrons/components'
import { MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import { StatusLabel } from '../../atoms/StatusLabel'
import type { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'
import type { MagneticStatus } from '../../redux/modules/api-types'

interface MagModuleProps {
  moduleStatus: MagneticStatus
  moduleHeight: number
  moduleModel: typeof MAGNETIC_MODULE_V1 | typeof MAGNETIC_MODULE_V2
}

export const MagneticModuleData = (
  props: MagModuleProps
): JSX.Element | null => {
  const { moduleStatus, moduleHeight, moduleModel } = props
  const { t } = useTranslation('device_details')

  return (
    <>
      <StatusLabel
        status={moduleStatus}
        backgroundColor={COLORS.blue30}
        iconColor={COLORS.blue60}
        pulse={moduleStatus === 'engaged'}
      />
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSizeCaption}
        data-testid="mag_module_data"
      >
        {t(
          moduleModel === MAGNETIC_MODULE_V2
            ? 'magdeck_gen2_height'
            : 'magdeck_gen1_height',
          {
            height: moduleHeight,
          }
        )}
      </LegacyStyledText>
    </>
  )
}
