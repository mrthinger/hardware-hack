import { describe, it, expect } from 'vitest'
import { getLabwareInfoByLiquidId } from '../getLabwareInfoByLiquidId'
import type { RunTimeCommand } from '@opentrons/shared-data'

const mockLoadLiquidRunTimeCommands = [
  {
    id: '97ba49a5-04f6-4f91-986a-04a0eb632882',
    createdAt: '2022-09-07T19:47:42.781065+00:00',
    commandType: 'loadPipette',
    key: '0feeecaf-3895-46d7-ab71-564601265e35',
    status: 'succeeded',
    params: {
      pipetteName: 'p20_single_gen2',
      mount: 'left',
      pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
    },
    result: {
      pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
    },
    startedAt: '2022-09-07T19:47:42.782665+00:00',
    completedAt: '2022-09-07T19:47:42.785061+00:00',
  },
  {
    id: '846e0b7b-1e54-4f42-9ab1-964ebda45da5',
    createdAt: '2022-09-07T19:47:42.781281+00:00',
    commandType: 'loadLiquid',
    key: '1870d1a2-8dcd-46f2-9e27-16578365913b',
    status: 'succeeded',
    params: {
      liquidId: '1',
      labwareId: 'mockLabwareId1',
      volumeByWell: {
        A2: 20,
        B2: 20,
        C2: 20,
        D2: 20,
        E2: 20,
        F2: 20,
        G2: 20,
        H2: 20,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.785987+00:00',
    completedAt: '2022-09-07T19:47:42.786087+00:00',
  },
  {
    id: '1e03ae10-7e9b-465c-bc72-21ab5706bfb0',
    createdAt: '2022-09-07T19:47:42.781323+00:00',
    commandType: 'loadLiquid',
    key: '48df9766-04ff-4927-9f2d-4efdcf0b3df8',
    status: 'succeeded',
    params: {
      liquidId: '1',
      labwareId: 'mockLabwareId2',
      volumeByWell: {
        D3: 40,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.786212+00:00',
    completedAt: '2022-09-07T19:47:42.786285+00:00',
  },
  {
    id: '1e03ae10-7e9b-465c-bc72-21ab5706bfb0',
    createdAt: '2022-09-07T19:47:42.781323+00:00',
    commandType: 'loadLiquid',
    key: '48df9766-04ff-4927-9f2d-4efdcf0b3df8',
    status: 'succeeded',
    params: {
      liquidId: '1',
      labwareId: 'mockLabwareId2',
      volumeByWell: {
        A3: 33,
        B3: 33,
        C3: 33,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.786212+00:00',
    completedAt: '2022-09-07T19:47:42.786285+00:00',
  },
  {
    id: 'e8596bb3-b650-4d62-9bb5-dfc6e9e63249',
    createdAt: '2022-09-07T19:47:42.781363+00:00',
    commandType: 'loadLiquid',
    key: '69d19b03-fdcc-4964-a2f8-3cbb30f4ddf3',
    status: 'succeeded',
    params: {
      liquidId: '0',
      labwareId: 'mockLabwareId1',
      volumeByWell: {
        A1: 33,
        B1: 33,
        C1: 33,
        D1: 33,
        E1: 33,
        F1: 33,
        G1: 33,
        H1: 33,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.786347+00:00',
    completedAt: '2022-09-07T19:47:42.786412+00:00',
  },
]

describe('getLabwareInfoByLiquidId', () => {
  it('returns labware info by liquid id', () => {
    const expected = {
      '0': [
        {
          labwareId: 'mockLabwareId1',
          volumeByWell: {
            A1: 33,
            B1: 33,
            C1: 33,
            D1: 33,
            E1: 33,
            F1: 33,
            G1: 33,
            H1: 33,
          },
        },
      ],
      '1': [
        {
          labwareId: 'mockLabwareId1',
          volumeByWell: {
            A2: 20,
            B2: 20,
            C2: 20,
            D2: 20,
            E2: 20,
            F2: 20,
            G2: 20,
            H2: 20,
          },
        },
        {
          labwareId: 'mockLabwareId2',
          volumeByWell: {
            A3: 33,
            B3: 33,
            C3: 33,
            D3: 40,
          },
        },
      ],
    }
    expect(
      getLabwareInfoByLiquidId(
        mockLoadLiquidRunTimeCommands as RunTimeCommand[]
      )
    ).toEqual(expected)
  })
})
