import { describe, it, expect, vi, afterEach } from 'vitest'
import { thermocyclerStateDiff as actualThermocyclerStateDiff } from '../utils/thermocyclerStateDiff'
import { thermocyclerStateStep } from '../commandCreators/compound/thermocyclerStateStep'
import { getStateAndContextTempTCModules, getSuccessResult } from '../fixtures'

import type { Diff } from '../utils/thermocyclerStateDiff'
import type { CreateCommand } from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  ThermocyclerStateStepArgs,
} from '../types'

vi.mock('../utils/thermocyclerStateDiff')

const getInitialDiff = (): Diff => ({
  lidOpen: false,
  lidClosed: false,
  setBlockTemperature: false,
  deactivateBlockTemperature: false,
  setLidTemperature: false,
  deactivateLidTemperature: false,
})

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'
describe('thermocyclerStateStep', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  const testCases: Array<{
    expected: CreateCommand[]
    invariantContext: InvariantContext
    robotState: RobotState
    testMsg: string
    thermocyclerStateArgs: ThermocyclerStateStepArgs
    thermocyclerStateDiff: Diff
  }> = [
    {
      testMsg: 'should open the lid when diff includes lidOpen',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: true,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: { ...getInitialDiff(), lidOpen: true },
      expected: [
        {
          commandType: 'thermocycler/openLid',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg: 'should close the lid when diff includes lidClosed',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: { ...getInitialDiff(), lidClosed: true },
      expected: [
        {
          commandType: 'thermocycler/closeLid',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should set the block temperature when diff includes setBlockTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 10,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: { ...getInitialDiff(), setBlockTemperature: true },
      expected: [
        {
          commandType: 'thermocycler/setTargetBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
            celsius: 10,
          },
        },
        {
          commandType: 'thermocycler/waitForBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should decativate the block when diff includes deactivateBlockTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        deactivateBlockTemperature: true,
      },
      expected: [
        {
          commandType: 'thermocycler/deactivateBlock',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should set the lid temperature when diff includes setLidTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 10,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: { ...getInitialDiff(), setLidTemperature: true },
      expected: [
        {
          commandType: 'thermocycler/setTargetLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
            celsius: 10,
          },
        },
        {
          commandType: 'thermocycler/waitForLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should decativate the block when diff includes deactivateBlockTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        deactivateBlockTemperature: true,
      },
      expected: [
        {
          commandType: 'thermocycler/deactivateBlock',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should set the lid temperature when diff includes setLidTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 10,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: { ...getInitialDiff(), setLidTemperature: true },
      expected: [
        {
          commandType: 'thermocycler/setTargetLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
            celsius: 10,
          },
        },
        {
          commandType: 'thermocycler/waitForLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should deactivate the lid when diff includes deactivateLidTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        deactivateLidTemperature: true,
      },
      expected: [
        {
          commandType: 'thermocycler/deactivateLid',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg: 'should issue commands in the correct order',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 10,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        lidOpen: true,
        lidClosed: true,
        setBlockTemperature: true,
        deactivateBlockTemperature: true,
        setLidTemperature: true,
        deactivateLidTemperature: true,
      },
      expected: [
        {
          commandType: 'thermocycler/openLid',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
        {
          commandType: 'thermocycler/closeLid',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
        {
          commandType: 'thermocycler/deactivateBlock',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
        {
          commandType: 'thermocycler/setTargetBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
            celsius: 10,
          },
        },
        {
          commandType: 'thermocycler/waitForBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
        {
          commandType: 'thermocycler/setTargetLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
            celsius: 20,
          },
        },
        {
          commandType: 'thermocycler/waitForLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: thermocyclerId,
          },
        },
      ],
    },
  ]
  testCases.forEach(
    ({
      testMsg,
      thermocyclerStateArgs,
      robotState,
      invariantContext,
      thermocyclerStateDiff,
      expected,
    }) => {
      it(testMsg, () => {
        vi.mocked(actualThermocyclerStateDiff).mockImplementationOnce(
          (state: any, args: any) => {
            expect(state).toEqual(
              robotState.modules[thermocyclerId].moduleState
            )
            expect(args).toEqual(thermocyclerStateArgs)
            return thermocyclerStateDiff
          }
        )
        const result = thermocyclerStateStep(
          thermocyclerStateArgs,
          invariantContext,
          robotState
        )
        const { commands } = getSuccessResult(result)
        expect(commands).toEqual(expected)
      })
    }
  )
})
