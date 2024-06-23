import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BaseDeck,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getSimplestDeckConfigForProtocol,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { LiquidsLabwareDetailsModal } from './LiquidsLabwareDetailsModal'
import { getWellFillFromLabwareId } from './utils'
import { getLabwareRenderInfo } from '../utils/getLabwareRenderInfo'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

interface SetupLiquidsMapProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLiquidsMap(
  props: SetupLiquidsMapProps
): JSX.Element | null {
  const { runId, protocolAnalysis } = props
  const [hoverLabwareId, setHoverLabwareId] = React.useState<string>('')
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = React.useState<
    string | null
  >(null)

  if (protocolAnalysis == null) return null

  const liquids = parseLiquidsInLoadOrder(
    protocolAnalysis.liquids != null ? protocolAnalysis.liquids : [],
    protocolAnalysis.commands ?? []
  )
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands ?? []
  )
  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)
  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolAnalysis.commands ?? []
  )
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckLayerBlocklist = getStandardDeckViewLayerBlockList(robotType)

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const modulesOnDeck = protocolModulesInfo.map(module => {
    const labwareInAdapterInMod =
      module.nestedLabwareId != null
        ? initialLoadedLabwareByAdapter[module.nestedLabwareId]
        : null
    //  only rendering the labware on top most layer so
    //  either the adapter or the labware are rendered but not both
    const topLabwareDefinition =
      labwareInAdapterInMod?.result?.definition ?? module.nestedLabwareDef
    const topLabwareId =
      labwareInAdapterInMod?.result?.labwareId ?? module.nestedLabwareId
    const topLabwareDisplayName =
      labwareInAdapterInMod?.params.displayName ??
      module.nestedLabwareDisplayName
    const nestedLabwareWellFill = getWellFillFromLabwareId(
      topLabwareId ?? '',
      liquids,
      labwareByLiquidId
    )
    const labwareHasLiquid = !isEmpty(nestedLabwareWellFill)

    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      innerProps:
        module.moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},

      nestedLabwareDef: topLabwareDefinition,
      nestedLabwareWellFill,
      moduleChildren:
        topLabwareDefinition != null && topLabwareId != null ? (
          <g
            onMouseEnter={() => {
              setHoverLabwareId(topLabwareId)
            }}
            onMouseLeave={() => {
              setHoverLabwareId('')
            }}
            onClick={() => {
              if (labwareHasLiquid) setLiquidDetailsLabwareId(topLabwareId)
            }}
            cursor={labwareHasLiquid ? 'pointer' : ''}
          >
            <LabwareInfoOverlay
              definition={topLabwareDefinition}
              hover={topLabwareId === hoverLabwareId && labwareHasLiquid}
              labwareHasLiquid={labwareHasLiquid}
              labwareId={topLabwareId}
              displayName={topLabwareDisplayName}
              runId={runId}
            />
          </g>
        ) : null,
    }
  })
  return (
    <Flex
      maxHeight="80vh"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={deckLayerBlocklist}
        robotType={robotType}
        labwareOnDeck={[]}
        modulesOnDeck={modulesOnDeck}
      >
        {map(
          labwareRenderInfo,
          ({ x, y, labwareDef, displayName }, labwareId) => {
            const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
            //  only rendering the labware on top most layer so
            //  either the adapter or the labware are rendered but not both
            const topLabwareDefinition =
              labwareInAdapter?.result?.definition ?? labwareDef
            const topLabwareId =
              labwareInAdapter?.result?.labwareId ?? labwareId
            const topLabwareDisplayName =
              labwareInAdapter?.params.displayName ?? displayName
            const wellFill = getWellFillFromLabwareId(
              topLabwareId ?? '',
              liquids,
              labwareByLiquidId
            )
            const labwareHasLiquid = !isEmpty(wellFill)
            return (
              <React.Fragment
                key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
              >
                <g
                  transform={`translate(${x},${y})`}
                  onMouseEnter={() => {
                    setHoverLabwareId(topLabwareId)
                  }}
                  onMouseLeave={() => {
                    setHoverLabwareId('')
                  }}
                  onClick={() => {
                    if (labwareHasLiquid)
                      setLiquidDetailsLabwareId(topLabwareId)
                  }}
                  cursor={labwareHasLiquid ? 'pointer' : ''}
                >
                  <LabwareRender
                    definition={topLabwareDefinition}
                    wellFill={labwareHasLiquid ? wellFill : undefined}
                    highlight={labwareId === hoverLabwareId && labwareHasLiquid}
                  />
                  <LabwareInfoOverlay
                    definition={topLabwareDefinition}
                    labwareId={topLabwareId}
                    displayName={topLabwareDisplayName}
                    runId={runId}
                    hover={labwareId === hoverLabwareId && labwareHasLiquid}
                    labwareHasLiquid={labwareHasLiquid}
                  />
                </g>
              </React.Fragment>
            )
          }
        )}
      </BaseDeck>
      {liquidDetailsLabwareId != null && (
        <LiquidsLabwareDetailsModal
          labwareId={liquidDetailsLabwareId}
          runId={runId}
          closeModal={() => {
            setLiquidDetailsLabwareId(null)
          }}
        />
      )}
    </Flex>
  )
}
