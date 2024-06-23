import * as React from 'react'
import {
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  BORDERS,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { LegacyModalShell } from '../../molecules/LegacyModal'

interface MenuListProps {
  children: React.ReactNode
  isOnDevice?: boolean
  onClick?: React.MouseEventHandler
}

export const MenuList = (props: MenuListProps): JSX.Element | null => {
  const { children, isOnDevice = false, onClick = null } = props
  return isOnDevice && onClick != null ? (
    <LegacyModalShell
      borderRadius={BORDERS.borderRadius16}
      width="max-content"
      onOutsideClick={onClick}
    >
      <Flex
        boxShadow={BORDERS.shadowSmall}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
      >
        {children}
      </Flex>
    </LegacyModalShell>
  ) : (
    <Flex
      borderRadius="4px 4px 0px 0px"
      zIndex={10}
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.6rem"
      right={`calc(50% + ${SPACING.spacing4})`}
      flexDirection={DIRECTION_COLUMN}
      width="max-content"
    >
      {children}
    </Flex>
  )
}
