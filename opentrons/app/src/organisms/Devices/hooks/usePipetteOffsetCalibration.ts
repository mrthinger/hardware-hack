import React from 'react'
import { useSelector } from 'react-redux'

import {
  getCalibrationForPipette,
  fetchPipetteOffsetCalibrations,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import { useRobot } from '.'

import type { PipetteOffsetCalibration } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'
import type { AttachedPipette, Mount } from '../../../redux/pipettes/types'

export function usePipetteOffsetCalibration(
  robotName: string | null = null,
  pipetteId: AttachedPipette['id'] | null = null,
  mount: Mount
): PipetteOffsetCalibration | null {
  const [dispatchRequest] = useDispatchApiRequest()
  const robot = useRobot(robotName)

  const pipetteOffsetCalibration = useSelector((state: State) =>
    getCalibrationForPipette(
      state,
      robotName == null ? '' : robotName,
      pipetteId == null ? '' : pipetteId,
      mount
    )
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipetteOffsetCalibrations(robotName))
    }
  }, [dispatchRequest, robotName, robot?.status])

  return pipetteOffsetCalibration
}
