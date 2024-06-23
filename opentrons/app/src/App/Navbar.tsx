import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  COLORS,
  DIRECTION_COLUMN,
  FLEX_NONE,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  Link,
  SIZE_2,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import logoSvg from '../assets/images/logo_nav.svg'
import logoSvgThree from '../assets/images/logo_nav_three.svg'

import { NAV_BAR_WIDTH } from './constants'

import type { RouteProps } from './types'

const SALESFORCE_HELP_LINK = 'https://support.opentrons.com/s/'
const PROJECT: string = _OPENTRONS_PROJECT_

const NavbarLink = styled(NavLink)`
  color: ${COLORS.white};
  align-self: ${ALIGN_STRETCH};
  background-color: ${COLORS.black90};

  &:hover {
    background-color: ${COLORS.black80};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 3px ${COLORS.blue50};
    outline: none;
    background-color: ${COLORS.grey60};
  }

  &:focus-visible.active {
    box-shadow: none;
    outline: none;
  }

  &:active {
    background-color: ${COLORS.black90};
  }

  &.active {
    background-color: ${COLORS.black70};
  }
  &.active:has(svg) {
    background-color: ${COLORS.black90};
  }
`
const NavIconLink = styled(NavLink)`
  &.active > svg {
    color: ${COLORS.grey30};
    background-color: ${COLORS.black70};
  }
`
const IconLink = styled(Link)`
  &.active > svg {
    color: ${COLORS.grey30};
    background-color: ${COLORS.black70};
  }
`

const NavbarIcon = styled(Icon)`
  width: ${SIZE_2};
  height: ${SIZE_2};
  padding: ${SPACING.spacing6};
  border-radius: 50%;
  color: ${COLORS.grey30};
  background-color: ${COLORS.transparent};

  &:hover {
    background-color: ${COLORS.black80};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 3px ${COLORS.blue50};
    outline: none;
    background-color: ${COLORS.grey60};
  }

  &:active {
    color: ${COLORS.grey30};
    background-color: ${COLORS.black90};
  }

  &.active {
    color: ${COLORS.grey30};
    background-color: ${COLORS.black70};
  }
`

const LogoImg = styled('img')`
  align-self: ${ALIGN_CENTER};
  margin: ${SPACING.spacing24} 0;
`

export function Navbar({ routes }: { routes: RouteProps[] }): JSX.Element {
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  return (
    <Flex
      backgroundColor={COLORS.black90}
      css={TYPOGRAPHY.h3Regular}
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      width={NAV_BAR_WIDTH}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex={FLEX_NONE}
        alignItems={ALIGN_FLEX_START}
        alignSelf={ALIGN_STRETCH}
      >
        <LogoImg
          src={PROJECT === 'ot3' ? logoSvgThree : logoSvg}
          alt="opentrons logo"
        />
        {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
          <NavbarLink key={name} to={navLinkTo as string}>
            <LegacyStyledText
              as="h3"
              margin={`${SPACING.spacing8} 0 ${SPACING.spacing8} ${SPACING.spacing12}`}
            >
              {name}
            </LegacyStyledText>
          </NavbarLink>
        ))}
      </Flex>
      <Flex
        marginBottom={SPACING.spacing8}
        alignSelf={ALIGN_STRETCH}
        justifyContent={JUSTIFY_SPACE_EVENLY}
      >
        <NavIconLink data-testid="Navbar_settingsLink" to="/app-settings">
          <NavbarIcon name="gear" />
        </NavIconLink>
        <IconLink href={SALESFORCE_HELP_LINK} external>
          <NavbarIcon
            data-testid="Navbar_helpLink"
            name="question-mark-circle"
          />
        </IconLink>
      </Flex>
    </Flex>
  )
}
