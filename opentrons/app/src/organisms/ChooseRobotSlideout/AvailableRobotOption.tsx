import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SIZE_1,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MiniCard } from '../../molecules/MiniCard'
import { getRobotModelByName, OPENTRONS_USB } from '../../redux/discovery'
import { getNetworkInterfaces, fetchStatus } from '../../redux/networking'
import { appShellRequestor } from '../../redux/shell/remote'
import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import FLEX_PNG from '../../assets/images/FLEX.png'
import { useNotifyAllRunsQuery } from '../../resources/runs'

import type { IconName } from '@opentrons/components'
import type { Runs } from '@opentrons/api-client'
import type { Robot } from '../../redux/discovery/types'
import type { Dispatch, State } from '../../redux/types'
import type { RobotBusyStatusAction } from '.'

interface AvailableRobotOptionProps {
  robot: Robot
  onClick: () => void
  isSelected: boolean
  isSelectedRobotOnDifferentSoftwareVersion: boolean
  registerRobotBusyStatus: React.Dispatch<RobotBusyStatusAction>
  isError?: boolean
  showIdleOnly?: boolean
}

export function AvailableRobotOption(
  props: AvailableRobotOptionProps
): JSX.Element | null {
  const {
    robot,
    onClick,
    isSelected,
    isError = false,
    isSelectedRobotOnDifferentSoftwareVersion,
    showIdleOnly = false,
    registerRobotBusyStatus,
  } = props
  const { ip, local, name: robotName } = robot ?? {}
  const { t } = useTranslation(['protocol_list', 'branded'])
  const dispatch = useDispatch<Dispatch>()
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robotName)
  )

  const { data: runsData } = useNotifyAllRunsQuery(
    { pageLength: 0 },
    {
      onSuccess: data => {
        if ((data as Runs)?.links?.current != null)
          registerRobotBusyStatus({ type: 'robotIsBusy', robotName })
        else {
          registerRobotBusyStatus({ type: 'robotIsIdle', robotName })
        }
      },
    },
    {
      hostname: ip,
      requestor: ip === OPENTRONS_USB ? appShellRequestor : undefined,
    }
  )
  const robotHasCurrentRun = runsData?.links?.current != null

  const { ethernet, wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )

  let iconName: IconName | null = null
  if (ethernet?.ipAddress != null) {
    iconName = 'ethernet'
  } else if (wifi?.ipAddress != null) {
    iconName = 'wifi'
  } else if (local != null && local) {
    iconName = 'usb'
  }

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return showIdleOnly && robotHasCurrentRun ? null : (
    <>
      <MiniCard
        onClick={onClick}
        isSelected={isSelected}
        isError={
          (isError || isSelectedRobotOnDifferentSoftwareVersion) && isSelected
        }
      >
        <img
          src={robotModel === 'OT-2' ? OT2_PNG : FLEX_PNG}
          css={css`
            width: 4rem;
            height: 3.5625rem;
          `}
        />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginLeft={SPACING.spacing16}
          marginTop={SPACING.spacing8}
          marginBottom={SPACING.spacing16}
        >
          <LegacyStyledText as="h6" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {robotModel}
          </LegacyStyledText>
          <Box maxWidth="9.5rem">
            <LegacyStyledText
              as="p"
              overflowWrap="break-word"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {robotName}
              <Icon
                aria-label={iconName}
                marginBottom={`-${SPACING.spacing4}`}
                marginLeft={SPACING.spacing8}
                name={iconName ?? 'wifi'}
                size={SIZE_1}
              />
            </LegacyStyledText>
          </Box>
        </Flex>
        {(isError || isSelectedRobotOnDifferentSoftwareVersion) &&
        isSelected ? (
          <>
            <Box flex="1 1 auto" />
            <Icon name="alert-circle" size="1.25rem" color={COLORS.red50} />
          </>
        ) : null}
      </MiniCard>

      {isSelectedRobotOnDifferentSoftwareVersion && isSelected ? (
        <LegacyStyledText
          as="label"
          color={COLORS.red60}
          marginBottom={SPACING.spacing8}
          css={css`
            & > a {
              color: ${COLORS.red60};
              text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
            }
          `}
        >
          <Trans
            t={t}
            i18nKey="branded:a_robot_software_update_is_available"
            components={{
              robotLink: <NavLink to={`/devices/${robotName}`} />,
            }}
          />
        </LegacyStyledText>
      ) : null}
    </>
  )
}
