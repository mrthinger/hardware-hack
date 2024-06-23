import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  LabwareRender,
  LocationIcon,
  MODULE_ICON_NAME_BY_TYPE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getLabwareDefURI,
  getLabwareDisplayName,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'
import {
  useCreateLiveCommandMutation,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { FloatingActionButton } from '../../atoms/buttons'
import { ODDBackButton } from '../../molecules/ODDBackButton'
import { getTopPortalEl } from '../../App/portal'
import { Modal } from '../../molecules/Modal'

import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getLabwareSetupItemGroups } from '../../pages/Protocols/utils'
import { getProtocolModulesInfo } from '../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { getAttachedProtocolModuleMatches } from '../ProtocolSetupModulesAndDeck/utils'
import { getNestedLabwareInfo } from '../Devices/ProtocolRun/SetupLabware/getNestedLabwareInfo'
import { LabwareMapViewModal } from './LabwareMapViewModal'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import type { UseQueryResult } from 'react-query'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  LabwareDefinition2,
  LabwareLocation,
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HeaterShakerModule, Modules } from '@opentrons/api-client'
import type { LabwareSetupItem } from '../../pages/Protocols/utils'
import type { SetupScreens } from '../../pages/ProtocolSetup'
import type { NestedLabwareInfo } from '../Devices/ProtocolRun/SetupLabware/getNestedLabwareInfo'
import type { AttachedProtocolModuleMatch } from '../ProtocolSetupModulesAndDeck/utils'

const MODULE_REFETCH_INTERVAL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 12rem;
  flex-shrink: 0;
`

export interface ProtocolSetupLabwareProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupLabware({
  runId,
  setSetupScreen,
}: ProtocolSetupLabwareProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [showDeckMapModal, setShowDeckMapModal] = React.useState<boolean>(false)
  const [
    showLabwareDetailsModal,
    setShowLabwareDetailsModal,
  ] = React.useState<boolean>(false)
  const [selectedLabware, setSelectedLabware] = React.useState<
    | (LabwareDefinition2 & {
        location: LabwareLocation
        nickName: string | null
      })
    | null
  >(null)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_POLL_MS,
  })
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(
    mostRecentAnalysis?.commands ?? []
  )
  const moduleQuery = useModulesQuery({
    refetchInterval: MODULE_REFETCH_INTERVAL_MS,
  })
  const attachedModules = moduleQuery?.data?.data ?? []
  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo,
    deckConfig
  )
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    mostRecentAnalysis?.commands ?? []
  )

  const handleLabwareClick = (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ): void => {
    const foundLabware = mostRecentAnalysis?.labware.find(
      labware => labware.id === labwareId
    )
    if (foundLabware != null) {
      const nickName = onDeckItems.find(
        item => getLabwareDefURI(item.definition) === foundLabware.definitionUri
      )?.nickName
      setSelectedLabware({
        ...labwareDef,
        location: foundLabware.location,
        nickName: nickName ?? null,
      })
      setShowLabwareDetailsModal(true)
    }
  }

  let location: JSX.Element | string | null = null
  if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'slotName' in selectedLabware?.location
  ) {
    location = <LocationIcon slotName={selectedLabware?.location.slotName} />
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'addressableAreaName' in selectedLabware?.location
  ) {
    location = (
      <LocationIcon slotName={selectedLabware?.location.addressableAreaName} />
    )
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'moduleId' in selectedLabware?.location
  ) {
    const matchedModule = attachedProtocolModuleMatches.find(
      module =>
        typeof selectedLabware.location === 'object' &&
        'moduleId' in selectedLabware?.location &&
        module.moduleId === selectedLabware.location.moduleId
    )
    if (matchedModule != null) {
      location = (
        <>
          <LocationIcon slotName={matchedModule?.slotName} />
          <LocationIcon
            iconName={
              MODULE_ICON_NAME_BY_TYPE[matchedModule?.moduleDef.moduleType]
            }
          />
        </>
      )
    }
  } else if (
    selectedLabware != null &&
    typeof selectedLabware.location === 'object' &&
    'labwareId' in selectedLabware?.location
  ) {
    const adapterId = selectedLabware.location.labwareId
    const adapterLocation = mostRecentAnalysis?.commands.find(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware' &&
        command.result?.labwareId === adapterId
    )?.params.location
    if (adapterLocation != null && adapterLocation !== 'offDeck') {
      if ('slotName' in adapterLocation) {
        location = <LocationIcon slotName={adapterLocation.slotName} />
      } else if ('moduleId' in adapterLocation) {
        const moduleUnderAdapter = attachedProtocolModuleMatches.find(
          module => module.moduleId === adapterLocation.moduleId
        )
        if (moduleUnderAdapter != null) {
          location = (
            <>
              <LocationIcon slotName={moduleUnderAdapter.slotName} />
              <LocationIcon
                iconName={
                  MODULE_ICON_NAME_BY_TYPE[
                    moduleUnderAdapter.moduleDef.moduleType
                  ]
                }
              />
            </>
          )
        }
      }
    }
  }
  const selectedLabwareLocation = selectedLabware?.location
  return (
    <>
      {createPortal(
        <>
          {showDeckMapModal ? (
            <LabwareMapViewModal
              mostRecentAnalysis={mostRecentAnalysis}
              deckDef={deckDef}
              attachedProtocolModuleMatches={attachedProtocolModuleMatches}
              handleLabwareClick={handleLabwareClick}
              onCloseClick={() => {
                setShowDeckMapModal(false)
              }}
              initialLoadedLabwareByAdapter={initialLoadedLabwareByAdapter}
            />
          ) : null}
          {showLabwareDetailsModal && selectedLabware != null ? (
            <Modal
              onOutsideClick={() => {
                setShowLabwareDetailsModal(false)
                setSelectedLabware(null)
              }}
            >
              <Flex alignItems={ALIGN_STRETCH} gridGap={SPACING.spacing48}>
                <LabwareThumbnail
                  viewBox={`${selectedLabware.cornerOffsetFromSlot.x} ${selectedLabware.cornerOffsetFromSlot.y} ${selectedLabware.dimensions.xDimension} ${selectedLabware.dimensions.yDimension}`}
                >
                  <LabwareRender definition={selectedLabware} />
                </LabwareThumbnail>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  alignItems={ALIGN_FLEX_START}
                  gridGap={SPACING.spacing12}
                >
                  <Flex gridGap={SPACING.spacing4}>{location}</Flex>
                  <LegacyStyledText
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    fontSize={TYPOGRAPHY.fontSize22}
                  >
                    {getLabwareDisplayName(selectedLabware)}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey60}>
                    {selectedLabware.nickName}
                    {selectedLabwareLocation != null &&
                    selectedLabwareLocation !== 'offDeck' &&
                    'labwareId' in selectedLabwareLocation
                      ? t('on_adapter', {
                          adapterName: mostRecentAnalysis?.labware.find(
                            l => l.id === selectedLabwareLocation.labwareId
                          )?.displayName,
                        })
                      : null}
                  </LegacyStyledText>
                </Flex>
              </Flex>
            </Modal>
          ) : null}
        </>,
        getTopPortalEl()
      )}
      <ODDBackButton
        label={t('labware')}
        onClick={() => {
          setSetupScreen('prepare to run')
        }}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop={SPACING.spacing32}
      >
        <Flex
          gridGap={SPACING.spacing8}
          color={COLORS.grey60}
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight28}
        >
          <Flex paddingLeft={SPACING.spacing16} width="10.5625rem">
            <LegacyStyledText>{t('location')}</LegacyStyledText>
          </Flex>
          <Flex>
            <LegacyStyledText>{t('labware_name')}</LegacyStyledText>
          </Flex>
        </Flex>
        {[...onDeckItems, ...offDeckItems].map((labware, i) => {
          const labwareOnAdapter = onDeckItems.find(
            item =>
              labware.initialLocation !== 'offDeck' &&
              'labwareId' in labware.initialLocation &&
              item.labwareId === labware.initialLocation.labwareId
          )
          return mostRecentAnalysis != null && labwareOnAdapter == null ? (
            <RowLabware
              key={i}
              labware={labware}
              attachedProtocolModules={attachedProtocolModuleMatches}
              refetchModules={moduleQuery.refetch}
              commands={mostRecentAnalysis?.commands}
              nestedLabwareInfo={getNestedLabwareInfo(
                labware,
                mostRecentAnalysis.commands
              )}
            />
          ) : null
        })}
      </Flex>
      <FloatingActionButton
        onClick={() => {
          setShowDeckMapModal(true)
        }}
      />
    </>
  )
}

const labwareLatchStyles = css`
  &:active {
    background-color: ${COLORS.blue35};
  }
`

interface LabwareLatchProps {
  matchedHeaterShaker: HeaterShakerModule
  refetchModules: UseQueryResult<Modules>['refetch']
}

function LabwareLatch({
  matchedHeaterShaker,
  refetchModules,
}: LabwareLatchProps): JSX.Element {
  const { t } = useTranslation(['heater_shaker', 'protocol_setup'])
  const {
    createLiveCommand,
    isLoading: isLiveCommandLoading,
  } = useCreateLiveCommandMutation()
  const [isRefetchingModules, setIsRefetchingModules] = React.useState(false)
  const isLatchLoading =
    isLiveCommandLoading ||
    isRefetchingModules ||
    matchedHeaterShaker.data.labwareLatchStatus === 'opening' ||
    matchedHeaterShaker.data.labwareLatchStatus === 'closing'
  const isLatchClosed =
    matchedHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
    matchedHeaterShaker.data.labwareLatchStatus === 'opening'

  let icon: 'latch-open' | 'latch-closed' | null = null

  const latchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand = {
    commandType: isLatchClosed
      ? 'heaterShaker/openLabwareLatch'
      : 'heaterShaker/closeLabwareLatch',
    params: { moduleId: matchedHeaterShaker.id },
  }

  const toggleLatch = (): void => {
    createLiveCommand({
      command: latchCommand,
      waitUntilComplete: true,
    })
      .then(() => {
        setIsRefetchingModules(true)
        refetchModules()
          .then(() => {
            setIsRefetchingModules(false)
          })
          .catch((e: Error) => {
            console.error(
              `error refetching modules after toggle latch: ${e.message}`
            )
            setIsRefetchingModules(false)
          })
      })
      .catch((e: Error) => {
        console.error(
          `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
        )
      })
  }
  const commandType = isLatchClosed
    ? 'heaterShaker/openLabwareLatch'
    : 'heaterShaker/closeLabwareLatch'
  let hsLatchText: string | null = t('open')
  if (commandType === 'heaterShaker/closeLabwareLatch' && isLatchLoading) {
    hsLatchText = t('closing')
    icon = 'latch-open'
  } else if (
    commandType === 'heaterShaker/openLabwareLatch' &&
    isLatchLoading
  ) {
    hsLatchText = t('opening')
    icon = 'latch-closed'
  } else if (
    commandType === 'heaterShaker/closeLabwareLatch' &&
    !isLatchLoading
  ) {
    hsLatchText = t('open')
    icon = 'latch-open'
  } else if (
    commandType === 'heaterShaker/openLabwareLatch' &&
    !isLatchLoading
  ) {
    hsLatchText = t('closed')
    icon = 'latch-closed'
  }

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.blue35}
      borderRadius={BORDERS.borderRadius16}
      css={labwareLatchStyles}
      color={isLatchLoading ? COLORS.grey60 : COLORS.black90}
      height="6.5rem"
      alignSelf={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      fontSize={TYPOGRAPHY.fontSize22}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      lineHeight={TYPOGRAPHY.lineHeight28}
      minWidth="11.0625rem"
      onClick={toggleLatch}
      padding={SPACING.spacing12}
    >
      <LegacyStyledText fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('protocol_setup:labware_latch')}
      </LegacyStyledText>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        {hsLatchText != null && icon != null ? (
          <>
            <LegacyStyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
              {hsLatchText}
            </LegacyStyledText>
            <Icon
              name={icon}
              size="2.5rem"
              color={
                commandType === 'heaterShaker/closeLabwareLatch'
                  ? COLORS.blue50
                  : COLORS.black90
              }
            />
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}

interface RowLabwareProps {
  labware: LabwareSetupItem
  attachedProtocolModules: AttachedProtocolModuleMatch[]
  refetchModules: UseQueryResult<Modules>['refetch']
  nestedLabwareInfo: NestedLabwareInfo | null
  commands?: RunTimeCommand[]
}

function RowLabware({
  labware,
  attachedProtocolModules,
  refetchModules,
  nestedLabwareInfo,
  commands,
}: RowLabwareProps): JSX.Element | null {
  const { definition, initialLocation, nickName } = labware
  const { t } = useTranslation('protocol_command_text')

  const matchedModule =
    initialLocation !== 'offDeck' &&
    'moduleId' in initialLocation &&
    attachedProtocolModules.length > 0
      ? attachedProtocolModules.find(
          mod => mod.moduleId === initialLocation.moduleId
        )
      : null
  const matchingHeaterShaker =
    matchedModule?.attachedModuleMatch != null &&
    matchedModule.attachedModuleMatch.moduleType === HEATERSHAKER_MODULE_TYPE
      ? matchedModule.attachedModuleMatch
      : null

  const matchedModuleType = matchedModule?.attachedModuleMatch?.moduleType

  let slotName: string = ''
  let location: JSX.Element | string | null = null
  if (initialLocation === 'offDeck') {
    location = t('off_deck')
  } else if ('slotName' in initialLocation) {
    slotName = initialLocation.slotName
    location = <LocationIcon slotName={initialLocation.slotName} />
  } else if ('addressableAreaName' in initialLocation) {
    slotName = initialLocation.addressableAreaName
    location = <LocationIcon slotName={initialLocation.addressableAreaName} />
  } else if (matchedModuleType != null && matchedModule?.slotName != null) {
    slotName = matchedModule.slotName
    location = (
      <>
        <LocationIcon slotName={matchedModule?.slotName} />
        <LocationIcon iconName={MODULE_ICON_NAME_BY_TYPE[matchedModuleType]} />
      </>
    )
  } else if ('labwareId' in initialLocation) {
    const adapterId = initialLocation.labwareId
    const adapterLocation = commands?.find(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware' &&
        command.result?.labwareId === adapterId
    )?.params.location

    if (adapterLocation != null && adapterLocation !== 'offDeck') {
      if ('slotName' in adapterLocation) {
        slotName = adapterLocation.slotName
        location = <LocationIcon slotName={adapterLocation.slotName} />
      } else if ('moduleId' in adapterLocation) {
        const moduleUnderAdapter = attachedProtocolModules.find(
          module => module.moduleId === adapterLocation.moduleId
        )
        if (moduleUnderAdapter != null) {
          slotName = moduleUnderAdapter.slotName
          location = (
            <>
              <LocationIcon slotName={moduleUnderAdapter.slotName} />
              <LocationIcon
                iconName={
                  MODULE_ICON_NAME_BY_TYPE[
                    moduleUnderAdapter.moduleDef.moduleType
                  ]
                }
              />
            </>
          )
        }
      }
    }
  }
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      gridGap={SPACING.spacing32}
    >
      <Flex gridGap={SPACING.spacing4} width="7.6875rem">
        {location}
      </Flex>
      <Flex
        alignSelf={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flexDirection={DIRECTION_ROW}
        width="86%"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_EVENLY}
            gridGap={SPACING.spacing4}
          >
            <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {getLabwareDisplayName(definition)}
            </LegacyStyledText>
            <LegacyStyledText color={COLORS.grey60} as="p">
              {nickName}
            </LegacyStyledText>
          </Flex>
          {nestedLabwareInfo != null ? (
            <Box
              borderBottom={`1px solid ${COLORS.grey60}`}
              marginY={SPACING.spacing16}
              width="33rem"
            />
          ) : null}
          {nestedLabwareInfo != null &&
          nestedLabwareInfo?.sharedSlotId === slotName ? (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              <LegacyStyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {nestedLabwareInfo.nestedLabwareDisplayName}
              </LegacyStyledText>
              <LegacyStyledText as="p" color={COLORS.grey60}>
                {nestedLabwareInfo.nestedLabwareNickName}
              </LegacyStyledText>
            </Flex>
          ) : null}
        </Flex>
        {matchingHeaterShaker != null ? (
          <LabwareLatch
            matchedHeaterShaker={matchingHeaterShaker}
            refetchModules={refetchModules}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
