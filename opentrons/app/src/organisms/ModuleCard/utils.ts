import * as React from 'react'
import last from 'lodash/last'

import { useDispatchApiRequest } from '../../redux/robot-api'
import { updateModule } from '../../redux/modules'

import magneticModule from '../../assets/images/magnetic_module_gen_2_transparent.png'
import temperatureModule from '../../assets/images/temp_deck_gen_2_transparent.png'
import thermoModuleGen1Closed from '../../assets/images/thermocycler_closed.png'
import thermoModuleGen1Opened from '../../assets/images/thermocycler_open_transparent.png'
import heaterShakerModule from '../../assets/images/heater_shaker_module_transparent.png'
import thermoModuleGen2Closed from '../../assets/images/thermocycler_gen_2_closed.png'
import thermoModuleGen2Opened from '../../assets/images/thermocycler_gen_2_opened.png'

import type { AttachedModule } from '../../redux/modules/types'

export function getModuleCardImage(attachedModule: AttachedModule): string {
  //  TODO(jr, 9/22/22): add images for V1 of magneticModule and temperatureModule
  switch (attachedModule.moduleModel) {
    case 'magneticModuleV1':
    case 'magneticModuleV2':
      return magneticModule
    case 'temperatureModuleV1':
    case 'temperatureModuleV2':
      return temperatureModule
    case 'heaterShakerModuleV1':
      return heaterShakerModule
    case 'thermocyclerModuleV1':
      if (attachedModule.data.lidStatus === 'closed') {
        return thermoModuleGen1Closed
      } else {
        return thermoModuleGen1Opened
      }
    case 'thermocyclerModuleV2':
      if (attachedModule.data.lidStatus === 'closed') {
        return thermoModuleGen2Closed
      } else {
        return thermoModuleGen2Opened
      }
    //  this should never be reached
    default:
      return 'unknown module model, this is an error'
  }
}

type RequestIdsBySerialNumber = Record<string, string[]>
type HandleModuleApiRequestsType = (robotName: string, moduleId: string) => void
type GetLatestRequestIdType = (moduleId: string) => string | null

export function useModuleApiRequests(): [
  GetLatestRequestIdType,
  HandleModuleApiRequestsType
] {
  const [dispatchApiRequest] = useDispatchApiRequest()
  const [
    requestIdsBySerial,
    setRequestIdsBySerial,
  ] = React.useState<RequestIdsBySerialNumber>({})

  const handleModuleApiRequests = (
    robotName: string,
    serialNumber: string
  ): void => {
    const action = dispatchApiRequest(updateModule(robotName, serialNumber))
    const { requestId } = action.meta

    if (requestId != null) {
      if (serialNumber in requestIdsBySerial) {
        setRequestIdsBySerial((prevState: RequestIdsBySerialNumber) => {
          const existingRequestIds = prevState[serialNumber] || []
          return {
            ...prevState,
            [serialNumber]: [...existingRequestIds, requestId],
          }
        })
      } else {
        setRequestIdsBySerial(prevState => {
          return {
            ...prevState,
            [serialNumber]: [requestId],
          }
        })
      }
    }
  }

  const getLatestRequestId = React.useCallback(
    (serialNumber: string): string | null => {
      if (serialNumber in requestIdsBySerial) {
        return last(requestIdsBySerial[serialNumber]) ?? null
      } else {
        return null
      }
    },
    [requestIdsBySerial]
  )

  return [getLatestRequestId, handleModuleApiRequests]
}
