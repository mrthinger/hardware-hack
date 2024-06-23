import * as React from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'

import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RobotWorkSpace,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import {
  getDeckDefinitions,
  getLabwareDisplayName,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import * as Sessions from '../../redux/sessions'
import { NeedHelpLink } from './NeedHelpLink'
import { CalibrationLabwareRender } from './CalibrationLabwareRender'

import type { AddressableArea } from '@opentrons/shared-data'
import type { CalibrationPanelProps } from './types'

const TIPRACK = 'tip rack'

export function DeckSetup(props: CalibrationPanelProps): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])

  const { t } = useTranslation('robot_calibration')

  const { tipRack, calBlock, sendCommands, sessionType, activePipette } = props

  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK

  const proceed = (): void => {
    sendCommands({
      command:
        sessionType === Sessions.SESSION_TYPE_DECK_CALIBRATION ||
        sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
          ? Sessions.sharedCalCommands.MOVE_TO_TIP_RACK
          : Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
    })
  }
  const tipRackDisplayName =
    getLabwareDisplayName(tipRack?.definition) ?? TIPRACK
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Flex>
        <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText as="h1" marginBottom={SPACING.spacing16}>
            {t('prepare_the_space')}
          </LegacyStyledText>
          {isHealthCheck ? (
            <LegacyStyledText as="p">
              {t('to_check', { mount: activePipette?.mount })}
            </LegacyStyledText>
          ) : null}
          <Flex marginLeft={SPACING.spacing32}>
            <ul>
              <li>
                <LegacyStyledText as="p">
                  {t('place_full_tip_rack', {
                    tip_rack: isHealthCheck
                      ? activePipette?.tipRackDisplay
                      : tipRackDisplayName,
                  })}
                </LegacyStyledText>
              </li>
              {calBlock != null ? (
                <li>
                  <LegacyStyledText as="p">
                    {t('place_cal_block')}
                  </LegacyStyledText>
                </li>
              ) : null}
              {isHealthCheck ? (
                <li>
                  <LegacyStyledText as="p">
                    {t('clear_other_slots')}
                  </LegacyStyledText>
                </li>
              ) : null}
            </ul>
          </Flex>
        </Flex>
        <Flex flex="1 1 0" alignSelf={ALIGN_STRETCH}>
          <RobotWorkSpace
            deckLayerBlocklist={[
              'fixedBase',
              'doorStops',
              'metalFrame',
              'removalHandle',
              'removableDeckOutline',
              'screwHoles',
              'calibrationMarkings',
              'fixedTrash',
            ]}
            deckDef={deckDef}
            showDeckLayers
            viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
          >
            {({ deckSlotsById }) =>
              map(deckSlotsById, (slot: AddressableArea, slotId) => {
                if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
                let labwareDef = null
                if (String(tipRack?.slot) === slotId) {
                  labwareDef = tipRack?.definition
                } else if (
                  calBlock != null &&
                  String(calBlock?.slot) === slotId
                ) {
                  labwareDef = calBlock?.definition
                }

                const slotDefPosition = getPositionFromSlotId(slot.id, deckDef)

                return labwareDef != null ? (
                  <CalibrationLabwareRender
                    key={slotId}
                    slotDefPosition={slotDefPosition}
                    labwareDef={labwareDef}
                  />
                ) : null
              })
            }
          </RobotWorkSpace>
        </Flex>
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing32}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink />
        <PrimaryButton onClick={proceed}>
          {t('confirm_placement')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
