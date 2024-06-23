import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import type { FormikTouched } from 'formik'
import type { LabwareFields } from '../../fields'

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const TipFitAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  if (touched.handPlacedTipFit && values.handPlacedTipFit === 'snug') {
    return (
      <AlertItem
        type="info"
        title="If your tip seems to fit when placed by hand it may work on the OT-2.  Proceed through the form to generate a definition. Once you have a definition you can check performance on the robot. "
      />
    )
  }
  return null
}
