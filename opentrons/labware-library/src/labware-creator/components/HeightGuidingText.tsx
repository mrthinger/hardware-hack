import * as React from 'react'
import type { LabwareType } from '../fields'

export const HeightGuidingText = (props: {
  labwareType: LabwareType | null | undefined
}): JSX.Element => {
  const { labwareType } = props
  const footer = (
    <p>
      The height measurement informs the robot of the top and bottom of your
      labware.
    </p>
  )
  if (labwareType === 'tubeRack') {
    return (
      <>
        <p>Place your tubes inside the rack.</p>
        <p>
          Reference{' '}
          <strong>from the top of the tube to bottom of the rack.</strong>{' '}
          Include any tube lip. Exclude any cover or cap.
        </p>
        {footer}
      </>
    )
  }
  if (labwareType === 'aluminumBlock') {
    return (
      <>
        <p>Put your labware on top of the aluminum block.</p>
        <p>
          Reference{' '}
          <strong>
            from the top of your labware to the bottom of the block.
          </strong>{' '}
          Include any well or tube lip. Exclude any cover or cap.
        </p>
        {footer}
      </>
    )
  }
  if (labwareType === 'tipRack') {
    return (
      <>
        <p>
          Include the <strong>adapter and tops of the pipette tips</strong> in
          the measurement.
        </p>
        {footer}
      </>
    )
  }
  return (
    <>
      <p>Include any well lip in the measurement. Exclude any cover or cap.</p>
      {footer}
    </>
  )
}
