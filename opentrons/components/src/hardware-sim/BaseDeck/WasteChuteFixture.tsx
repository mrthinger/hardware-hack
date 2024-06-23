import * as React from 'react'

import { Icon } from '../../icons'
import { Flex, Text } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  TEXT_ALIGN_CENTER,
} from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import { SlotBase } from './SlotBase'
import type {
  WASTE_CHUTE_CUTOUT,
  DeckDefinition,
  ModuleType,
} from '@opentrons/shared-data'

interface WasteChuteFixtureProps extends React.SVGProps<SVGGElement> {
  cutoutId: typeof WASTE_CHUTE_CUTOUT
  deckDefinition: DeckDefinition
  moduleType?: ModuleType
  fixtureBaseColor?: React.SVGProps<SVGPathElement>['fill']
  wasteChuteColor?: string
  showExtensions?: boolean
}

export function WasteChuteFixture(
  props: WasteChuteFixtureProps
): JSX.Element | null {
  const {
    cutoutId,
    deckDefinition,
    fixtureBaseColor = COLORS.grey35,
    wasteChuteColor = COLORS.grey50,
    ...restProps
  } = props

  if (cutoutId !== 'cutoutD3') {
    console.warn(
      `cannot render WasteChuteFixture in given cutout location ${cutoutId}`
    )
    return null
  }

  const cutoutDef = deckDefinition?.locations.cutouts.find(
    s => s.id === cutoutId
  )
  if (cutoutDef == null) {
    console.warn(
      `cannot render WasteChuteFixture, no cutout named: ${cutoutDef} in deck def ${deckDefinition?.otId}`
    )
    return null
  }

  return (
    <g {...restProps}>
      <SlotBase
        d="M314.8,96.1h238.9c2.4,0,4.3-1.9,4.3-4.3V-5.6c0-2.4-1.9-4.3-4.3-4.3H314.8c-2.4,0-4.3,1.9-4.3,4.3v97.4C310.5,94.2,312.4,96.1,314.8,96.1z"
        fill={fixtureBaseColor}
      />
      <WasteChute
        backgroundColor={wasteChuteColor}
        wasteIconColor={fixtureBaseColor}
      />
    </g>
  )
}

interface WasteChuteProps {
  wasteIconColor: string
  backgroundColor: string
}

/**
 * a deck map foreign object representing the physical location of the waste chute connected to the deck
 */
export function WasteChute(props: WasteChuteProps): JSX.Element {
  const { wasteIconColor, backgroundColor } = props

  return (
    <RobotCoordsForeignObject
      width={130}
      height={138}
      x={322}
      y={-51}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={backgroundColor}
        borderRadius="6px"
        color={wasteIconColor}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        justifyContent={JUSTIFY_CENTER}
        padding={SPACING.spacing8}
        width="100%"
      >
        <Icon name="trash" color={wasteIconColor} height="2rem" />
        <Text
          color={COLORS.white}
          textAlign={TEXT_ALIGN_CENTER}
          css={TYPOGRAPHY.bodyTextSemiBold}
        >
          Waste chute
        </Text>
      </Flex>
    </RobotCoordsForeignObject>
  )
}
