import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  SIZE_AUTO,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { ToggleButton } from '../../../../atoms/buttons'
import { SecureLabwareModal } from './SecureLabwareModal'

import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  RunTimeCommand,
  ModuleType,
  LabwareDefinition2,
  LoadModuleRunTimeCommand,
  LoadLabwareRunTimeCommand,
} from '@opentrons/shared-data'
import type { ModuleRenderInfoForProtocol } from '../../hooks'
import type { LabwareSetupItem } from '../../../../pages/Protocols/utils'
import type { ModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'
import type { NestedLabwareInfo } from './getNestedLabwareInfo'

const LabwareRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 6fr 5.9fr;
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing16};
`

interface LabwareListItemProps extends LabwareSetupItem {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
  isFlex: boolean
  commands: RunTimeCommand[]
  nestedLabwareInfo: NestedLabwareInfo | null
}

export function LabwareListItem(
  props: LabwareListItemProps
): JSX.Element | null {
  const {
    attachedModuleInfo,
    nickName,
    initialLocation,
    definition,
    moduleModel,
    moduleLocation,
    extraAttentionModules,
    isFlex,
    commands,
    nestedLabwareInfo,
  } = props
  const { t } = useTranslation('protocol_setup')
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleType | null>(null)
  const labwareDisplayName = getLabwareDisplayName(definition)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const [isLatchLoading, setIsLatchLoading] = React.useState<boolean>(false)
  const [isLatchClosed, setIsLatchClosed] = React.useState<boolean>(false)

  let slotInfo: string | null = null

  if (initialLocation !== 'offDeck' && 'slotName' in initialLocation) {
    slotInfo = initialLocation.slotName
  } else if (
    initialLocation !== 'offDeck' &&
    'addressableAreaName' in initialLocation
  ) {
    slotInfo = initialLocation.addressableAreaName
  }

  let moduleDisplayName: string | null = null
  let extraAttentionText: JSX.Element | null = null
  let isCorrectHeaterShakerAttached: boolean = false
  let isHeaterShakerInProtocol: boolean = false
  let latchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand

  if (initialLocation !== 'offDeck' && 'labwareId' in initialLocation) {
    const loadedAdapter = commands.find(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware' &&
        command.result?.labwareId === initialLocation.labwareId
    )
    const loadedAdapterLocation = loadedAdapter?.params.location

    if (loadedAdapterLocation != null && loadedAdapterLocation !== 'offDeck') {
      if ('slotName' in loadedAdapterLocation) {
        slotInfo = loadedAdapterLocation.slotName
      } else if ('moduleId' in loadedAdapterLocation) {
        const module = commands.find(
          (command): command is LoadModuleRunTimeCommand =>
            command.commandType === 'loadModule' &&
            command.result?.moduleId === loadedAdapterLocation.moduleId
        )
        if (module != null) {
          slotInfo = module.params.location.slotName
          moduleDisplayName = getModuleDisplayName(module.params.model)
        }
      }
    }
  }
  if (
    initialLocation !== 'offDeck' &&
    'moduleId' in initialLocation &&
    moduleLocation != null &&
    moduleModel != null
  ) {
    const moduleName = getModuleDisplayName(moduleModel)
    const moduleType = getModuleType(moduleModel)
    const moduleTypeNeedsAttention = extraAttentionModules.find(
      extraAttentionModType => extraAttentionModType === moduleType
    )
    let moduleSlotName = moduleLocation.slotName
    if (moduleType === THERMOCYCLER_MODULE_TYPE) {
      moduleSlotName = isFlex ? TC_MODULE_LOCATION_OT3 : TC_MODULE_LOCATION_OT2
    }
    slotInfo = moduleSlotName
    moduleDisplayName = moduleName
    switch (moduleTypeNeedsAttention) {
      case MAGNETIC_MODULE_TYPE:
      case THERMOCYCLER_MODULE_TYPE:
        if (moduleModel !== THERMOCYCLER_MODULE_V2) {
          extraAttentionText = (
            <Btn
              css={css`
                color: ${COLORS.grey50};

                &:hover {
                  color: ${COLORS.black90};
                }
              `}
              onClick={() => {
                setSecureLabwareModalType(moduleType)
              }}
            >
              <Flex flexDirection={DIRECTION_ROW}>
                <Icon
                  name="information"
                  size="0.75rem"
                  marginTop={SPACING.spacing4}
                />
                <LegacyStyledText
                  marginLeft={SPACING.spacing4}
                  as="p"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                >
                  {t('secure_labware_instructions')}
                </LegacyStyledText>
              </Flex>
            </Btn>
          )
        }
        break
      case HEATERSHAKER_MODULE_TYPE:
        isHeaterShakerInProtocol = true
        extraAttentionText = (
          <LegacyStyledText as="p" color={COLORS.grey50} maxWidth="15.25rem">
            {t('heater_shaker_labware_list_view')}
          </LegacyStyledText>
        )
        const matchingHeaterShaker =
          attachedModuleInfo != null &&
          attachedModuleInfo[initialLocation.moduleId] != null
            ? attachedModuleInfo[initialLocation.moduleId].attachedModuleMatch
            : null
        if (
          matchingHeaterShaker != null &&
          matchingHeaterShaker.moduleType === HEATERSHAKER_MODULE_TYPE
        ) {
          if (
            (!isLatchClosed &&
              (matchingHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
                matchingHeaterShaker.data.labwareLatchStatus === 'closing')) ||
            (isLatchClosed &&
              (matchingHeaterShaker.data.labwareLatchStatus === 'idle_open' ||
                matchingHeaterShaker.data.labwareLatchStatus === 'opening'))
          ) {
            setIsLatchClosed(
              matchingHeaterShaker.data.labwareLatchStatus === 'idle_closed' ||
                matchingHeaterShaker.data.labwareLatchStatus === 'closing'
            )
            setIsLatchLoading(false)
          }
          latchCommand = {
            commandType: isLatchClosed
              ? 'heaterShaker/openLabwareLatch'
              : 'heaterShaker/closeLabwareLatch',
            params: { moduleId: matchingHeaterShaker.id },
          }
          //  Labware latch button is disabled unless the correct H-S is attached
          //  this is for MoaM support
          isCorrectHeaterShakerAttached = true
        }
    }
  }
  const toggleLatch = (): void => {
    setIsLatchLoading(true)
    createLiveCommand({
      command: latchCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
      )
    })
  }
  const commandType = isLatchClosed
    ? 'heaterShaker/openLabwareLatch'
    : 'heaterShaker/closeLabwareLatch'
  let hsLatchText: string = t('secure')
  if (commandType === 'heaterShaker/closeLabwareLatch' && isLatchLoading) {
    hsLatchText = t('closing')
  } else if (
    commandType === 'heaterShaker/openLabwareLatch' &&
    isLatchLoading
  ) {
    hsLatchText = t('opening')
  }

  return (
    <LabwareRow>
      <Flex alignItems={ALIGN_CENTER}>
        <LegacyStyledText as="p" data-testid={`slot_info_${slotInfo}`}>
          {slotInfo}
        </LegacyStyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <Flex>
          <StandaloneLabware definition={definition} />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
            marginLeft={SPACING.spacing16}
            marginRight={SPACING.spacing24}
          >
            <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {labwareDisplayName}
            </LegacyStyledText>
            <LegacyStyledText as="p" color={COLORS.grey50}>
              {nickName}
            </LegacyStyledText>
          </Flex>
        </Flex>
        {nestedLabwareInfo != null &&
        nestedLabwareInfo?.sharedSlotId === slotInfo ? (
          <Flex>
            {nestedLabwareInfo.nestedLabwareDefinition != null ? (
              <StandaloneLabware
                definition={nestedLabwareInfo.nestedLabwareDefinition}
              />
            ) : null}
            <Flex
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_CENTER}
              marginLeft={SPACING.spacing16}
              marginRight={SPACING.spacing24}
            >
              <LegacyStyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {nestedLabwareInfo.nestedLabwareDisplayName}
              </LegacyStyledText>
              <LegacyStyledText as="p" color={COLORS.grey50}>
                {nestedLabwareInfo.nestedLabwareNickName}
              </LegacyStyledText>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
      >
        <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
          <LegacyStyledText as="p">
            {moduleDisplayName != null
              ? moduleDisplayName
              : t(initialLocation === 'offDeck' ? 'off_deck' : 'on_deck')}
          </LegacyStyledText>
          {extraAttentionText != null ? extraAttentionText : null}
        </Flex>

        {isHeaterShakerInProtocol ? (
          <Flex flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText as="h6" minWidth="6.2rem">
              {t('labware_latch')}
            </LegacyStyledText>
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              marginTop="3px"
            >
              <ToggleButton
                label={`heater_shaker_${
                  moduleLocation?.slotName ?? ''
                }_latch_toggle`}
                size={SIZE_AUTO}
                disabled={!isCorrectHeaterShakerAttached || isLatchLoading}
                toggledOn={isLatchClosed}
                onClick={toggleLatch}
                display={DISPLAY_FLEX}
                alignItems={ALIGN_CENTER}
              />
              <LegacyStyledText as="p" width="4rem">
                {hsLatchText}
              </LegacyStyledText>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType as ModuleTypesThatRequireExtraAttention}
          onCloseClick={() => {
            setSecureLabwareModalType(null)
          }}
        />
      )}
    </LabwareRow>
  )
}

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  width: 4.2rem;
  flex-shrink: 0;
`

function StandaloneLabware(props: {
  definition: LabwareDefinition2
}): JSX.Element {
  const { definition } = props
  return (
    <LabwareThumbnail
      viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
    >
      <LabwareRender
        definition={definition}
        wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
      />
    </LabwareThumbnail>
  )
}
