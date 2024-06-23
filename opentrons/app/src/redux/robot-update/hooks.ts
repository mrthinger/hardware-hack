import { useDispatch } from 'react-redux'
import { startRobotUpdate, clearRobotUpdateSession } from './actions'
import type { Dispatch } from '../types'

type DispatchStartRobotUpdate = (
  robotName: string,
  systemFile?: string | undefined
) => void

// Safely start a robot update.
export function useDispatchStartRobotUpdate(): DispatchStartRobotUpdate {
  const dispatch = useDispatch<Dispatch>()

  function dispatchStartRobotUpdate(
    robotName: string,
    systemFile?: string
  ): void {
    dispatch(clearRobotUpdateSession())
    dispatch(startRobotUpdate(robotName, systemFile))
  }

  return dispatchStartRobotUpdate
}
